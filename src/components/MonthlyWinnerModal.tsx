import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Clock } from 'lucide-react';
import { usePromoSettings } from '@/hooks/usePromoSettings';

interface MonthlyWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const MonthlyWinnerModal: React.FC<MonthlyWinnerModalProps> = ({
  isOpen,
  onClose,
  username = 'User',
}) => {
  const [showWinner, setShowWinner] = useState(false);
  
  // Use backend promo settings
  const { timeRemaining } = usePromoSettings();

  useEffect(() => {
    if (isOpen) {
      setShowWinner(false);
    }
  }, [isOpen]);

  const handleShowWinner = () => {
    setShowWinner(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0 overflow-hidden" hideCloseButton>
        <AnimatePresence mode="wait">
          {!showWinner ? (
            <motion.div
              key="prize"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Winner Image */}
              <img
                src="/images/monthly-winner.png"
                alt="Monthly Winner"
                className="w-full h-auto"
              />

              {/* Countdown Timer */}
              <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                <Clock className="w-4 h-4" />
                <span>{formatCountdown(timeRemaining)}</span>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    Congratulations
                  </p>
                  <p className="text-lg text-muted-foreground">
                    You won the monthly prize
                  </p>
                  <p className="text-4xl font-bold text-primary">
                    $4,000 USDT
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Verify your identity to withdraw your prize. This is required to prevent bots and fake accounts from claiming rewards.
                </p>

                <div className="flex flex-col gap-2">
                  <Button onClick={onClose} className="w-full" size="lg">
                    Withdraw Now
                  </Button>
                  <Button
                    onClick={handleShowWinner}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Who is the winner
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="winner-info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 text-center space-y-4"
            >
              <button
                onClick={() => setShowWinner(false)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-lg font-semibold text-muted-foreground">
                  Monthly Winner
                </p>
                <p className="text-2xl font-bold text-foreground break-all">
                  @{username}
                </p>
                <p className="text-primary text-xl font-bold">
                  $4,000 USDT
                </p>
              </div>

              <Button onClick={() => setShowWinner(false)} variant="outline" className="w-full">
                Back
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
