import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ViralUser, MiningSession, TelegramUser } from '@/types/telegram';

export const useViralMining = (telegramUser: TelegramUser | null) => {
  const [user, setUser] = useState<ViralUser | null>(null);
  const [activeMiningSession, setActiveMiningSession] = useState<MiningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState<{
    progress: number;
    tokensMinedSoFar: number;
    timeRemaining: number;
    isComplete: boolean;
  } | null>(null);

  // Initialize or get user
  const initializeUser = useCallback(async () => {
    if (!telegramUser) return;

    try {
      setLoading(true);
      
      // Sync Telegram user data first
      const { data: syncResult, error: syncError } = await supabase.functions.invoke('sync-telegram-user', {
        body: { telegramUser }
      });

      if (syncError) {
        console.error('Error syncing user:', syncError);
        throw syncError;
      }

      if (syncResult?.user) {
        setUser(syncResult.user);
        
        // Update last_active_at timestamp
        await supabase
          .from('viral_users')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', syncResult.user.id);
          
        console.log('User synced successfully:', syncResult.message);
      }

      // Check for active mining session
      await checkActiveMiningSession();
      
    } catch (err: any) {
      console.error('Error initializing user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [telegramUser]);

  // Check for active mining session
  const checkActiveMiningSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: session, error } = await supabase
        .from('viral_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (session) {
        const now = new Date();
        const endTime = new Date(session.end_time);
        
        if (now < endTime) {
          setActiveMiningSession(session);
        } else {
          // Session expired, complete it
          await completeMiningSession(session.id);
        }
      }
    } catch (err: any) {
      console.error('Error checking mining session:', err);
    }
  }, [user]);

  // Start mining session
  const startMining = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + user.mining_duration_hours * 60 * 60 * 1000);

      const { data: session, error } = await supabase
        .from('viral_mining_sessions')
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          tokens_per_hour: 1.0,
          mining_power_multiplier: user.mining_power_multiplier,
        })
        .select()
        .single();

      if (error) throw error;
      setActiveMiningSession(session);
      
    } catch (err: any) {
      console.error('Error starting mining:', err);
      setError(err.message);
    }
  }, [user]);

  // Complete mining session
  const completeMiningSession = useCallback(async (sessionId: string) => {
    try {
      // Call edge function to calculate rewards
      const { data, error } = await supabase.functions.invoke('complete-mining-session', {
        body: { sessionId }
      });

      if (error) throw error;

      setActiveMiningSession(null);
      
      // Refresh user data to get updated balance
      if (user) {
        const { data: updatedUser } = await supabase
          .from('viral_users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
      
    } catch (err: any) {
      console.error('Error completing mining session:', err);
      setError(err.message);
    }
  }, [user]);

  // Calculate current mining progress
  const getCurrentMiningProgress = useCallback(() => {
    if (!activeMiningSession) return null;

    const now = new Date();
    const startTime = new Date(activeMiningSession.start_time);
    const endTime = new Date(activeMiningSession.end_time);
    
    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsed = now.getTime() - startTime.getTime();
    const remaining = Math.max(0, endTime.getTime() - now.getTime());
    
    const progress = Math.min(1, elapsed / totalDuration);
    const tokensMinedSoFar = (elapsed / (1000 * 60 * 60)) * activeMiningSession.tokens_per_hour * activeMiningSession.mining_power_multiplier;
    
    return {
      progress,
      tokensMinedSoFar: Math.max(0, tokensMinedSoFar),
      timeRemaining: remaining,
      isComplete: remaining <= 0
    };
  }, [activeMiningSession]);

  // Upgrade mining power
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

      const { error: fnError } = await supabase.functions.invoke('upgrade-mining-power', {
        body: { userId: user.id }
      });

      if (fnError) {
        console.warn('upgrade-mining-power failed, applying client fallback:', fnError);
        // Record the upgrade and update user directly as a fallback
        await supabase.from('viral_upgrades').insert({
          user_id: user.id,
          upgrade_type: 'mining_power',
          upgrade_level: nextMultiplier,
          cost_ton: 0.5,
        });
        await supabase
          .from('viral_users')
          .update({ mining_power_multiplier: nextMultiplier, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Refresh user data
      const { data: updatedUser } = await supabase
        .from('viral_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser);
      }
      
    } catch (err: any) {
      console.error('Error upgrading mining power:', err);
      setError(err.message);
    }
  }, [user]);

  // Upgrade mining duration
  const upgradeMiningDuration = useCallback(async () => {
    if (!user) return;

    try {
      const current = Number(user.mining_duration_hours) || 4;
      let nextDuration: number;
      if (current === 4) nextDuration = 12;
      else if (current === 12) nextDuration = 24;
      else nextDuration = 24;

      const { error: fnError } = await supabase.functions.invoke('upgrade-mining-duration', {
        body: { userId: user.id }
      });

      if (fnError) {
        console.warn('upgrade-mining-duration failed, applying client fallback:', fnError);
        // Record the upgrade and update user directly as a fallback
        await supabase.from('viral_upgrades').insert({
          user_id: user.id,
          upgrade_type: 'mining_duration',
          upgrade_level: nextDuration,
          cost_ton: 0.5,
        });
        await supabase
          .from('viral_users')
          .update({ mining_duration_hours: nextDuration, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Refresh user data
      const { data: updatedUser } = await supabase
        .from('viral_users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (updatedUser) {
        setUser(updatedUser);
      }
      
    } catch (err: any) {
      console.error('Error upgrading mining duration:', err);
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

  // Real-time updates for mining progress
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
    clearError: () => setError(null)
  };
};