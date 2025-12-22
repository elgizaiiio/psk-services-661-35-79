import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { BoltTask, BoltCompletedTask, BoltDailyCode, BoltDailyCodeAttempt } from '@/types/bolt';

export const useBoltTasks = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: boltUser, refreshUser } = useBoltMining(telegramUser);
  
  const [tasks, setTasks] = useState<BoltTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<BoltCompletedTask[]>([]);
  const [dailyCodes, setDailyCodes] = useState<BoltDailyCode | null>(null);
  const [dailyCodeAttempt, setDailyCodeAttempt] = useState<BoltDailyCodeAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('bolt_tasks' as any).select('*').eq('is_active', true).order('created_at', { ascending: false });
      if (error) throw error;
      setTasks((data || []) as unknown as BoltTask[]);
    } catch (err: any) { console.error('Error loading tasks:', err); setError(err.message); }
  }, []);

  const loadCompletedTasks = useCallback(async () => {
    if (!boltUser) return;
    try {
      const { data, error } = await supabase.from('bolt_completed_tasks' as any).select('*').eq('user_id', boltUser.id);
      if (error) throw error;
      setCompletedTasks((data || []) as unknown as BoltCompletedTask[]);
    } catch (err: any) { console.error('Error loading completed tasks:', err); }
  }, [boltUser]);

  const loadDailyCodes = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('bolt_daily_codes' as any).select('*').eq('date', today).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setDailyCodes(data as unknown as BoltDailyCode | null);
    } catch (err: any) { console.error('Error loading daily codes:', err); }
  }, []);

  const loadDailyCodeAttempt = useCallback(async () => {
    if (!boltUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase.from('bolt_daily_code_attempts' as any).select('*').eq('user_id', boltUser.id).eq('date', today).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      setDailyCodeAttempt(data as unknown as BoltDailyCodeAttempt | null);
    } catch (err: any) { console.error('Error loading daily code attempt:', err); }
  }, [boltUser]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!boltUser) throw new Error('User not found');
    try {
      const { data: task, error: taskError } = await supabase.from('bolt_tasks' as any).select('*').eq('id', taskId).single();
      if (taskError) throw taskError;
      const taskData = task as unknown as BoltTask;

      const { data: existing } = await supabase.from('bolt_completed_tasks' as any).select('*').eq('user_id', boltUser.id).eq('task_id', taskId).maybeSingle();
      if (existing) throw new Error('Task already completed');

      await supabase.from('bolt_completed_tasks' as any).insert({ user_id: boltUser.id, task_id: taskId, points_earned: taskData.points });
      await supabase.from('bolt_users' as any).update({ token_balance: (Number(boltUser.token_balance) || 0) + taskData.points, updated_at: new Date().toISOString() }).eq('id', boltUser.id);

      await loadCompletedTasks();
      await loadTasks();
      await refreshUser();
    } catch (err: any) { console.error('Error completing task:', err); throw err; }
  }, [boltUser, loadCompletedTasks, loadTasks, refreshUser]);

  const checkDailyCode = useCallback(async (inputCodes: string[]) => {
    if (!boltUser || !dailyCodes) throw new Error('Missing data');
    const correctCodes = [dailyCodes.code1, dailyCodes.code2, dailyCodes.code3, dailyCodes.code4];
    if (!inputCodes.every((code, index) => code === correctCodes[index])) throw new Error('Invalid codes');

    try {
      const today = new Date().toISOString().split('T')[0];
      const pointsReward = dailyCodes.points_reward || 500;
      
      const { data } = await supabase.from('bolt_daily_code_attempts' as any).upsert({ user_id: boltUser.id, date: today, completed_at: new Date().toISOString(), points_earned: pointsReward }).select().single();
      await supabase.from('bolt_users' as any).update({ token_balance: (Number(boltUser.token_balance) || 0) + pointsReward, updated_at: new Date().toISOString() }).eq('id', boltUser.id);

      setDailyCodeAttempt(data as unknown as BoltDailyCodeAttempt);
      await refreshUser();
    } catch (err: any) { console.error('Error checking daily code:', err); throw err; }
  }, [boltUser, dailyCodes, refreshUser]);

  const hasDailyCodeCompleted = useCallback(() => dailyCodeAttempt?.completed_at != null, [dailyCodeAttempt]);
  const getAvailableTasks = useCallback(() => tasks.filter(task => !completedTasks.some(c => c.task_id === task.id)), [tasks, completedTasks]);

  useEffect(() => { setLoading(true); Promise.all([loadTasks(), loadDailyCodes()]).finally(() => setLoading(false)); }, [loadTasks, loadDailyCodes]);
  useEffect(() => { if (boltUser) { loadCompletedTasks(); loadDailyCodeAttempt(); } }, [boltUser, loadCompletedTasks, loadDailyCodeAttempt]);

  return { tasks: getAvailableTasks(), allTasks: tasks, completedTasks, dailyCodes, loading, error, completeTask, checkDailyCode, hasDailyCodeCompleted, clearError: () => setError(null) };
};
