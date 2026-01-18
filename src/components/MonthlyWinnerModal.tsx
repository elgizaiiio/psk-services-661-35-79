import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

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
      <DialogContent className="max-w-xs border-0 bg-background p-0 gap-0" hideCloseButton>
        <div className="p-6 text-center space-y-5">
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 rounded-full bg-amber-500 flex items-center justify-center"
          >
            <Trophy className="w-8 h-8 text-white" />
          </motion.div>

          {/* Title */}
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">
              Congratulations! 🎉
            </h2>
            <p className="text-sm text-muted-foreground">
              You won the Monthly Draw
            </p>
          </div>

          {/* Prize Amount */}
          <div className="py-3">
            <div className="inline-flex items-baseline gap-1">
              <span className="text-4xl font-bold text-green-500">$3,000</span>
              <span className="text-lg text-green-500/80">USDT</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Added to your wallet
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleGoToWallet}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
          >
            Withdraw Now
          </Button>

          {/* Close */}
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
