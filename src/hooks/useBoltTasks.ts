import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { BoltTask, BoltCompletedTask } from '@/types/bolt';

export const useBoltTasks = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user: boltUser, refreshUser } = useBoltMining(telegramUser);

  const [tasks, setTasks] = useState<BoltTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<BoltCompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bolt_tasks' as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as unknown as BoltTask[]);
    } catch (err: any) {
      console.error('Error loading tasks:', err);
      setError(err?.message || 'Unknown error');
    }
  }, []);

  const loadCompletedTasks = useCallback(async () => {
    if (!boltUser) return;
    try {
      const { data, error } = await supabase
        .from('bolt_completed_tasks' as any)
        .select('*')
        .eq('user_id', boltUser.id);

      if (error) throw error;
      setCompletedTasks((data || []) as unknown as BoltCompletedTask[]);
    } catch (err: any) {
      console.error('Error loading completed tasks:', err);
    }
  }, [boltUser]);

  const completeTask = useCallback(async (taskId: string) => {
    if (!boltUser) throw new Error('User not found');

    try {
      // Get task details
      const { data: task, error: taskError } = await supabase
        .from('bolt_tasks' as any)
        .select('*')
        .eq('id', taskId)
        .single();

      if (taskError) throw taskError;
      const taskData = task as unknown as BoltTask;

      // Check if already completed
      const { data: existing } = await supabase
        .from('bolt_completed_tasks' as any)
        .select('*')
        .eq('user_id', boltUser.id)
        .eq('task_id', taskId)
        .maybeSingle();

      if (existing) throw new Error('Task already completed');

      // Insert completion record
      await supabase.from('bolt_completed_tasks' as any).insert({
        user_id: boltUser.id,
        task_id: taskId,
        points_earned: taskData.points,
      });

      // Update user balance
      await supabase.from('bolt_users' as any).update({
        token_balance: (Number(boltUser.token_balance) || 0) + taskData.points,
        updated_at: new Date().toISOString(),
      }).eq('id', boltUser.id);

      // Refresh data from backend - update local state immediately
      await Promise.all([loadTasks(), loadCompletedTasks()]);
      await refreshUser();
    } catch (err: any) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, [boltUser, loadTasks, loadCompletedTasks, refreshUser]);

  const revokeTaskCompletion = useCallback(async (taskId: string, points: number) => {
    if (!boltUser) return false;

    try {
      await supabase
        .from('bolt_completed_tasks' as any)
        .delete()
        .eq('user_id', boltUser.id)
        .eq('task_id', taskId);

      const current = Number(boltUser.token_balance) || 0;
      const next = Math.max(0, current - (Number(points) || 0));

      await supabase
        .from('bolt_users' as any)
        .update({ token_balance: next, updated_at: new Date().toISOString() })
        .eq('id', boltUser.id);

      await loadCompletedTasks();
      await refreshUser();
      return true;
    } catch (err) {
      console.error('Error revoking task completion:', err);
      return false;
    }
  }, [boltUser, loadCompletedTasks, refreshUser]);

  // Filter out completed tasks - relies only on backend data
  const getAvailableTasks = useCallback(() => {
    const completedIds = new Set(completedTasks.map(c => c.task_id));
    return tasks.filter(task => !completedIds.has(task.id));
  }, [tasks, completedTasks]);

  useEffect(() => {
    setLoading(true);
    loadTasks().finally(() => setLoading(false));
  }, [loadTasks]);

  useEffect(() => {
    if (boltUser) {
      loadCompletedTasks();
    }
  }, [boltUser, loadCompletedTasks]);

  return {
    tasks: getAvailableTasks(),
    allTasks: tasks,
    completedTasks,
    loading,
    error,
    completeTask,
    revokeTaskCompletion,
    clearError: () => setError(null),
    refreshTasks: loadTasks,
  };
};
