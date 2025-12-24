import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Users, Gift, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SlotMachine } from "@/components/slots/SlotMachine";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { toast } from "sonner";

const Slots = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [coins, setCoins] = useState(1000);
  const [loading, setLoading] = useState(true);

  // Load user coins from database
  useEffect(() => {
    const loadUserCoins = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('game_players')
          .select('coins')
          .eq('user_id', user.id.toString())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCoins(data.coins);
        } else {
          // Create player if doesn't exist
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
      } catch (error) {
        console.error('Error loading coins:', error);
        toast.error('فشل في تحميل العملات');
      } finally {
        setLoading(false);
      }
    };

    loadUserCoins();
  }, [user]);

  // Update coins in database
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
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          
          <h1 className="text-xl font-bold text-primary">🎰 Slots</h1>
          
          <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1.5 rounded-full">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-400">{coins}</span>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="simple-loader" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <SlotMachine 
              coins={coins} 
              onCoinsChange={handleCoinsChange}
              spinCost={10}
            />
          </motion.div>
        )}
      </div>

      {/* Bottom action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-20 left-0 right-0 px-4"
      >
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/game-2048-store')}
            className="flex-1 max-w-[120px] flex flex-col items-center gap-1 h-auto py-3 border-primary/30 hover:bg-primary/10"
          >
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="text-xs">Shop</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/invite')}
            className="flex-1 max-w-[120px] flex flex-col items-center gap-1 h-auto py-3 border-primary/30 hover:bg-primary/10"
          >
            <Users className="w-5 h-5 text-primary" />
            <span className="text-xs">Friends</span>
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/tasks')}
            className="flex-1 max-w-[120px] flex flex-col items-center gap-1 h-auto py-3 border-primary/30 hover:bg-primary/10"
          >
            <Gift className="w-5 h-5 text-primary" />
            <span className="text-xs">Earn</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Slots;
