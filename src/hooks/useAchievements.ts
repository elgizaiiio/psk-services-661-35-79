import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Achievement, UserAchievement } from '@/types/mining';
import { toast } from 'sonner';

export const useAchievements = (userId: string | undefined) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;
      setAchievements(data as Achievement[] || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      setUserAchievements((data || []).map(ua => ({
        ...ua,
        achievement: ua.achievement as Achievement
      })) as UserAchievement[]);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [userId]);

  const updateProgress = async (achievementId: string, value: number) => {
    if (!userId) return false;

    try {
      let userAchievement = userAchievements.find(ua => ua.achievement_id === achievementId);
      const achievement = achievements.find(a => a.id === achievementId);
      if (!achievement) return false;

      // Create user achievement if doesn't exist
      if (!userAchievement) {
        const { data, error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievementId,
            current_value: 0
          })
          .select()
          .single();

        if (error) throw error;
        userAchievement = data as UserAchievement;
      }

      const newValue = (userAchievement.current_value || 0) + value;
      const unlocked = newValue >= achievement.target_value;

      const { error } = await supabase
        .from('user_achievements')
        .update({
          current_value: newValue,
          unlocked,
          unlocked_at: unlocked && !userAchievement.unlocked ? new Date().toISOString() : userAchievement.unlocked_at
        })
        .eq('id', userAchievement.id);

      if (error) throw error;

      if (unlocked && !userAchievement.unlocked && achievement.reward_tokens > 0) {
        // Award tokens
        const { data: userData } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (userData?.token_balance || 0) + achievement.reward_tokens 
          })
          .eq('id', userId);

        toast.success(`Achievement unlocked: ${achievement.name}! +${achievement.reward_tokens} tokens`);
      }

      await fetchUserAchievements();
      return true;
    } catch (error) {
      console.error('Error updating achievement progress:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAchievements(), fetchUserAchievements()]);
      setLoading(false);
    };
    loadData();
  }, [fetchAchievements, fetchUserAchievements]);

  return {
    achievements,
    userAchievements,
    loading,
    updateProgress,
    refetch: () => Promise.all([fetchAchievements(), fetchUserAchievements()])
  };
};
