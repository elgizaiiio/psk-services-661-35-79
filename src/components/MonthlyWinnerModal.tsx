import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import monthlyWinnerImg from '@/assets/monthly-winner.png';

interface MonthlyWinnerModalProps {
  open: boolean;
  onClose: () => void;
}

const MonthlyWinnerModal: React.FC<MonthlyWinnerModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleGoToWallet = () => {
    onClose();
    navigate('/wallet');
  };

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
            className="text-muted-foreground text-sm mb-6"
          >
            You have been selected as this month's winner
          </motion.p>

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
