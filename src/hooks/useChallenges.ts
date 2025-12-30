import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MiningChallenge, UserChallenge } from '@/types/mining';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';

const logger = createLogger('Challenges');

interface UserData {
  token_balance: number;
}

export const useChallenges = (userId: string | undefined) => {
  const [challenges, setChallenges] = useState<MiningChallenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChallenges = useCallback(async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('mining_challenges')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });

      if (error) throw error;
      setChallenges(data as MiningChallenge[] || []);
    } catch (error) {
      logger.error('Error fetching challenges', error);
    }
  }, []);

  const fetchUserChallenges = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select(`
          *,
          challenge:mining_challenges(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      setUserChallenges((data || []).map(uc => ({
        ...uc,
        challenge: uc.challenge as MiningChallenge
      })) as UserChallenge[]);
    } catch (error) {
      logger.error('Error fetching user challenges', error);
    }
  }, [userId]);

  const joinChallenge = async (challengeId: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const existing = userChallenges.find(uc => uc.challenge_id === challengeId);
      if (existing) {
        toast.error('Already joined this challenge');
        return false;
      }

      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: userId,
          challenge_id: challengeId
        });

      if (error) throw error;

      toast.success('Joined challenge!');
      await fetchUserChallenges();
      return true;
    } catch (error) {
      logger.error('Error joining challenge', error);
      toast.error('Failed to join challenge');
      return false;
    }
  };

  const updateProgress = async (challengeId: string, value: number): Promise<boolean> => {
    if (!userId) return false;

    try {
      const userChallenge = userChallenges.find(uc => uc.challenge_id === challengeId);
      if (!userChallenge) return false;

      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return false;

      const newValue = userChallenge.current_value + value;
      const completed = newValue >= challenge.target_value;

      const { error } = await supabase
        .from('user_challenges')
        .update({
          current_value: newValue,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        })
        .eq('id', userChallenge.id);

      if (error) throw error;

      if (completed && challenge.reward_tokens > 0) {
        const { data: userData } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        const typedUserData = userData as unknown as UserData | null;

        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (typedUserData?.token_balance || 0) + challenge.reward_tokens 
          })
          .eq('id', userId);

        toast.success(`Challenge completed! +${challenge.reward_tokens} tokens`);
      }

      await fetchUserChallenges();
      return true;
    } catch (error) {
      logger.error('Error updating challenge progress', error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchChallenges(), fetchUserChallenges()]);
      setLoading(false);
    };
    loadData();
  }, [fetchChallenges, fetchUserChallenges]);

  return {
    challenges,
    userChallenges,
    loading,
    joinChallenge,
    updateProgress,
    refetch: () => Promise.all([fetchChallenges(), fetchUserChallenges()])
  };
};
