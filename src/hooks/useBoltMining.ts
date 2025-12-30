import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BoltUser, BoltMiningSession, TelegramUser } from '@/types/bolt';
import { createLogger } from '@/lib/logger';

const logger = createLogger('BoltMining');

interface MiningProgress {
  progress: number;
  tokensMinedSoFar: number;
  timeRemaining: number;
  isComplete: boolean;
}

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

export const useBoltMining = (telegramUser: TelegramUser | null) => {
  const [user, setUser] = useState<BoltUser | null>(null);
  const [activeMiningSession, setActiveMiningSession] = useState<BoltMiningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState<MiningProgress | null>(null);

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
      
      // Use backend function for secure user sync
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
        setUser(result.user as BoltUser);
        
        if (result.session) {
          setActiveMiningSession(result.session as BoltMiningSession);
        } else {
          setActiveMiningSession(null);
        }

        // Handle auto-completed session notification
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
      logger.error('Cannot start mining: user not initialized');
      setError('Please open the app from within Telegram');
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
        setActiveMiningSession(result.session as BoltMiningSession);
        logger.info('Mining started', { sessionId: result.session.id });
      }

      if (result?.user) {
        setUser(result.user as BoltUser);
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

  const getCurrentMiningProgress = useCallback((): MiningProgress | null => {
    if (!activeMiningSession) return null;

    const now = new Date();
    const startTime = new Date(activeMiningSession.start_time);
    const endTime = new Date(activeMiningSession.end_time);
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    const progress = Math.min(1, elapsed / totalDuration);
    const tokensMinedSoFar = (elapsed / (1000 * 60 * 60)) * activeMiningSession.tokens_per_hour * activeMiningSession.mining_power;
    
    return { progress, tokensMinedSoFar: Math.max(0, tokensMinedSoFar), timeRemaining: remaining, isComplete: remaining <= 0 };
  }, [activeMiningSession]);

  const upgradeMiningPower = useCallback(async () => {
    if (!user) return;
    try {
      setError(null);
      const current = Number(user.mining_power) || 1;
      const nextPower = current < 10 ? current + 2 : current < 50 ? current + 10 : Math.min(200, current + 25);

      await supabase.from('bolt_upgrade_purchases').insert({ user_id: user.id, upgrade_type: 'mining_power', amount_paid: 0.5 });

      const { data: updatedUser, error: updateError } = await supabase
        .from('bolt_users')
        .update({ mining_power: nextPower, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (updatedUser) setUser(updatedUser as unknown as BoltUser);
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
      const nextDuration = current === 4 ? 12 : current === 12 ? 24 : 24;

      await supabase.from('bolt_upgrade_purchases').insert({ user_id: user.id, upgrade_type: 'mining_duration', amount_paid: 0.5 });

      const { data: updatedUser, error: updateError } = await supabase
        .from('bolt_users')
        .update({ mining_duration_hours: nextDuration, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (updatedUser) setUser(updatedUser as unknown as BoltUser);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('Error upgrading mining duration', err);
      setError(errorMessage);
    }
  }, [user]);

  useEffect(() => { initializeUser(); }, [initializeUser]);

  useEffect(() => {
    if (!activeMiningSession) { setMiningProgress(null); return; }
    const update = () => {
      const progress = getCurrentMiningProgress();
      setMiningProgress(progress);
      if (progress?.isComplete) completeMiningSession(activeMiningSession.id);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeMiningSession, getCurrentMiningProgress, completeMiningSession]);

  return { 
    user, 
    activeMiningSession, 
    loading, 
    error, 
    startMining, 
    completeMiningSession, 
    getCurrentMiningProgress, 
    miningProgress, 
    upgradeMiningPower, 
    upgradeMiningDuration, 
    refreshUser: initializeUser, 
    clearError: () => setError(null) 
  };
};
