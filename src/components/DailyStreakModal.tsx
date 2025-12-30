import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { toast } from 'sonner';

const DailyStreakModal = () => {
  const {
    currentStreak,
    canClaim,
    loading,
    claiming,
    claimDailyReward,
    getNextReward,
    streakRewards,
  } = useDailyStreak();

  const [isOpen, setIsOpen] = useState(false);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  // Show modal when canClaim is true and hasn't been shown this session
  useEffect(() => {
    if (!loading && canClaim && !hasShownThisSession) {
      setIsOpen(true);
      setHasShownThisSession(true);
    }
  }, [loading, canClaim, hasShownThisSession]);

  const handleClaim = async () => {
    const reward = await claimDailyReward();
    if (reward) {
      toast.success(`Day ${(currentStreak % 7) + 1} reward claimed: +${reward} BOLT`);
      // Close modal after successful claim
      setTimeout(() => setIsOpen(false), 500);
    } else {
      toast.error('Failed to claim reward');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const nextDay = (currentStreak % 7) + 1;

  if (loading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-x-4 top-[30%] -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Daily Bonus</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Day {currentStreak + 1} of your streak
                </p>
              </div>

              {/* Streak Counter */}
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-primary">{currentStreak}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                  Days streak
                </p>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 mb-6">
                {streakRewards.map((reward, index) => {
                  const day = index + 1;
                  const isCompleted = day <= (currentStreak % 7 === 0 && currentStreak > 0 ? 7 : currentStreak % 7);
                  const isCurrent = day === nextDay;
                  const isPast = day < nextDay || (currentStreak > 0 && currentStreak % 7 === 0);

                  return (
                    <motion.div
                      key={day}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        relative p-2 rounded-lg text-center transition-all
                        ${isCurrent 
                          ? 'bg-primary text-primary-foreground' 
                          : isPast || isCompleted
                            ? 'bg-muted/50 text-muted-foreground'
                            : 'bg-muted/20 text-muted-foreground/50'
                        }
                      `}
                    >
                      <p className="text-[8px] font-medium uppercase tracking-wider opacity-70">Day</p>
                      <p className="text-xs font-bold">{day}</p>
                      <p className="text-[8px] mt-0.5">+{reward}</p>
                      
                      {(isPast || isCompleted) && !isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg">
                          <span className="text-[9px] font-medium text-muted-foreground">Done</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Today's Reward */}
              <div className="text-center mb-4 p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">Today's Reward</p>
                <p className="text-2xl font-bold text-foreground">+{getNextReward()} BOLT</p>
              </div>

              {/* Claim Button */}
              <Button
                onClick={handleClaim}
                disabled={!canClaim || claiming}
                className="w-full h-12 text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:bg-muted disabled:text-muted-foreground"
              >
                {claiming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  `Claim Day ${nextDay} Reward`
                )}
              </Button>

              {/* Skip Button */}
              <button
                onClick={handleClose}
                className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Claim later
              </button>

              {/* Info */}
              <p className="text-[10px] text-muted-foreground text-center mt-4">
                Login daily to maintain your streak
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DailyStreakModal;