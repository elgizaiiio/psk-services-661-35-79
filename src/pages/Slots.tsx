import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SlotMachine } from "@/components/slots/SlotMachine";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { toast } from "sonner";

const DAILY_FREE_SPINS = 5;

// Streak bonus spins based on streak level
const getStreakBonus = (streak: number): number => {
  if (streak >= 30) return 10;
  if (streak >= 14) return 7;
  if (streak >= 7) return 5;
  if (streak >= 3) return 3;
  if (streak >= 1) return 1;
  return 0;
};

const getStreakTitle = (streak: number): string => {
  if (streak >= 30) return 'Legendary';
  if (streak >= 14) return 'Champion';
  if (streak >= 7) return 'Expert';
  if (streak >= 3) return 'Rising Star';
  if (streak >= 1) return 'Beginner';
  return 'New';
};

const Slots = () => {
  const navigate = useNavigate();
  const { user } = useTelegramAuth();
  const [coins, setCoins] = useState(1000);
  const [boltTokens, setBoltTokens] = useState(0);
  const [freeSpins, setFreeSpins] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [streakReward, setStreakReward] = useState(0);
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

  const checkStreakBroken = useCallback((lastClaim: string | null): boolean => {
    if (!lastClaim) return false;
    
    const lastClaimDate = new Date(lastClaim);
    const now = new Date();
    
    const lastClaimDay = new Date(lastClaimDate.toDateString());
    const today = new Date(now.toDateString());
    
    // Calculate days difference
    const diffTime = today.getTime() - lastClaimDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Streak is broken if more than 1 day passed
    return diffDays > 1;
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

        // Load bolt tokens and user ID
        const { data: boltData, error: boltError } = await supabase
          .from('bolt_users')
          .select('id, token_balance')
          .eq('telegram_id', user.id)
          .maybeSingle();

        if (!boltError && boltData) {
          setBoltTokens(boltData.token_balance);

          // Load streak data
          const { data: streakData, error: streakError } = await supabase
            .from('bolt_user_streaks')
            .select('*')
            .eq('user_id', boltData.id)
            .maybeSingle();

          if (!streakError && streakData) {
            const isBroken = checkStreakBroken(streakData.last_claim_at);
            if (isBroken) {
              setCurrentStreak(0);
            } else {
              setCurrentStreak(streakData.current_streak);
            }
            setMaxStreak(streakData.max_streak);
          }
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
  }, [user, checkDailyClaim, checkStreakBroken]);

  const claimDailySpins = async () => {
    if (!user?.id || !canClaimDaily) return;

    try {
      // Get bolt user id
      const { data: boltData } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', user.id)
        .maybeSingle();

      let newStreak = currentStreak + 1;
      const streakBonus = getStreakBonus(newStreak);
      const totalSpins = DAILY_FREE_SPINS + streakBonus;
      const newSpins = freeSpins + totalSpins;

      // Update free spins
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

      // Update streak if user exists in bolt_users
      if (boltData) {
        const { data: existingStreak } = await supabase
          .from('bolt_user_streaks')
          .select('*')
          .eq('user_id', boltData.id)
          .maybeSingle();

        const newMaxStreak = Math.max(newStreak, maxStreak);

        if (existingStreak) {
          await supabase
            .from('bolt_user_streaks')
            .update({
              current_streak: newStreak,
              max_streak: newMaxStreak,
              last_claim_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', boltData.id);
        } else {
          await supabase
            .from('bolt_user_streaks')
            .insert({
              user_id: boltData.id,
              current_streak: newStreak,
              max_streak: newStreak,
              last_claim_at: new Date().toISOString(),
            });
        }

        setMaxStreak(newMaxStreak);
      }

      setFreeSpins(newSpins);
      setCurrentStreak(newStreak);
      setCanClaimDaily(false);
      setStreakReward(streakBonus);
      setShowStreakModal(true);

      toast.success(`🔥 Day ${newStreak} Streak! +${totalSpins} Spins!`);
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
      {/* Streak Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowStreakModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-gradient-to-br from-card to-card/80 rounded-3xl p-6 max-w-sm w-full border border-border/30 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fire animation */}
              <div className="text-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-6xl mb-2"
                >
                  🔥
                </motion.div>
                <h2 className="text-2xl font-black text-foreground">Day {currentStreak} Streak!</h2>
                <p className="text-sm text-muted-foreground mt-1">{getStreakTitle(currentStreak)}</p>
              </div>

              {/* Streak progress */}
              <div className="bg-background/50 rounded-2xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Streak Progress</span>
                  <span className="text-xs font-bold text-primary">{currentStreak} days</span>
                </div>
                <div className="flex gap-1">
                  {[3, 7, 14, 30].map((milestone) => (
                    <div
                      key={milestone}
                      className={`flex-1 h-2 rounded-full transition-all ${
                        currentStreak >= milestone 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                          : 'bg-muted/30'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>3d</span>
                  <span>7d</span>
                  <span>14d</span>
                  <span>30d</span>
                </div>
              </div>

              {/* Rewards */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                  <span className="text-sm text-foreground">Daily Spins</span>
                  <span className="font-bold text-amber-400">+{DAILY_FREE_SPINS}</span>
                </div>
                {streakReward > 0 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center justify-between bg-orange-500/10 rounded-xl p-3 border border-orange-500/20"
                  >
                    <span className="text-sm text-foreground">Streak Bonus</span>
                    <span className="font-bold text-orange-400">+{streakReward}</span>
                  </motion.div>
                )}
              </div>

              {/* Next milestone */}
              {currentStreak < 30 && (
                <div className="text-center text-xs text-muted-foreground mb-4">
                  Next bonus at day {
                    currentStreak < 3 ? 3 :
                    currentStreak < 7 ? 7 :
                    currentStreak < 14 ? 14 : 30
                  } ({
                    currentStreak < 3 ? 3 - currentStreak :
                    currentStreak < 7 ? 7 - currentStreak :
                    currentStreak < 14 ? 14 - currentStreak : 30 - currentStreak
                  } days left)
                </div>
              )}

              <button
                onClick={() => setShowStreakModal(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
              >
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with stats */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-2xl border-b border-border/20">
        <div className="px-4 py-4">
          {/* Title & Streak */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-foreground">Slots</h1>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full border border-orange-500/20">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-bold text-orange-400">{currentStreak}</span>
                </div>
              )}
            </div>
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
                <motion.div 
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <span className="text-[8px] text-white font-bold">+</span>
                </motion.div>
              )}
              <div className="text-2xl font-black text-amber-400">{freeSpins}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70 font-medium">
                {canClaimDaily ? `+${DAILY_FREE_SPINS + getStreakBonus(currentStreak + 1)}` : 'Spins'}
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