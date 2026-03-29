import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface WinnerPrizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userId?: string;
}

const PRIZE_AMOUNT = 10000;

const WinnerPrizeModal: React.FC<WinnerPrizeModalProps> = ({
  isOpen,
  onClose,
  userName,
  userId,
}) => {
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const handleClaim = async () => {
    if (!userId) {
      navigate('/wallet');
      onClose();
      return;
    }

    setClaiming(true);
    try {
      // Fetch current balance then increment
      const { data: currentUser } = await supabase
        .from('bolt_users')
        .select('usdt_balance')
        .eq('id', userId)
        .single();

      const currentBalance = (currentUser as any)?.usdt_balance ?? 0;

      await supabase
        .from('bolt_users')
        .update({ usdt_balance: currentBalance + PRIZE_AMOUNT } as any)
        .eq('id', userId);

      setClaimed(true);
      setTimeout(() => {
        onClose();
        navigate('/wallet');
      }, 1400);
    } catch {
      // Navigate to wallet regardless
      onClose();
      navigate('/wallet');
    } finally {
      setClaiming(false);
    }
  };

  const displayName = userName
    ? userName.length > 22
      ? userName.slice(0, 22) + '...'
      : userName
    : 'User';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !claiming) onClose();
      }}
    >
      <DialogContent
        className="max-w-sm border-0 bg-background p-0 gap-0 overflow-hidden"
        hideCloseButton
      >
        <AnimatePresence mode="wait">
          {claimed ? (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 px-6 text-center space-y-3"
            >
              <p className="text-xl font-bold text-foreground">Prize Added</p>
              <p className="text-sm text-muted-foreground">
                10,000 USDT has been credited to your wallet
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="prize"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col"
            >
              {/* Top accent stripe */}
              <div className="h-1.5 w-full bg-primary" />

              {/* Content */}
              <div className="px-6 pt-8 pb-7 space-y-6 text-center">

                {/* Prize amount block */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase">
                    Congratulations
                  </p>
                  <p className="text-5xl font-bold text-foreground leading-tight">
                    $10,000
                  </p>
                  <p className="text-sm text-muted-foreground">
                    prize is waiting for you
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-border" />

                {/* Welcome text */}
                <div className="space-y-2">
                  <p className="text-base font-semibold text-foreground">
                    Welcome, {displayName}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You have been selected as one of our special winners.
                    Claim your{' '}
                    <span className="font-semibold text-foreground">10,000 USDT</span>{' '}
                    prize and it will be added directly to your wallet.
                  </p>
                </div>

                {/* Claim button */}
                <Button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Claim Prize'
                  )}
                </Button>

                {/* Dismiss */}
                <button
                  onClick={() => {
                    if (!claiming) onClose();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerPrizeModal;
