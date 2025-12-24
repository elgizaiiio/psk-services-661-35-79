import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SlotMachine } from "@/components/slots/SlotMachine";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { toast } from "sonner";

const Slots = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [coins, setCoins] = useState(1000);
  const [boltTokens, setBoltTokens] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [loading, setLoading] = useState(true);

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

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

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
            {/* Free Spins */}
            <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-2xl p-3 text-center border border-amber-500/20">
              <div className="text-2xl font-black text-amber-400">{freeSpins}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium">Spins</div>
            </div>
            
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
            />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Slots;
