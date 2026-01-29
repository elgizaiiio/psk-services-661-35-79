import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Gem } from 'lucide-react';
import { TonIcon, BoltIcon } from '@/components/ui/currency-icons';
import { toast } from 'sonner';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { supabase } from '@/integrations/supabase/client';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface TonPaymentTaskProps {
  userId: string;
  taskId: string;
  onComplete: () => void;
}

const PAYMENT_AMOUNT = 0.5; // TON
const REWARD_AMOUNT = 200; // BOLT

const TonPaymentTask: React.FC<TonPaymentTaskProps> = ({ userId, taskId, onComplete }) => {
  const [tonConnectUI] = useTonConnectUI();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!tonConnectUI.connected) {
      toast.error('Please connect your TON wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      // Create TON transaction
      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: tonToNano(PAYMENT_AMOUNT),
          },
        ],
      };

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result.boc) {
        // Record payment and give reward
        const { error: taskError } = await supabase
          .from('bolt_completed_tasks')
          .insert({
            user_id: userId,
            task_id: taskId,
            points_earned: REWARD_AMOUNT,
          });

        if (taskError) {
          console.error('Task completion error:', taskError);
        }

        // Update user balance
        const { data: userData } = await supabase
          .from('bolt_users')
          .select('token_balance')
          .eq('id', userId)
          .single();

        if (userData) {
          await supabase
            .from('bolt_users')
            .update({
              token_balance: (userData.token_balance || 0) + REWARD_AMOUNT,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }

        // Log payment (using a general record approach since ton_payments has specific schema)
        console.log('Task payment recorded:', { userId, amount: PAYMENT_AMOUNT, tx: result.boc });

        toast.success(`Payment successful! +${REWARD_AMOUNT} BOLT added`);
        onComplete();
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error?.message?.includes('Cancelled')) {
        toast.error('Payment cancelled');
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.button
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full p-4 rounded-xl border text-left transition-all bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/50"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/20">
          <Gem className="w-6 h-6 text-blue-400" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">Pay 0.5 TON</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <TonIcon size={12} />
              -0.5 TON
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="flex items-center gap-1 text-primary">
              <BoltIcon size={12} />
              +200 BOLT
            </span>
          </div>
        </div>

        {isProcessing ? (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        ) : (
          <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
            Pay
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default TonPaymentTask;