import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TelegramUser, ViralUser, MiningSession } from '@/types/telegram';
import { logger } from '@/lib/logger';

// Helper to extract error message from various error types
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    if (e.message) return String(e.message);
    if (e.error) return String(e.error);
    if (e.details) return String(e.details);
  }
  return 'An unexpected error occurred';
};

export const useViralMining = (telegramUser: TelegramUser | null) => {
  const [user, setUser] = useState<ViralUser | null>(null);
  const [activeMiningSession, setActiveMiningSession] = useState<MiningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [miningProgress, setMiningProgress] = useState<{
    progress: number;
    tokensMinedSoFar: number;
    timeRemaining: number;
    isComplete: boolean;
  } | null>(null);

  const getInitData = useCallback(() => {
    return window.Telegram?.WebApp?.initData || '';
  }, []);

  const initializeUser = useCallback(async () => {
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const initData = getInitData();
      
      // Use backend function for secure user sync and status check
      const { data: result, error: syncError } = await supabase.functions.invoke('get-mining-status', {
        body: { telegramUser },
        headers: {
          'x-telegram-init-data': initData
        }
      });

      if (syncError) {
        logger.error('Error syncing user', syncError);
        throw new Error(getErrorMessage(syncError));
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.user) {
        setUser(result.user as ViralUser);
        logger.info('User synced successfully');
        
        // Check if this is a new user (no session, low balance)
        if (!result.session && Number(result.user.token_balance) === 0) {
          const welcomeKey = `bolt_welcome_shown_${result.user.id}`;
          if (!localStorage.getItem(welcomeKey)) {
            setIsNewUser(true);
            localStorage.setItem(welcomeKey, 'true');
          }
        }

        if (result.session) {
          setActiveMiningSession(result.session as MiningSession);
        } else {
          setActiveMiningSession(null);
        }

        // Handle auto-completed session
        if (result.completedSession) {
          logger.info('Session auto-completed', result.completedSession);
        }
      }
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error initializing user', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [telegramUser, getInitData]);

  const startMining = useCallback(async () => {
    if (!telegramUser) {
      setError('Please open the app from Telegram');
      return;
    }

    try {
      setError(null);
      const initData = getInitData();

      const { data: result, error: startError } = await supabase.functions.invoke('start-mining-session', {
        body: { telegramUser },
        headers: {
          'x-telegram-init-data': initData
        }
      });

      if (startError) {
        logger.error('Error starting mining', startError);
        throw new Error(getErrorMessage(startError));
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.session) {
        setActiveMiningSession(result.session as MiningSession);
        logger.info('Mining session started', { sessionId: result.session.id });
      }

      if (result?.user) {
        setUser(result.user as ViralUser);
      }
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error starting mining', err);
      setError(errorMessage);
    }
  }, [telegramUser, getInitData]);

  const completeMiningSession = useCallback(async (sessionId: string) => {
    try {
      setError(null);
      const telegramId = telegramUser?.id?.toString() || '';

      const { data: result, error: completeError } = await supabase.functions.invoke('complete-mining-session', {
        body: { sessionId },
        headers: {
          'x-telegram-id': telegramId
        }
      });

      if (completeError) {
        logger.error('Error completing session', completeError);
        throw new Error(getErrorMessage(completeError));
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setActiveMiningSession(null);
      logger.info('Mining session completed', { totalReward: result?.totalReward });
      
      // Refresh user data
      await initializeUser();
      
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error completing mining session', err);
      setError(errorMessage);
    }
  }, [telegramUser, initializeUser]);

  const getCurrentMiningProgress = useCallback(() => {
    if (!activeMiningSession) return null;

    const now = new Date();
    const startTime = new Date(activeMiningSession.start_time);
    const endTime = new Date(activeMiningSession.end_time);
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    const progress = Math.min(1, elapsed / totalDuration);
    const miningPower = activeMiningSession.mining_power || 1;
    const tokensMinedSoFar = (elapsed / (1000 * 60 * 60)) * activeMiningSession.tokens_per_hour * miningPower;
    
    return {
      progress,
      tokensMinedSoFar: Math.max(0, tokensMinedSoFar),
      timeRemaining: remaining,
      isComplete: remaining <= 0
    };
  }, [activeMiningSession]);

  const upgradeMiningPower = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const current = Number(user.mining_power) || 1;
      let nextMultiplier: number;
      if (current < 10) {
        nextMultiplier = current + 2;
      } else if (current < 50) {
        nextMultiplier = current + 10;
      } else if (current < 100) {
        nextMultiplier = current + 25;
      } else {
        nextMultiplier = Math.min(200, current + 50);
      }

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({ mining_power: nextMultiplier, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { data: updatedUser } = await supabase
        .from('bolt_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser as unknown as ViralUser);
      }
      logger.info('Mining power upgraded', { nextMultiplier });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error upgrading mining power', err);
      setError(errorMessage);
    }
  }, [user]);

  const upgradeMiningDuration = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      const current = Number(user.mining_duration_hours) || 4;
      let nextDuration: number;
      if (current === 4) nextDuration = 12;
      else if (current === 12) nextDuration = 24;
      else nextDuration = 24;

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({ mining_duration_hours: nextDuration, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const { data: updatedUser } = await supabase
        .from('bolt_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser as unknown as ViralUser);
      }
      logger.info('Mining duration upgraded', { nextDuration });
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error upgrading mining duration', err);
      setError(errorMessage);
    }
  }, [user]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    if (!activeMiningSession) {
      setMiningProgress(null);
      return;
    }

    const update = () => {
      const progress = getCurrentMiningProgress();
      setMiningProgress(progress);
      if (progress?.isComplete) {
        completeMiningSession(activeMiningSession.id);
      }
    };

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [activeMiningSession, getCurrentMiningProgress, completeMiningSession]);

  const dismissWelcome = useCallback(() => {
    setIsNewUser(false);
  }, []);

  return {
    user,
    activeMiningSession,
    loading,
    error,
    isNewUser,
    dismissWelcome,
    startMining,
    completeMiningSession,
    getCurrentMiningProgress,
    miningProgress,
    upgradeMiningPower,
    upgradeMiningDuration,
    clearError: () => setError(null)
  };
};
