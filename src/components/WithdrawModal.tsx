import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currency: 'TON' | 'USDT' | 'BOLT';
  balance: number;
  onSuccess?: () => void;
}

const MIN_WITHDRAWALS = {
  TON: 1,
  USDT: 5,
  BOLT: 5000,
};

const CURRENCY_ICONS = {
  TON: <TonIcon size={32} />,
  USDT: <UsdtIcon size={32} />,
  BOLT: <BoltIcon size={32} />,
};

const WithdrawModal: React.FC<WithdrawModalProps> = ({
  open,
  onClose,
  userId,
  currency,
  balance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const minAmount = MIN_WITHDRAWALS[currency];
  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= minAmount && numAmount <= balance;
  const needsWallet = currency !== 'BOLT';
  const isValidWallet = !needsWallet || walletAddress.trim().length > 10;

  const handleSubmit = async () => {
    if (!isValidAmount || !isValidWallet) return;

    setIsSubmitting(true);
    try {
      // Get user info for the notification
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('telegram_username, first_name, telegram_id')
        .eq('id', userId)
        .single();

      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: userId,
        currency,
        amount: numAmount,
        wallet_address: needsWallet ? walletAddress.trim() : null,
      });

      if (error) throw error;

      // Send notification to admins via edge function
      try {
        await supabase.functions.invoke('notify-admin-withdrawal', {
          body: {
            userId,
            username: userData?.telegram_username || userData?.first_name || 'Unknown',
            telegramId: userData?.telegram_id,
            currency,
            amount: numAmount,
            walletAddress: needsWallet ? walletAddress.trim() : null,
          },
        });
      } catch (notifyError) {
        console.error('Failed to notify admins:', notifyError);
        // Don't fail the withdrawal if notification fails
      }

      setSuccess(true);
      toast.success('Withdrawal request submitted');
      
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setWalletAddress('');
    setSuccess(false);
    onClose();
  };

  const handleMaxClick = () => {
    setAmount(balance.toString());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {CURRENCY_ICONS[currency]}
            <span>Withdraw {currency}</span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Request Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Your withdrawal request is being processed
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-4"
            >
              {/* Balance Info */}
              <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="font-semibold text-foreground">{balance.toLocaleString()} {currency}</span>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder={`Min: ${minAmount} ${currency}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                    min={minAmount}
                    max={balance}
                    step="any"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs"
                    onClick={handleMaxClick}
                  >
                    MAX
                  </Button>
                </div>
                {numAmount > 0 && numAmount < minAmount && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Minimum withdrawal is {minAmount} {currency}
                  </p>
                )}
                {numAmount > balance && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Wallet Address Input (for TON/USDT) */}
              {needsWallet && (
                <div className="space-y-2">
                  <Label htmlFor="wallet">Wallet Address</Label>
                  <Input
                    id="wallet"
                    type="text"
                    placeholder={`Enter your ${currency} wallet address`}
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                  />
                </div>
              )}

              {/* Friday Notice for USDT */}
              {currency === 'USDT' && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    📅 يتم فتح السحب يوم الجمعة من كل أسبوع
                  </p>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                    Withdrawals are available every Friday
                  </p>
                </div>
              )}

              {/* Warning */}
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  {currency === 'USDT' 
                    ? 'سيتم معالجة طلبك يوم الجمعة. تأكد من صحة عنوان المحفظة.'
                    : 'Withdrawals are processed within 24-48 hours. Please ensure your wallet address is correct.'}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isValidAmount || !isValidWallet || isSubmitting}
                className="w-full h-12"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Withdraw ${numAmount > 0 ? numAmount.toLocaleString() : ''} ${currency}`
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawModal;
