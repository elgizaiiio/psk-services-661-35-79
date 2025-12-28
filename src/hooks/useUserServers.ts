import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserServer {
  id: string;
  user_id: string;
  server_tier: string;
  server_name: string;
  hash_rate: string;
  daily_bolt_yield: number;
  daily_usdt_yield: number;
  purchased_at: string;
  is_active: boolean;
  last_claim_at: string | null;
}

export const useUserServers = (userId: string | null) => {
  const [servers, setServers] = useState<UserServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_servers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('purchased_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (err: any) {
      console.error('Error fetching servers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const purchaseServer = useCallback(async (
    serverTier: string,
    serverName: string,
    hashRate: string,
    dailyBoltYield: number,
    dailyUsdtYield: number
  ) => {
    if (!userId) throw new Error('User not found');

    const { data, error } = await supabase
      .from('user_servers')
      .insert({
        user_id: userId,
        server_tier: serverTier,
        server_name: serverName,
        hash_rate: hashRate,
        daily_bolt_yield: dailyBoltYield,
        daily_usdt_yield: dailyUsdtYield,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchServers();
    return data;
  }, [userId, fetchServers]);

  const getTotalStats = useCallback(() => {
    const totalBoltPerDay = servers.reduce((sum, s) => sum + s.daily_bolt_yield, 0);
    const totalUsdtPerDay = servers.reduce((sum, s) => sum + s.daily_usdt_yield, 0);
    const totalHashRate = servers.reduce((sum, s) => {
      const rate = parseFloat(s.hash_rate.replace(/[^0-9.]/g, ''));
      return sum + rate;
    }, 0);
    
    return {
      totalServers: servers.length,
      totalBoltPerDay,
      totalUsdtPerDay,
      totalHashRate,
    };
  }, [servers]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return {
    servers,
    loading,
    error,
    purchaseServer,
    getTotalStats,
    refetch: fetchServers,
  };
};
