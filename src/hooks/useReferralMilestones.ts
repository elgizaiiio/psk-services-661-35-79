import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ReferralMilestone {
  id: string;
  type: 'invite_3' | 'invite_10';
  requiredReferrals: number;
  rewardCurrency: 'TON' | 'USDT';
  rewardAmount: number;
  completed: boolean;
  claimed: boolean;
  progress: number;
}

const MILESTONES: Omit<ReferralMilestone, 'completed' | 'claimed' | 'progress'>[] = [
  {
    id: 'invite_3',
    type: 'invite_3',
    requiredReferrals: 3,
    rewardCurrency: 'TON',
    rewardAmount: 0.1,
  },
  {
    id: 'invite_10',
    type: 'invite_10',
    requiredReferrals: 10,
    rewardCurrency: 'USDT',
    rewardAmount: 1,
  },
];

export const useReferralMilestones = (userId: string | undefined) => {
  const [milestones, setMilestones] = useState<ReferralMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReferrals, setTotalReferrals] = useState(0);

  const loadMilestones = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Get user's total referrals
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('total_referrals')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      const referrals = userData?.total_referrals || 0;
      setTotalReferrals(referrals);

      // Get claimed milestones
      const { data: claimedData } = await supabase
        .from('referral_milestone_rewards')
        .select('milestone_type, claimed')
        .eq('user_id', userId);

      const claimedMap = new Map(
        (claimedData || []).map((c) => [c.milestone_type, c.claimed])
      );

      // Build milestone status
      const status = MILESTONES.map((m) => ({
        ...m,
        progress: Math.min(referrals, m.requiredReferrals),
        completed: referrals >= m.requiredReferrals,
        claimed: claimedMap.get(m.type) === true,
      }));

      setMilestones(status);
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  const claimMilestone = useCallback(
    async (milestoneType: 'invite_3' | 'invite_10') => {
      if (!userId) return false;

      const milestone = MILESTONES.find((m) => m.type === milestoneType);
      if (!milestone) return false;

      try {
        // Check if already claimed
        const { data: existing } = await supabase
          .from('referral_milestone_rewards')
          .select('claimed')
          .eq('user_id', userId)
          .eq('milestone_type', milestoneType)
          .maybeSingle();

        if (existing?.claimed) {
          return false;
        }

        // Verify user has enough referrals
        const { data: userData } = await supabase
          .from('bolt_users')
          .select('total_referrals, ton_balance, usdt_balance')
          .eq('id', userId)
          .single();

        if (!userData || userData.total_referrals < milestone.requiredReferrals) {
          return false;
        }

        // Insert or update claim record
        const { error: claimError } = await supabase
          .from('referral_milestone_rewards')
          .upsert(
            {
              user_id: userId,
              milestone_type: milestoneType,
              reward_currency: milestone.rewardCurrency,
              reward_amount: milestone.rewardAmount,
              claimed: true,
              claimed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,milestone_type' }
          );

        if (claimError) throw claimError;

        // Update user balance
        const updateField =
          milestone.rewardCurrency === 'TON' ? 'ton_balance' : 'usdt_balance';
        const currentBalance =
          milestone.rewardCurrency === 'TON'
            ? userData.ton_balance || 0
            : userData.usdt_balance || 0;

        const { error: updateError } = await supabase
          .from('bolt_users')
          .update({
            [updateField]: currentBalance + milestone.rewardAmount,
          })
          .eq('id', userId);

        if (updateError) throw updateError;

        // Refresh milestones
        await loadMilestones();

        return true;
      } catch (error) {
        console.error('Error claiming milestone:', error);
        return false;
      }
    },
    [userId, loadMilestones]
  );

  return {
    milestones,
    loading,
    totalReferrals,
    claimMilestone,
    refresh: loadMilestones,
  };
};
