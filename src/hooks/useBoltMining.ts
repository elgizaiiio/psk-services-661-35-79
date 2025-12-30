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

export const useBoltMining = (telegramUser: TelegramUser | null) => {
  const [user, setUser] = useState<BoltUser | null>(null);
  const [activeMiningSession, setActiveMiningSession] = useState<BoltMiningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState<MiningProgress | null>(null);

  const initializeUser = useCallback(async () => {
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const { data: existingUser, error: fetchError } = await supabase
        .from('bolt_users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (existingUser) {
        const typedUser = existingUser as unknown as BoltUser;
        const { data: updatedUser, error: updateError } = await supabase
          .from('bolt_users')
          .update({
            telegram_username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', typedUser.id)
          .select()
          .single();

        if (updateError) throw updateError;
        setUser(updatedUser as unknown as BoltUser);
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('bolt_users')
          .insert({
            telegram_id: telegramUser.id,
            telegram_username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            photo_url: telegramUser.photo_url,
            token_balance: 0,
            mining_power: 1,
            mining_duration_hours: 4,
            total_referrals: 0,
            referral_bonus: 0
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setUser(newUser as unknown as BoltUser);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error initializing user', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [telegramUser]);

  const checkActiveMiningSession = useCallback(async () => {
    if (!user) return;

    try {
      const { data: session, error: sessionError } = await supabase
        .from('bolt_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError && sessionError.code !== 'PGRST116') throw sessionError;

      if (session) {
        const sessionData = session as unknown as BoltMiningSession;
        const now = new Date();
        const endTime = new Date(sessionData.end_time);
        
        if (now < endTime) {
          setActiveMiningSession(sessionData);
        } else {
          await completeMiningSession(sessionData.id);
        }
      }
    } catch (err) {
      logger.error('Error checking mining session', err);
    }
  }, [user]);

  const startMining = useCallback(async () => {
    if (!user) {
      logger.error('Cannot start mining: user not initialized');
      setError('Please open the app from within Telegram');
      return;
    }

    try {
      const { data: existingSession } = await supabase
        .from('bolt_mining_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingSession) {
        setActiveMiningSession(existingSession as unknown as BoltMiningSession);
        return;
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + user.mining_duration_hours * 60 * 60 * 1000);

      const { data: session, error: insertError } = await supabase
        .from('bolt_mining_sessions')
        .insert({
          user_id: user.id,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          tokens_per_hour: 1.0,
          mining_power: user.mining_power,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      setActiveMiningSession(session as unknown as BoltMiningSession);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error starting mining', err);
      setError(errorMessage);
    }
  }, [user]);

  const completeMiningSession = useCallback(async (sessionId: string) => {
    try {
      const { data: session, error: sessionError } = await supabase
        .from('bolt_mining_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const sessionData = session as unknown as BoltMiningSession;
      const startTime = new Date(sessionData.start_time);
      const endTime = new Date(sessionData.end_time);
      const now = new Date();
      const actualEndTime = now < endTime ? now : endTime;
      
      const hoursWorked = (actualEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      const tokensMined = hoursWorked * sessionData.tokens_per_hour * sessionData.mining_power;

      await supabase
        .from('bolt_mining_sessions')
        .update({ is_active: false, completed_at: new Date().toISOString(), total_mined: tokensMined })
        .eq('id', sessionId);

      if (user) {
        const newBalance = (Number(user.token_balance) || 0) + tokensMined;
        const { data: updatedUser } = await supabase
          .from('bolt_users')
          .update({ token_balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', user.id)
          .select()
          .single();

        if (updatedUser) setUser(updatedUser as unknown as BoltUser);
      }

      setActiveMiningSession(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error completing mining session', err);
      setError(errorMessage);
    }
  }, [user]);

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
      const current = Number(user.mining_power) || 1;
      const nextPower = current < 10 ? current + 2 : current < 50 ? current + 10 : Math.min(200, current + 25);

      await supabase.from('bolt_upgrade_purchases').insert({ user_id: user.id, upgrade_type: 'mining_power', amount_paid: 0.5 });

      const { data: updatedUser } = await supabase
        .from('bolt_users')
        .update({ mining_power: nextPower, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedUser) setUser(updatedUser as unknown as BoltUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error upgrading mining power', err);
      setError(errorMessage);
    }
  }, [user]);

  const upgradeMiningDuration = useCallback(async () => {
    if (!user) return;
    try {
      const current = Number(user.mining_duration_hours) || 4;
      const nextDuration = current === 4 ? 12 : current === 12 ? 24 : 24;

      await supabase.from('bolt_upgrade_purchases').insert({ user_id: user.id, upgrade_type: 'mining_duration', amount_paid: 0.5 });

      const { data: updatedUser } = await supabase
        .from('bolt_users')
        .update({ mining_duration_hours: nextDuration, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedUser) setUser(updatedUser as unknown as BoltUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error upgrading mining duration', err);
      setError(errorMessage);
    }
  }, [user]);

  useEffect(() => { initializeUser(); }, [initializeUser]);
  useEffect(() => { if (user) checkActiveMiningSession(); }, [user, checkActiveMiningSession]);

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
