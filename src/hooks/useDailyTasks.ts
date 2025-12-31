import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DailyTasks');

interface DailyTask {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  task_type: string;
  reward_tokens: number;
  required_action: string | null;
  action_url: string | null;
  icon: string | null;
  is_completed: boolean;
}

interface TaskCompletion {
  task_id: string;
  points_earned: number;
}

interface UserData {
  token_balance: number;
}

export const useDailyTasks = (userId: string | null) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [todayEarned, setTodayEarned] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data: dailyTasks, error: tasksError } = await supabase
        .from('bolt_daily_tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_tokens', { ascending: false });

      if (tasksError) throw tasksError;

      const { data: completions, error: completionsError } = await supabase
        .from('bolt_daily_task_completions')
        .select('task_id, points_earned')
        .eq('user_id', userId)
        .eq('completed_date', today);

      if (completionsError) throw completionsError;

      const typedCompletions = (completions || []) as unknown as TaskCompletion[];
      const completedTaskIds = new Set(typedCompletions.map(c => c.task_id));
      const earned = typedCompletions.reduce((sum, c) => sum + c.points_earned, 0);

      const tasksWithStatus = (dailyTasks || []).map(task => ({
        ...task,
        is_completed: completedTaskIds.has(task.id)
      })) as DailyTask[];

      setTasks(tasksWithStatus);
      setCompletedCount(completedTaskIds.size);
      setTotalRewards((dailyTasks || []).reduce((sum, t) => sum + (t.reward_tokens || 0), 0));
      setTodayEarned(earned);
    } catch (error) {
      logger.error('Error fetching daily tasks', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string; reward?: number }> => {
    if (!userId) return { success: false, error: 'Not authenticated' };

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.is_completed) {
      return { success: false, error: 'Task already completed or not found' };
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error: insertError } = await supabase
        .from('bolt_daily_task_completions')
        .insert({
          user_id: userId,
          task_id: taskId,
          completed_date: today,
          points_earned: task.reward_tokens
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'Already completed today' };
        }
        throw insertError;
      }

      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .maybeSingle();

      if (!userError && userData) {
        const typedUserData = userData as unknown as UserData;
        await supabase
          .from('bolt_users')
          .update({ token_balance: (typedUserData.token_balance || 0) + task.reward_tokens })
          .eq('id', userId);
      }

      // Update task state locally instead of refetching to prevent flicker
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === taskId ? { ...t, is_completed: true } : t
        )
      );
      setCompletedCount(prev => prev + 1);
      setTodayEarned(prev => prev + task.reward_tokens);

      return { success: true, reward: task.reward_tokens };
    } catch (error) {
      logger.error('Error completing task', error);
      return { success: false, error: 'Failed to complete task' };
    }
  }, [userId, tasks]);

  return {
    tasks,
    loading,
    completedCount,
    totalCount: tasks.length,
    totalRewards,
    todayEarned,
    completeTask,
    refreshTasks: fetchTasks
  };
};
