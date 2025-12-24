import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
}

export const useAchievementNotifications = (userId: string | null) => {
  const [notification, setNotification] = useState<AchievementNotification | null>(null);
  const [lastCheckedAchievements, setLastCheckedAchievements] = useState<Set<string>>(new Set());

  const checkForNewAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      // Get user's achievements that were just unlocked (in the last minute)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      
      const { data: recentUnlocks, error } = await supabase
        .from('user_achievements')
        .select(`
          id,
          unlocked_at,
          achievement:achievements(
            id,
            name,
            description,
            icon,
            reward_tokens
          )
        `)
        .eq('user_id', userId)
        .eq('unlocked', true)
        .gte('unlocked_at', oneMinuteAgo)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      if (recentUnlocks && recentUnlocks.length > 0) {
        // Find achievements we haven't shown yet
        for (const unlock of recentUnlocks) {
          if (!lastCheckedAchievements.has(unlock.id) && unlock.achievement) {
            const achievement = unlock.achievement as any;
            setNotification({
              id: achievement.id,
              name: achievement.name,
              description: achievement.description || '',
              icon: achievement.icon || 'trophy',
              reward: achievement.reward_tokens
            });
            
            setLastCheckedAchievements(prev => new Set([...prev, unlock.id]));
            break; // Show one at a time
          }
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [userId, lastCheckedAchievements]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('achievement-unlocks')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new && (payload.new as any).unlocked === true && (payload.old as any).unlocked === false) {
            checkForNewAchievements();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, checkForNewAchievements]);

  // Also check periodically
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(checkForNewAchievements, 30000); // Check every 30 seconds
    checkForNewAchievements(); // Initial check

    return () => clearInterval(interval);
  }, [userId, checkForNewAchievements]);

  const closeNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const triggerTestNotification = useCallback(() => {
    setNotification({
      id: 'test',
      name: 'إنجاز تجريبي',
      description: 'هذا إنجاز تجريبي لاختبار النظام',
      icon: 'trophy',
      reward: 1000
    });
  }, []);

  return {
    notification,
    closeNotification,
    triggerTestNotification,
    checkForNewAchievements
  };
};
