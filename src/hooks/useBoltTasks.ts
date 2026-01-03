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

  const refreshTasks = useCallback(async () => {
    await Promise.all([loadTasks(), loadCompletedTasks()]);
  }, [loadTasks, loadCompletedTasks]);

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

      // Insert completion record (and verify it succeeded)
      const { data: insertedCompletion, error: insertError } = await supabase
        .from('bolt_completed_tasks' as any)
        .insert({
          user_id: boltUser.id,
          task_id: taskId,
          points_earned: taskData.points || 0,
        })
        .select('*')
        .maybeSingle();

      if (insertError) throw insertError;

      // Get current user balances
      const { data: currentUser } = await supabase
        .from('bolt_users' as any)
        .select('token_balance, ton_balance, usdt_balance')
        .eq('id', boltUser.id)
        .single();

      const userData = currentUser as any;
      const currentTokens = Number(userData?.token_balance) || 0;
      const currentTon = Number(userData?.ton_balance) || 0;
      const currentUsdt = Number(userData?.usdt_balance) || 0;

      // Update user balance based on reward type
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };

      if (taskData.points > 0) {
        updates.token_balance = currentTokens + taskData.points;
      }
      if (taskData.reward_ton && taskData.reward_ton > 0) {
        updates.ton_balance = currentTon + taskData.reward_ton;
      }
      if (taskData.reward_usdt && taskData.reward_usdt > 0) {
        updates.usdt_balance = currentUsdt + taskData.reward_usdt;
      }

      const { error: updateError } = await supabase
        .from('bolt_users' as any)
        .update(updates)
        .eq('id', boltUser.id);

      if (updateError) throw updateError;

      // Immediately update local state for instant UI feedback (only after successful insert)
      setCompletedTasks((prev) => {
        const exists = prev.some((c) => c.task_id === taskId);
        if (exists) return prev;
        if (insertedCompletion) return [...prev, insertedCompletion as unknown as BoltCompletedTask];
        return [
          ...prev,
          {
            id: `temp-${taskId}`,
            task_id: taskId,
            user_id: boltUser.id,
            points_earned: taskData.points,
            completed_at: new Date().toISOString(),
          } as unknown as BoltCompletedTask,
        ];
      });

      // Then refresh from backend
      await refreshTasks();
      await refreshUser();
    } catch (err: any) {
      console.error('Error completing task:', err);
      throw err;
    }
  }, [boltUser, refreshTasks, refreshUser]);

  const revokeTaskCompletion = useCallback(async (taskId: string, points: number) => {
    if (!boltUser) return false;

    try {
      const { error: deleteError } = await supabase
        .from('bolt_completed_tasks' as any)
        .delete()
        .eq('user_id', boltUser.id)
        .eq('task_id', taskId);

      if (deleteError) throw deleteError;

      const current = Number(boltUser.token_balance) || 0;
      const next = Math.max(0, current - (Number(points) || 0));

      const { error: updateError } = await supabase
        .from('bolt_users' as any)
        .update({ token_balance: next, updated_at: new Date().toISOString() })
        .eq('id', boltUser.id);

      if (updateError) throw updateError;

      // Immediately update local state
      setCompletedTasks(prev => prev.filter(c => c.task_id !== taskId));

      await refreshTasks();
      await refreshUser();
      return true;
    } catch (err) {
      console.error('Error revoking task completion:', err);
      return false;
    }
  }, [boltUser, refreshTasks, refreshUser]);

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
    user: boltUser,
    userLoading: !boltUser && !error && !!telegramUser,
    completeTask,
    revokeTaskCompletion,
    clearError: () => setError(null),
    refreshTasks,
  };
};
