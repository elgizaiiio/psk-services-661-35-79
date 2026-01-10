import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { ArrowDownLeft, Loader2, CheckCircle2, X } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';
import { TonIcon } from '@/components/ui/currency-icons';

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const DepositModal: React.FC<DepositModalProps> = ({ open, onClose, userId, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount);
    
    if (!depositAmount || depositAmount < 0.1) {
      toast.error('Minimum deposit is 0.1 TON');
      return;
    }

    if (!wallet?.account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: depositRecord, error: insertError } = await supabase
        .from('deposit_requests')
        .insert({
          user_id: userId,
          currency: 'TON',
          amount: depositAmount,
          status: 'pending',
          wallet_address: wallet.account.address
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create deposit record:', insertError);
        throw new Error('Failed to create deposit request');
      }

      const amountNano = tonToNano(depositAmount);

      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: amountNano
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);

      if (result) {
        await supabase
          .from('deposit_requests')
          .update({
            tx_hash: result.boc,
            status: 'pending'
          })
          .eq('id', depositRecord.id);

        toast.info('Verifying transaction...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
          body: {
            paymentId: depositRecord.id,
            txHash: result.boc,
            walletAddress: wallet.account.address
          }
        });

        if (verifyResult.data?.ok) {
          await supabase
            .from('deposit_requests')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString()
            })
            .eq('id', depositRecord.id);

          const { data: currentUser } = await supabase
            .from('bolt_users')
            .select('ton_balance')
            .eq('id', userId)
            .single();

          if (currentUser) {
            await supabase
              .from('bolt_users')
              .update({
                ton_balance: (currentUser.ton_balance || 0) + depositAmount
              })
              .eq('id', userId);
          }

          setSuccess(true);
          toast.success('Deposit successful!');
          onSuccess?.();
          
          setTimeout(() => {
            setSuccess(false);
            setAmount('');
            onClose();
          }, 2000);
        } else {
          toast.warning('Sent! Verification may take a few minutes.');
        }
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      if (error.message?.includes('cancelled') || error.message?.includes('declined')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Deposit failed');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setAmount('');
      setSuccess(false);
      onClose();
    }
  };

  const quickAmounts = [0.5, 1, 2, 5];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5 text-green-500" />
            </div>
            <span className="font-semibold text-foreground">Deposit TON</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-12 text-center px-6"
          >
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground">Deposit Successful</p>
          </motion.div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Currency Display */}
            <div className="flex items-center justify-center gap-2">
              <TonIcon size={32} />
              <span className="text-lg font-semibold text-foreground">TON</span>
            </div>

            {/* Amount Input */}
            <div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 text-2xl text-center font-semibold bg-muted/30 border-0"
                min="0.1"
                step="0.1"
              />
            </div>

            {/* Quick Amounts */}
            <div className="flex gap-2">
              {quickAmounts.map((qa) => (
                <button
                  key={qa}
                  onClick={() => setAmount(qa.toString())}
                  className="flex-1 py-2 text-sm font-medium rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors"
                >
                  {qa} TON
                </button>
              ))}
            </div>

            {/* Min Notice */}
            <p className="text-xs text-center text-muted-foreground">
              Minimum deposit: 0.1 TON
            </p>

            {/* Deposit Button */}
            <Button
              onClick={handleDeposit}
              disabled={isProcessing || !amount || parseFloat(amount) < 0.1}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Deposit ${amount ? `${amount} TON` : ''}`
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
