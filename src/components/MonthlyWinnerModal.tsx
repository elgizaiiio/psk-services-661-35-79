import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import monthlyWinnerImg from '@/assets/monthly-winner.png';

interface MonthlyWinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

const PRIZE_AMOUNT = 3000;
const EXPIRY_HOURS = 48;

const MonthlyWinnerModal: React.FC<MonthlyWinnerModalProps> = ({
  isOpen,
  onClose,
  userName,
}) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    hours: EXPIRY_HOURS,
    minutes: 0,
    seconds: 0,
  });

  // Calculate and update countdown
  useEffect(() => {
    if (!isOpen) return;

    // Get expiry time from localStorage or set new one
    const storageKey = 'monthly_winner_expiry';
    let expiryTime = localStorage.getItem(storageKey);
    
    if (!expiryTime) {
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + EXPIRY_HOURS);
      expiryTime = newExpiry.toISOString();
      localStorage.setItem(storageKey, expiryTime);
    }

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(expiryTime!);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClaimNow = () => {
    onClose();
    navigate('/wallet');
  };

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[340px] border-0 bg-background p-0 gap-0 overflow-hidden rounded-2xl" hideCloseButton>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Winner Image */}
            <img
              src={monthlyWinnerImg}
              alt="Monthly Winner"
              className="w-full h-52 object-cover"
            />

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Congratulations Text */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-foreground mb-1">
                  🎉 Congratulations!
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userName ? `@${userName}, you` : 'You'} won the monthly prize!
                </p>
              </div>

              {/* Prize Amount */}
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 text-center border border-green-500/20">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  <span className="text-3xl font-bold text-green-500">
                    {PRIZE_AMOUNT.toLocaleString()} USDT
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Added to your balance</p>
              </div>

              {/* Countdown Timer */}
              <div className="bg-muted/40 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Claim expires in</span>
                </div>
                <div className="flex justify-center gap-2">
                  {[
                    { value: timeLeft.hours, label: 'HRS' },
                    { value: timeLeft.minutes, label: 'MIN' },
                    { value: timeLeft.seconds, label: 'SEC' },
                  ].map((item, idx) => (
                    <React.Fragment key={item.label}>
                      {idx > 0 && <span className="text-2xl font-bold text-muted-foreground">:</span>}
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[52px] text-center">
                        <p className="text-2xl font-bold text-foreground">{formatNumber(item.value)}</p>
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Claim Button */}
              <Button 
                onClick={handleClaimNow}
                className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold"
              >
                Claim Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              {/* Voting Reference */}
              <a 
                href="https://t.me/boltcomm/59"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Based on community voting →
              </a>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
