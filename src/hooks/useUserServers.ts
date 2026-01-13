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
  daily_ton_yield: number;
  daily_viral_yield: number;
  purchased_at: string;
  is_active: boolean;
  last_claim_at: string | null;
}

export interface ServerInventory {
  server_id: string;
  server_name: string;
  total_stock: number;
  sold_count: number;
}

export const useUserServers = (userId: string | null) => {
  const [servers, setServers] = useState<UserServer[]>([]);
  const [inventory, setInventory] = useState<ServerInventory[]>([]);
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

  const fetchInventory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('server_inventory')
        .select('server_id, server_name, total_stock, sold_count');

      if (error) throw error;
      setInventory(data || []);
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
    }
  }, []);

  const getStock = useCallback((serverId: string) => {
    const inv = inventory.find(i => i.server_id === serverId);
    if (!inv) return { remaining: 999, total: 999, soldOut: false };
    const remaining = inv.total_stock - inv.sold_count;
    return { remaining, total: inv.total_stock, soldOut: remaining <= 0 };
  }, [inventory]);

  const getPendingRewards = useCallback(() => {
    const now = new Date();
    let totalBolt = 0;
    let totalUsdt = 0;
    let totalTon = 0;
    let totalViral = 0;
    let earliestClaim: Date | null = null;

    for (const server of servers) {
      const lastClaim = server.last_claim_at 
        ? new Date(server.last_claim_at) 
        : new Date(server.purchased_at);
      
      if (!earliestClaim || lastClaim < earliestClaim) {
        earliestClaim = lastClaim;
      }

      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      const claimableHours = Math.min(hoursSinceLastClaim, 24);
      
      totalBolt += (server.daily_bolt_yield / 24) * claimableHours;
      totalUsdt += (server.daily_usdt_yield / 24) * claimableHours;
      totalTon += ((server.daily_ton_yield || 0) / 24) * claimableHours;
      totalViral += ((server.daily_viral_yield || 0) / 24) * claimableHours;
    }

    const hoursSinceFirstClaim = earliestClaim 
      ? (now.getTime() - earliestClaim.getTime()) / (1000 * 60 * 60)
      : 0;

    return {
      pendingBolt: Math.floor(totalBolt),
      pendingUsdt: Math.round(totalUsdt * 100) / 100,
      pendingTon: Math.round(totalTon * 10000) / 10000,
      pendingViral: Math.floor(totalViral),
      hoursSinceClaim: Math.floor(hoursSinceFirstClaim),
      canClaim: hoursSinceFirstClaim >= 1,
    };
  }, [servers]);

  const claimRewards = useCallback(async () => {
    if (!userId) throw new Error('User not found');

    const { data, error } = await supabase.functions.invoke('claim-server-rewards', {
      body: { user_id: userId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    // Refresh server data to update last_claim_at
    await fetchServers();

    return {
      claimedBolt: data.claimed_bolt || 0,
      claimedUsdt: data.claimed_usdt || 0,
      claimedTon: data.claimed_ton || 0,
    };
  }, [userId, fetchServers]);

  const purchaseServer = useCallback(async (
    serverId: string,
    serverTier: string,
    serverName: string,
    hashRate: string,
    dailyBoltYield: number,
    dailyUsdtYield: number,
    dailyTonYield: number = 0
  ) => {
    if (!userId) throw new Error('User not found');

    // Check stock first
    const stock = getStock(serverId);
    if (stock.soldOut) throw new Error('Server sold out');

    // Insert user server
    const { data, error } = await supabase
      .from('user_servers')
      .insert({
        user_id: userId,
        server_tier: serverTier,
        server_name: serverName,
        hash_rate: hashRate,
        daily_bolt_yield: dailyBoltYield,
        daily_usdt_yield: dailyUsdtYield,
        daily_ton_yield: dailyTonYield,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment sold count
    const inv = inventory.find(i => i.server_id === serverId);
    if (inv) {
      await supabase
        .from('server_inventory')
        .update({ sold_count: inv.sold_count + 1 })
        .eq('server_id', serverId);
    }

    await fetchServers();
    await fetchInventory();
    return data;
  }, [userId, fetchServers, fetchInventory, getStock, inventory]);

  const getTotalStats = useCallback(() => {
    const totalBoltPerDay = servers.reduce((sum, s) => sum + s.daily_bolt_yield, 0);
    const totalUsdtPerDay = servers.reduce((sum, s) => sum + s.daily_usdt_yield, 0);
    const totalTonPerDay = servers.reduce((sum, s) => sum + (s.daily_ton_yield || 0), 0);
    const totalViralPerDay = servers.reduce((sum, s) => sum + (s.daily_viral_yield || 0), 0);
    const totalHashRate = servers.reduce((sum, s) => {
      const rate = parseFloat(s.hash_rate.replace(/[^0-9.]/g, ''));
      return sum + rate;
    }, 0);
    
    return {
      totalServers: servers.length,
      totalBoltPerDay,
      totalUsdtPerDay,
      totalTonPerDay,
      totalViralPerDay,
      totalHashRate,
    };
  }, [servers]);

  useEffect(() => {
    fetchServers();
    fetchInventory();
  }, [fetchServers, fetchInventory]);

  return {
    servers,
    inventory,
    loading,
    error,
    purchaseServer,
    getTotalStats,
    getStock,
    getPendingRewards,
    claimRewards,
    refetch: fetchServers,
    refetchInventory: fetchInventory,
  };
};
