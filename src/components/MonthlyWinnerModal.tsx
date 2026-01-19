import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

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
      <DialogContent className="max-w-[320px] border-0 bg-[#0a0a0f] p-0 gap-0 overflow-hidden rounded-2xl" hideCloseButton>
        {/* Gold gradient header */}
        <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
        
        <div className="px-8 py-10 text-center">
          {/* Trophy emoji with glow */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-6xl mb-6"
            style={{ filter: 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.4))' }}
          >
            🏆
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Congratulations!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-sm mb-8"
          >
            You won the Monthly Draw
          </motion.p>

          {/* Prize Amount */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              $3,000
            </div>
            <div className="text-green-400/70 text-sm mt-1 font-medium">
              USDT
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={handleGoToWallet}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl transition-all duration-200 text-base"
          >
            Withdraw Now
          </motion.button>

          {/* Close link */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className="mt-5 text-white/40 hover:text-white/60 text-sm transition-colors"
          >
            Maybe Later
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
