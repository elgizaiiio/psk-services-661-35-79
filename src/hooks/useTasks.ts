import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { BoltTask, BoltCompletedTask, BoltDailyCode, BoltDailyCodeAttempt } from '@/types/bolt';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Tasks');

export const useTasks = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(telegramUser);
  
  const [tasks, setTasks] = useState<BoltTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<BoltCompletedTask[]>([]);
  const [dailyCodes, setDailyCodes] = useState<BoltDailyCode | null>(null);
  const [dailyCodeAttempt, setDailyCodeAttempt] = useState<BoltDailyCodeAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('bolt_tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setTasks((data || []) as unknown as BoltTask[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error loading tasks', err);
      setError(errorMessage);
    }
  }, []);

  const loadCompletedTasks = useCallback(async () => {
    if (!boltUser) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('bolt_completed_tasks')
        .select('*')
        .eq('user_id', boltUser.id);

      if (fetchError) throw fetchError;
      setCompletedTasks((data || []) as unknown as BoltCompletedTask[]);
    } catch (err) {
      logger.error('Error loading completed tasks', err);
    }
  }, [boltUser]);

  const loadDailyCodes = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error: fetchError } = await supabase
        .from('bolt_daily_codes')
        .select('*')
        .eq('date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setDailyCodes(data as unknown as BoltDailyCode | null);
    } catch (err) {
      logger.error('Error loading daily codes', err);
    }
  }, []);

  const loadDailyCodeAttempt = useCallback(async () => {
    if (!boltUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error: fetchError } = await supabase
        .from('bolt_daily_code_attempts')
        .select('*')
        .eq('user_id', boltUser.id)
        .eq('date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;
      setDailyCodeAttempt(data as unknown as BoltDailyCodeAttempt | null);
    } catch (err) {
      logger.error('Error loading daily code attempt', err);
    }
  }, [boltUser]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!boltUser) throw new Error('User not found');

    try {
      const { data: task, error: taskError } = await supabase
        .from('bolt_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      const taskData = task as unknown as BoltTask;

      const { data: existing } = await supabase
        .from('bolt_completed_tasks')
        .select('*')
        .eq('user_id', boltUser.id)
        .eq('task_id', taskId)
        .maybeSingle();

      if (existing) {
        throw new Error('Task already completed');
      }

      const { error: insertError } = await supabase
        .from('bolt_completed_tasks')
        .insert({
          user_id: boltUser.id,
          task_id: taskId,
          points_earned: taskData.points,
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (Number(boltUser.token_balance) || 0) + taskData.points
        })
        .eq('id', boltUser.id);

      if (updateError) throw updateError;

      await loadCompletedTasks();
      await loadTasks();
      
    } catch (err) {
      logger.error('Error completing task', err);
      throw err;
    }
  }, [boltUser, loadCompletedTasks, loadTasks]);

  const checkDailyCode = useCallback(async (inputCodes: string[]) => {
    if (!boltUser || !dailyCodes) {
      throw new Error('Missing data');
    }

    const correctCodes = [
      dailyCodes.code1,
      dailyCodes.code2,
      dailyCodes.code3,
      dailyCodes.code4
    ];

    const isCorrect = inputCodes.every((code, index) => code === correctCodes[index]);

    if (!isCorrect) {
      throw new Error('Invalid codes');
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error: upsertError } = await supabase
        .from('bolt_daily_code_attempts')
        .upsert({
          user_id: boltUser.id,
          date: today,
          completed_at: new Date().toISOString(),
          points_earned: dailyCodes.points_reward || 500
        })
        .select()
        .single();

      if (upsertError) throw upsertError;

      const { error: updateError } = await supabase
        .from('bolt_users')
        .update({
          token_balance: (Number(boltUser.token_balance) || 0) + (dailyCodes.points_reward || 500)
        })
        .eq('id', boltUser.id);

      if (updateError) throw updateError;

      setDailyCodeAttempt(data as unknown as BoltDailyCodeAttempt);
      
    } catch (err) {
      logger.error('Error checking daily code', err);
      throw err;
    }
  }, [boltUser, dailyCodes]);

  useEffect(() => {
    if (!completedTasks || completedTasks.length === 0) return;
    setTasks(prev => prev.filter(t => !completedTasks.some(c => c.task_id === t.id)));
  }, [completedTasks]);

  const hasDailyCodeCompleted = useCallback(() => {
    return dailyCodeAttempt?.completed_at != null;
  }, [dailyCodeAttempt]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadTasks(), loadDailyCodes()]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [loadTasks, loadDailyCodes]);

  useEffect(() => {
    if (boltUser) {
      loadCompletedTasks();
      loadDailyCodeAttempt();
    }
  }, [boltUser, loadCompletedTasks, loadDailyCodeAttempt]);

  return {
    tasks,
    completedTasks,
    dailyCodes,
    loading,
    error,
    completeTask,
    checkDailyCode,
    hasDailyCodeCompleted,
    clearError: () => setError(null)
  };
};
