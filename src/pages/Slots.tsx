import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, ShoppingBag, Users, Gift } from "lucide-react";
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
        toast.error('Failed to load coins');
      } finally {
        setLoading(false);
      }
    };

    loadUserCoins();
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <motion.button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          
          <h1 className="text-lg font-semibold">Slots</h1>
          
          <motion.div 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Coins className="w-4 h-4 text-primary" />
            <span className="font-bold text-primary">{coins.toLocaleString()}</span>
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
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

      {/* Bottom navigation */}
      <nav className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/50 px-6 py-4">
        <div className="flex justify-center gap-6">
          <NavButton icon={ShoppingBag} label="Shop" onClick={() => navigate('/game-2048-store')} />
          <NavButton icon={Users} label="Friends" onClick={() => navigate('/invite')} />
          <NavButton icon={Gift} label="Earn" onClick={() => navigate('/tasks')} />
        </div>
      </nav>
    </div>
  );
};

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const NavButton = ({ icon: Icon, label, onClick }: NavButtonProps) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
    whileTap={{ scale: 0.95 }}
  >
    <Icon className="w-5 h-5" />
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

export default Slots;
