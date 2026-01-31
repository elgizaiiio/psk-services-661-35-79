import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { useBoltTown } from '@/hooks/useBoltTown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SpecialTonTaskProps {
  isCompleted: boolean;
  onComplete?: () => void;
}

const SPECIAL_TASK_PRICE_TON = 0.5;
const SPECIAL_TASK_POINTS = 10;

export const SpecialTonTask: React.FC<SpecialTonTaskProps> = ({
  isCompleted,
  onComplete,
}) => {
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { addTaskPoints } = useBoltTown();
  const [isPaying, setIsPaying] = useState(false);

  const handlePayment = async () => {
    if (!isConnected) {
      try {
        await connectWallet();
      } catch (err) {
        toast.error('Please connect your wallet first');
        return;
      }
    }

    setIsPaying(true);
    try {
      const success = await sendDirectPayment({
        amount: SPECIAL_TASK_PRICE_TON,
        description: 'Bolt Town Special Task',
        productType: 'game_powerup',
        productId: 'bolt-town-special-task',
      });
      
      if (success) {
        // Add special task points
        await addTaskPoints(true);
        toast.success(`+${SPECIAL_TASK_POINTS} points earned!`);
        onComplete?.();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl border',
        isCompleted
          ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
          : 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Special Daily Task</h3>
          <p className="text-xs text-muted-foreground">
            {isCompleted ? 'Completed for today!' : 'Complete once per day for bonus points'}
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/20">
          <span className="font-bold text-primary">+{SPECIAL_TASK_POINTS}</span>
        </div>
      </div>

      {/* Content */}
      {!isCompleted && (
        <>
          <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 mb-3">
            <span className="text-sm text-muted-foreground">Cost</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">{SPECIAL_TASK_PRICE_TON} TON</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={isPaying || isProcessing}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-foreground"
          >
            {isPaying || isProcessing ? (
              <>
                <span className="mr-2 inline-flex h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Processing...
              </>
            ) : !isConnected ? (
              'Connect Wallet to Pay'
            ) : (
              <>
                Pay {SPECIAL_TASK_PRICE_TON} TON
              </>
            )}
          </Button>
        </>
      )}

      {isCompleted && (
        <div className="text-center py-2">
          <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
            Task completed! Come back tomorrow.
          </p>
        </div>
      )}
    </motion.div>
  );
};
