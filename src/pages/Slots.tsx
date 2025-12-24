import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SlotMachine } from "@/components/slots/SlotMachine";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { toast } from "sonner";

const DAILY_FREE_SPINS = 5;

const Slots = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [coins, setCoins] = useState(1000);
  const [boltTokens, setBoltTokens] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDailyClaim = useCallback((lastClaim: string | null) => {
    if (!lastClaim) return true;
    
    const lastClaimDate = new Date(lastClaim);
    const now = new Date();
    
    // Reset at midnight UTC
    const lastClaimDay = new Date(lastClaimDate.toDateString());
    const today = new Date(now.toDateString());
    
    return today > lastClaimDay;
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Load game player data
        const { data: playerData, error: playerError } = await supabase
          .from('game_players')
          .select('coins')
          .eq('user_id', user.id.toString())
          .maybeSingle();

        if (playerError) throw playerError;

        if (playerData) {
          setCoins(playerData.coins);
        } else {
          const { error: insertError } = await supabase
            .from('game_players')
            .insert({
              user_id: user.id.toString(),
              username: user.username || user.first_name || 'Player',
              coins: 1000,
            });

          if (insertError) throw insertError;
          setCoins(1000);
        }

        // Load bolt tokens
        const { data: boltData, error: boltError } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('telegram_id', user.id)
          .maybeSingle();

        if (!boltError && boltData) {
          setBoltTokens(boltData.token_balance);
        }

        // Load free spins data
        const { data: spinsData, error: spinsError } = await supabase
          .from('user_free_spins')
          .select('*')
          .eq('user_id', user.id.toString())
          .maybeSingle();

        if (spinsError) throw spinsError;

        if (spinsData) {
          setFreeSpins(spinsData.total_spins);
          setCanClaimDaily(checkDailyClaim(spinsData.last_daily_claim));
        } else {
          // Create initial record with daily spins
          const { error: insertSpinsError } = await supabase
            .from('user_free_spins')
            .insert({
              user_id: user.id.toString(),
              total_spins: DAILY_FREE_SPINS,
              daily_claimed: true,
              last_daily_claim: new Date().toISOString(),
            });

          if (insertSpinsError) throw insertSpinsError;
          setFreeSpins(DAILY_FREE_SPINS);
          setCanClaimDaily(false);
        }

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, checkDailyClaim]);

  const claimDailySpins = async () => {
    if (!user?.id || !canClaimDaily) return;

    try {
      const newSpins = freeSpins + DAILY_FREE_SPINS;
      
      const { error } = await supabase
        .from('user_free_spins')
        .update({
          total_spins: newSpins,
          daily_claimed: true,
          last_daily_claim: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id.toString());

      if (error) throw error;

      setFreeSpins(newSpins);
      setCanClaimDaily(false);
      toast.success(`🎁 +${DAILY_FREE_SPINS} Free Spins!`);
    } catch (error) {
      console.error('Error claiming daily spins:', error);
      toast.error('Failed to claim daily spins');
    }
  };

  const handleCoinsChange = async (newCoins: number) => {
    setCoins(newCoins);

    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('game_players')
        .update({ coins: newCoins })
        .eq('user_id', user.id.toString());

      if (error) throw error;
    } catch (error) {
      console.error('Error updating coins:', error);
    }
  };

  const handleFreeSpinUsed = async () => {
    if (!user?.id || freeSpins <= 0) return;

    const newSpins = freeSpins - 1;
    setFreeSpins(newSpins);

    try {
      const { error } = await supabase
        .from('user_free_spins')
        .update({
          total_spins: newSpins,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id.toString());

      if (error) throw error;
    } catch (error) {
      console.error('Error updating free spins:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with 3 stats */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20">
        <div className="px-4 py-4">
          {/* Title */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-black text-foreground">Slots</h1>
            <button 
              onClick={() => navigate(-1)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </div>
          
          {/* 3 Stats Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* Free Spins - Clickable if can claim */}
            <motion.button
              onClick={canClaimDaily ? claimDailySpins : undefined}
              disabled={!canClaimDaily}
              className={`relative bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-2xl p-3 text-center border transition-all ${
                canClaimDaily 
                  ? 'border-amber-500/50 cursor-pointer hover:scale-105 active:scale-95' 
                  : 'border-amber-500/20 cursor-default'
              }`}
              whileTap={canClaimDaily ? { scale: 0.95 } : {}}
            >
              {canClaimDaily && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              )}
              <div className="text-2xl font-black text-amber-400">{freeSpins}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium">
                {canClaimDaily ? 'Claim!' : 'Spins'}
              </div>
            </motion.button>
            
            {/* Coins */}
            <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 rounded-2xl p-3 text-center border border-yellow-500/20">
              <div className="text-2xl font-black text-yellow-400">{coins.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-yellow-400/70 font-medium">Coins</div>
            </div>
            
            {/* Bolt Tokens */}
            <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl p-3 text-center border border-primary/20">
              <div className="text-2xl font-black text-primary">{boltTokens.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wider text-primary/70 font-medium">Bolt</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {loading ? (
          <div className="simple-loader" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <SlotMachine 
              coins={coins} 
              onCoinsChange={handleCoinsChange}
              spinCost={10}
              userId={user?.id?.toString()}
              freeSpins={freeSpins}
              onFreeSpinUsed={handleFreeSpinUsed}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Slots;