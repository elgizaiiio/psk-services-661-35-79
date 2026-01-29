import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BoltUser, BoltReferral } from '@/types/bolt';

interface ReferralWithUser extends BoltReferral { referred?: BoltUser; }

export const useBoltReferrals = (userId: string | undefined) => {
  const [referrals, setReferrals] = useState<ReferralWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ total_referrals: 0, total_bonus: 0 });

  const loadReferrals = useCallback(async () => {
    if (!userId) { 
      setLoading(false); 
      setReferrals([]);
      return; 
    }
    try {
      setLoading(true);
      setError(null);
      
      const { data: refs, error: refsError } = await supabase
        .from('bolt_referrals' as any)
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });
      
      if (refsError) {
        console.error('Error loading referrals:', refsError);
        setReferrals([]);
        setLoading(false);
        return;
      }

      const referralsList = ((refs || []) as unknown as BoltReferral[]);
      const referredIds = referralsList.map(r => r.referred_id).filter(Boolean);
      let usersMap: Record<string, BoltUser> = {};
      
      if (referredIds.length > 0) {
        const { data: users } = await supabase
          .from('bolt_users' as any)
          .select('*')
          .in('id', referredIds);
        ((users || []) as unknown as BoltUser[]).forEach(u => { usersMap[u.id] = u; });
      }

      const enrichedReferrals = referralsList.map(r => ({ ...r, referred: usersMap[r.referred_id] }));
      setReferrals(enrichedReferrals);
      setStats({ 
        total_referrals: enrichedReferrals.length, 
        total_bonus: enrichedReferrals.reduce((sum, r) => sum + (r.bonus_earned || 0), 0) 
      });
    } catch (err: any) { 
      console.error('Error loading referrals:', err); 
      setError(err.message);
      setReferrals([]);
    } finally { 
      setLoading(false); 
    }
  }, [userId]);

  const processReferral = useCallback(async (referrerTelegramId: number, referredUserId: string) => {
    try {
      const { data: referrer } = await supabase
        .from('bolt_users' as any)
        .select('id')
        .eq('telegram_id', referrerTelegramId)
        .maybeSingle();
      
      if (!referrer) return false;
      const referrerData = referrer as unknown as { id: string };

      const { data: existing } = await supabase
        .from('bolt_referrals' as any)
        .select('id')
        .eq('referrer_id', referrerData.id)
        .eq('referred_id', referredUserId)
        .maybeSingle();
      
      if (existing) return false;

      await supabase.from('bolt_referrals' as any).insert({ 
        referrer_id: referrerData.id, 
        referred_id: referredUserId, 
        bonus_earned: 100, 
        status: 'active' 
      });

      const { data: userData } = await supabase
        .from('bolt_users' as any)
        .select('token_balance, total_referrals, referral_bonus')
        .eq('id', referrerData.id)
        .maybeSingle();
      
      if (userData) {
        const u = userData as unknown as { token_balance: number; total_referrals: number; referral_bonus: number };
        await supabase.from('bolt_users' as any).update({ 
          token_balance: (u.token_balance || 0) + 100, 
          total_referrals: (u.total_referrals || 0) + 1, 
          referral_bonus: (u.referral_bonus || 0) + 100, 
          updated_at: new Date().toISOString() 
        }).eq('id', referrerData.id);
      }

      // Award free spin ticket to referrer for each referral
      const { data: spinTicketData } = await supabase
        .from('user_spin_tickets')
        .select('referral_tickets_count')
        .eq('user_id', referrerData.id)
        .maybeSingle();

      const currentReferralTickets = (spinTicketData as any)?.referral_tickets_count || 0;
      
      await supabase
        .from('user_spin_tickets')
        .upsert({
          user_id: referrerData.id,
          referral_tickets_count: currentReferralTickets + 1,
        }, { onConflict: 'user_id' });
      return true;
    } catch (err: any) { 
      console.error('Error processing referral:', err); 
      return false; 
    }
  }, []);

  useEffect(() => { loadReferrals(); }, [loadReferrals]);

  return { referrals, stats, loading, error, refreshReferrals: loadReferrals, processReferral, clearError: () => setError(null) };
};
