import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Trophy, DollarSign, Sparkles, ArrowRight } from 'lucide-react';

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
      <DialogContent className="max-w-sm border-0 bg-gradient-to-b from-amber-950/90 to-background p-0 gap-0 overflow-hidden" hideCloseButton>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              {/* Confetti/Sparkles Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-amber-400/60"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.3, 1, 0.3],
                      scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="relative z-10 p-6 text-center space-y-4">
                {/* Trophy Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <Trophy className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-amber-400 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Congratulations!
                    <Sparkles className="w-5 h-5" />
                  </h2>
                </motion.div>

                {/* Message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-foreground/90 text-sm">
                    You are the winner of the
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    Monthly Draw! 🎉
                  </p>
                </motion.div>

                {/* Prize Amount */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="py-4"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <span className="text-4xl font-bold text-green-400">3,000</span>
                    <span className="text-lg text-green-400/80">USDT</span>
                  </div>
                </motion.div>

                {/* Sub-message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-muted-foreground text-xs"
                >
                  The prize has been added to your wallet balance
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="pt-2"
                >
                  <Button
                    onClick={handleGoToWallet}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30"
                  >
                    <span>Withdraw Now</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>

                {/* Close hint */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default MonthlyWinnerModal;
