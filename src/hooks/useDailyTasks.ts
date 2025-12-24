import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Fetch all active daily tasks
      const { data: dailyTasks, error: tasksError } = await supabase
        .from('bolt_daily_tasks')
        .select('*')
        .eq('is_active', true)
        .order('reward_tokens', { ascending: false });

      if (tasksError) throw tasksError;

      // Fetch today's completions for this user
      const { data: completions, error: completionsError } = await supabase
        .from('bolt_daily_task_completions')
        .select('task_id, points_earned')
        .eq('user_id', userId)
        .eq('completed_date', today);

      if (completionsError) throw completionsError;

      const completedTaskIds = new Set(completions?.map(c => c.task_id) || []);
      const earned = completions?.reduce((sum, c) => sum + c.points_earned, 0) || 0;

      const tasksWithStatus = (dailyTasks || []).map(task => ({
        ...task,
        is_completed: completedTaskIds.has(task.id)
      }));

      setTasks(tasksWithStatus);
      setCompletedCount(completedTaskIds.size);
      setTotalRewards(dailyTasks?.reduce((sum, t) => sum + t.reward_tokens, 0) || 0);
      setTodayEarned(earned);
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!userId) return { success: false, error: 'Not authenticated' };

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.is_completed) {
      return { success: false, error: 'Task already completed or not found' };
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Insert completion record
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

      // Update user balance
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .maybeSingle();

      if (!userError && userData) {
        await supabase
          .from('bolt_users')
          .update({ token_balance: (userData.token_balance || 0) + task.reward_tokens })
          .eq('id', userId);
      }

      // Refresh tasks
      await fetchTasks();

      return { success: true, reward: task.reward_tokens };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, error: 'Failed to complete task' };
    }
  }, [userId, tasks, fetchTasks]);

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
