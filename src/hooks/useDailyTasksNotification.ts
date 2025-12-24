import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DailyTasksNotification {
  availableTasks: number;
  totalRewards: number;
  lastChecked: string | null;
  isNewDay: boolean;
}

const LAST_CHECK_KEY = 'daily_tasks_last_check';

export const useDailyTasksNotification = (userId: string | null) => {
  const [notification, setNotification] = useState<DailyTasksNotification | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const checkForNewTasks = useCallback(async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      
      // Check if it's a new day since last check
      const isNewDay = !lastCheck || lastCheck !== today;
      
      if (!isNewDay) {
        return; // Already checked today
      }

      // Fetch all active daily tasks
      const { data: dailyTasks, error: tasksError } = await supabase
        .from('bolt_daily_tasks')
        .select('id, reward_tokens')
        .eq('is_active', true);

      if (tasksError) throw tasksError;

      // Fetch today's completions for this user
      const { data: completions, error: completionsError } = await supabase
        .from('bolt_daily_task_completions')
        .select('task_id')
        .eq('user_id', userId)
        .eq('completed_date', today);

      if (completionsError) throw completionsError;

      const completedTaskIds = new Set(completions?.map(c => c.task_id) || []);
      const availableTasks = dailyTasks?.filter(t => !completedTaskIds.has(t.id)) || [];
      const totalRewards = availableTasks.reduce((sum, t) => sum + t.reward_tokens, 0);

      if (availableTasks.length > 0) {
        setNotification({
          availableTasks: availableTasks.length,
          totalRewards,
          lastChecked: lastCheck,
          isNewDay: true
        });
        setShowNotification(true);
      }

      // Update last check
      localStorage.setItem(LAST_CHECK_KEY, today);
    } catch (error) {
      console.error('Error checking daily tasks:', error);
    }
  }, [userId]);

  useEffect(() => {
    // Check on mount with a small delay
    const timer = setTimeout(() => {
      checkForNewTasks();
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkForNewTasks]);

  const dismissNotification = useCallback(() => {
    setShowNotification(false);
  }, []);

  const markAsViewed = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(LAST_CHECK_KEY, today);
    setShowNotification(false);
  }, []);

  return {
    notification,
    showNotification,
    dismissNotification,
    markAsViewed,
    checkForNewTasks
  };
};
