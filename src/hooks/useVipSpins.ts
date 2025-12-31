import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VipTier {
  tier: 'silver' | 'gold' | 'platinum';
  expires_at: string;
  benefits: {
    miningBoost?: number;
    dailyBonus?: number;
    weeklySpinTickets?: number;
    referralBonus?: number;
    miningDurationBonus?: number;
  };
}

// Daily free spins per VIP tier
const VIP_DAILY_SPINS: Record<string, number> = {
  silver: 3,
  gold: 5,
  platinum: 10,
};

export const useVipSpins = (userId: string | undefined) => {
  const [vipTier, setVipTier] = useState<VipTier | null>(null);
  const [vipSpinsAvailable, setVipSpinsAvailable] = useState(0);
  const [vipSpinsClaimed, setVipSpinsClaimed] = useState(false);
  const [loading, setLoading] = useState(true);

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Load VIP status and check daily spins
  const loadVipStatus = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get VIP tier data
      const { data: vipData, error: vipError } = await supabase
        .from('bolt_vip_tiers')
        .select('tier, expires_at, benefits')
        .eq('user_id', userId)
        .maybeSingle();

      if (vipError) {
        console.error('Error loading VIP status:', vipError);
        setLoading(false);
        return;
      }

      // Check if VIP is active
      if (!vipData || new Date(vipData.expires_at) <= new Date()) {
        setVipTier(null);
        setVipSpinsAvailable(0);
        setLoading(false);
        return;
      }

      const tier = vipData as VipTier;
      setVipTier(tier);

      // Check if VIP spins already claimed today
      const today = getTodayDate();
      const { data: spinData } = await supabase
        .from('user_spin_tickets')
        .select('free_ticket_date, updated_at')
        .eq('user_id', userId)
        .maybeSingle();

      // Check if VIP spins were claimed today by looking at a special marker
      // We'll use a custom check based on the last VIP claim
      const { data: vipClaimData } = await supabase
        .from('spin_history')
        .select('created_at')
        .eq('user_id', userId)
        .eq('wheel_type', 'vip_daily_claim')
        .gte('created_at', `${today}T00:00:00`)
        .maybeSingle();

      const alreadyClaimed = !!vipClaimData;
      setVipSpinsClaimed(alreadyClaimed);

      if (!alreadyClaimed) {
        setVipSpinsAvailable(VIP_DAILY_SPINS[tier.tier] || 0);
      } else {
        setVipSpinsAvailable(0);
      }
    } catch (err) {
      console.error('Error in loadVipStatus:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Claim VIP daily spins
  const claimVipSpins = useCallback(async (): Promise<number> => {
    if (!userId || !vipTier || vipSpinsClaimed || vipSpinsAvailable === 0) {
      return 0;
    }

    try {
      const spinsToAdd = VIP_DAILY_SPINS[vipTier.tier] || 0;
      const today = getTodayDate();

      // Get current tickets
      const { data: ticketData } = await supabase
        .from('user_spin_tickets')
        .select('tickets_count')
        .eq('user_id', userId)
        .maybeSingle();

      const currentTickets = ticketData?.tickets_count || 0;

      // Update tickets count
      await supabase
        .from('user_spin_tickets')
        .upsert({
          user_id: userId,
          tickets_count: currentTickets + spinsToAdd,
        }, { onConflict: 'user_id' });

      // Record the VIP daily claim
      await supabase
        .from('spin_history')
        .insert({
          user_id: userId,
          reward_type: 'vip_daily_spins',
          reward_amount: spinsToAdd,
          wheel_type: 'vip_daily_claim',
        });

      setVipSpinsClaimed(true);
      setVipSpinsAvailable(0);

      return spinsToAdd;
    } catch (err) {
      console.error('Error claiming VIP spins:', err);
      return 0;
    }
  }, [userId, vipTier, vipSpinsClaimed, vipSpinsAvailable]);

  useEffect(() => {
    loadVipStatus();
  }, [loadVipStatus]);

  return {
    vipTier,
    vipSpinsAvailable,
    vipSpinsClaimed,
    loading,
    claimVipSpins,
    refresh: loadVipStatus,
    isVip: !!vipTier,
    dailySpinsForTier: vipTier ? VIP_DAILY_SPINS[vipTier.tier] : 0,
  };
};
