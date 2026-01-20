import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import monthlyWinnerImg from '@/assets/monthly-winner.png';

const OFFER_KEY = 'monthly_winner_start_time';
const OFFER_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface MonthlyWinnerModalProps {
  open: boolean;
  onClose: () => void;
}

const MonthlyWinnerModal: React.FC<MonthlyWinnerModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState<number>(OFFER_DURATION);
  const [isExpired, setIsExpired] = useState(false);

  // Initialize timer on first open
  useEffect(() => {
    if (open) {
      const storedTime = localStorage.getItem(OFFER_KEY);
      if (!storedTime) {
        // First time opening - set start time
        localStorage.setItem(OFFER_KEY, Date.now().toString());
      }
    }
  }, [open]);

  // Update countdown every second
  useEffect(() => {
    if (!open) return;

    const updateTimer = () => {
      const storedTime = localStorage.getItem(OFFER_KEY);
      if (!storedTime) return;

      const startTime = parseInt(storedTime);
      const endTime = startTime + OFFER_DURATION;
      const remaining = endTime - Date.now();

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        onClose();
      } else {
        setTimeRemaining(remaining);
      }
    };

    // Initial update
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [open, onClose]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleGoToWallet = () => {
    onClose();
    navigate('/wallet');
  };

  // Don't show if expired
  if (isExpired) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] border border-border bg-background p-0 gap-0 overflow-hidden rounded-2xl" hideCloseButton>
        {/* Image */}
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={monthlyWinnerImg}
          alt="Monthly Winner"
          className="w-full h-44 object-cover"
        />
        
        <div className="p-6 text-center">
          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-foreground mb-2"
          >
            Monthly Winner
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm mb-4"
          >
            You have been selected as this month's winner
          </motion.p>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-destructive/10 rounded-lg"
          >
            <Clock className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive font-medium">
              Expires in: {formatTime(timeRemaining)}
            </span>
          </motion.div>

          {/* Prize Amount */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <div className="text-4xl font-bold text-green-500">
              $3,000
            </div>
            <div className="text-green-500/70 text-sm mt-1">
              USDT
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={handleGoToWallet}
            className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
          >
            Withdraw Now
          </motion.button>

          {/* Close link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className="mt-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            Maybe Later
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
