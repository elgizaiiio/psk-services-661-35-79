import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TelegramUser } from '@/types/telegram';
import { logger } from '@/lib/logger';

interface ViralUser {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power_multiplier: number;
  mining_duration_hours: number;
  total_referrals: number;
  referral_bonus: number;
  last_active_at?: string;
  created_at: string;
  updated_at: string;
}

interface MiningSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_per_hour: number;
  mining_power_multiplier: number;
  total_mined: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
}

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

  const initializeUser = useCallback(async () => {
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get Telegram initData for secure authentication
      const initData = window.Telegram?.WebApp?.initData || '';
      
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-telegram-user', {
        body: { telegramUser },
        headers: {
          'x-telegram-init-data': initData
        }
      });

      if (syncError) {
        logger.error('Error syncing user', syncError);
        throw syncError;
      }

      if (syncResult?.user) {
        setUser(syncResult.user as ViralUser);
        logger.info('User synced successfully', { message: syncResult.message });
        
        // Check if this is a new user
        if (syncResult.message === 'User profile created') {
          const welcomeKey = `bolt_welcome_shown_${syncResult.user.id}`;
          if (!localStorage.getItem(welcomeKey)) {
            setIsNewUser(true);
            localStorage.setItem(welcomeKey, 'true');
          }
        }
      }

      await checkActiveMiningSession();
      
    } catch (err: any) {
      logger.error('Error initializing user', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [telegramUser]);

  const checkActiveMiningSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: session, error } = await supabase
        .from('bolt_mining_sessions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (session) {
        const sessionData = session as unknown as MiningSession;
        const now = new Date();
        const endTime = new Date(sessionData.end_time);
        
        if (now < endTime) {
          setActiveMiningSession(sessionData);
        } else {
          await completeMiningSession(sessionData.id);
        }
      }
    } catch (err: any) {
      logger.error('Error checking mining session', err);
    }
  }, [user]);

  const startMining = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + user.mining_duration_hours * 60 * 60 * 1000);

      const { data: session, error } = await supabase
        .from('bolt_mining_sessions' as any)
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          tokens_per_hour: 1.0,
          mining_power: user.mining_power_multiplier,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveMiningSession(session as unknown as MiningSession);
      logger.info('Mining session started');
    } catch (err: any) {
      logger.error('Error starting mining', err);
      setError(err.message);
    }
  }, [user]);

  const completeMiningSession = useCallback(async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('complete-mining-session', {
        body: { sessionId }
      });

      if (error) throw error;

      setActiveMiningSession(null);
      logger.info('Mining session completed');
      
      if (user) {
        const { data: updatedUser } = await supabase
          .from('bolt_users' as any)
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (updatedUser) {
          setUser(updatedUser as unknown as ViralUser);
        }
      }
      
    } catch (err: any) {
      logger.error('Error completing mining session', err);
      setError(err.message);
    }
  }, [user]);

  const getCurrentMiningProgress = useCallback(() => {
    if (!activeMiningSession) return null;

    const now = new Date();
    const startTime = new Date(activeMiningSession.start_time);
    const endTime = new Date(activeMiningSession.end_time);
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    const progress = Math.min(1, elapsed / totalDuration);
    const miningPower = (activeMiningSession as any).mining_power || activeMiningSession.mining_power_multiplier || 1;
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
      const current = Number(user.mining_power_multiplier) || 1;
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

      await supabase
        .from('bolt_users' as any)
        .update({ mining_power: nextMultiplier, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const { data: updatedUser } = await supabase
        .from('bolt_users' as any)
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser as unknown as ViralUser);
      }
      logger.info('Mining power upgraded', { nextMultiplier });
    } catch (err: any) {
      logger.error('Error upgrading mining power', err);
      setError(err.message);
    }
  }, [user]);

  const upgradeMiningDuration = useCallback(async () => {
    if (!user) return;

    try {
      const current = Number(user.mining_duration_hours) || 4;
      let nextDuration: number;
      if (current === 4) nextDuration = 12;
      else if (current === 12) nextDuration = 24;
      else nextDuration = 24;

      await supabase
        .from('bolt_users' as any)
        .update({ mining_duration_hours: nextDuration, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      const { data: updatedUser } = await supabase
        .from('bolt_users' as any)
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser as unknown as ViralUser);
      }
      logger.info('Mining duration upgraded', { nextDuration });
    } catch (err: any) {
      logger.error('Error upgrading mining duration', err);
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  useEffect(() => {
    if (user) {
      checkActiveMiningSession();
    }
  }, [user, checkActiveMiningSession]);

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
