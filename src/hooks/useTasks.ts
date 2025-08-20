
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  points: number;
  task_url?: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CompletedTask {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  points_earned: number;
}

interface DailyCodes {
  id: string;
  code1: string;
  code2: string;
  code3: string;
  code4: string;
  date: string;
  created_at: string;
}

interface DailyCodeAttempt {
  id: string;
  user_id: string;
  date: string;
  completed_at?: string | null;
  points_earned: number;
}

export const useTasks = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: viralUser } = useViralMining(telegramUser);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [dailyCodes, setDailyCodes] = useState<DailyCodes | null>(null);
  const [dailyCodeAttempt, setDailyCodeAttempt] = useState<DailyCodeAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tasks
  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err.message);
    }
  }, []);

  // Load completed tasks
  const loadCompletedTasks = useCallback(async () => {
    if (!viralUser) return;

    try {
      const { data, error } = await supabase
        .from('user_completed_tasks')
        .select('*')
        .eq('user_id', viralUser.id);

      if (error) throw error;
      setCompletedTasks(data || []);
    } catch (err: any) {
      console.error('Error loading completed tasks:', err);
    }
  }, [viralUser]);

  // Load daily codes
  const loadDailyCodes = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_codes')
        .select('*')
        .eq('date', today)
        .single();

      if (error && (error as any).code !== 'PGRST116') throw error;
      setDailyCodes(data);
    } catch (err: any) {
      console.error('Error loading daily codes:', err);
    }
  }, []);

  // Load daily code attempt
  const loadDailyCodeAttempt = useCallback(async () => {
    if (!viralUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('user_daily_code_attempts')
        .select('*')
        .eq('user_id', viralUser.id)
        .eq('date', today)
        .single();

      if (error && (error as any).code !== 'PGRST116') throw error;
      setDailyCodeAttempt(data);
    } catch (err: any) {
      console.error('Error loading daily code attempt:', err);
    }
  }, [viralUser]);

  // Complete a task
  const completeTask = useCallback(async (taskId: string) => {
    if (!viralUser) throw new Error('User not found');

    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;

      // Check if already completed
      const { data: existing } = await supabase
        .from('user_completed_tasks')
        .select('*')
        .eq('user_id', viralUser.id)
        .eq('task_id', taskId)
        .maybeSingle();

      if (existing) {
        throw new Error('Task already completed');
      }

      // Complete the task
      const { error } = await supabase
        .from('user_completed_tasks')
        .insert({
          user_id: viralUser.id,
          task_id: taskId,
          points_earned: task.points
        });

      if (error) throw error;

      // Update user balance
      const { error: updateError } = await supabase
        .from('viral_users')
        .update({
          token_balance: (Number(viralUser.token_balance) || 0) + task.points,
          last_active_at: new Date().toISOString()
        })
        .eq('id', viralUser.id);

      if (updateError) throw updateError;

      // Refresh lists
      await loadCompletedTasks();
      await loadTasks();
      
    } catch (err: any) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, [viralUser, loadCompletedTasks, loadTasks]);

  // Check daily codes
  const checkDailyCode = useCallback(async (inputCodes: string[]) => {
    if (!viralUser || !dailyCodes) {
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
      
      // Record the attempt
      const { data, error } = await supabase
        .from('user_daily_code_attempts')
        .upsert({
          user_id: viralUser.id,
          date: today,
          completed_at: new Date().toISOString(),
          points_earned: 500
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      const { error: updateError } = await supabase
        .from('viral_users')
        .update({
          token_balance: (Number(viralUser.token_balance) || 0) + 500,
          last_active_at: new Date().toISOString()
        })
        .eq('id', viralUser.id);

      if (updateError) throw updateError;

      setDailyCodeAttempt(data);
      
    } catch (err: any) {
      console.error('Error checking daily code:', err);
      throw err;
    }
  }, [viralUser, dailyCodes]);

  // Hide completed tasks permanently (filter them out)
  useEffect(() => {
    if (!completedTasks || completedTasks.length === 0) return;
    setTasks(prev => prev.filter(t => !completedTasks.some(c => c.task_id === t.id)));
  }, [completedTasks]);

  // Check if daily code is completed
  const hasDailyCodeCompleted = useCallback(() => {
    return dailyCodeAttempt?.completed_at != null;
  }, [dailyCodeAttempt]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadTasks(),
          loadDailyCodes()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadTasks, loadDailyCodes]);

  useEffect(() => {
    if (viralUser) {
      loadCompletedTasks();
      loadDailyCodeAttempt();
    }
  }, [viralUser, loadCompletedTasks, loadDailyCodeAttempt]);

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
