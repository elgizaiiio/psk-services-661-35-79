import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Check, X, Clock } from 'lucide-react';
import { EthIcon } from '@/components/ui/currency-icons';

interface EthWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  onSuccess?: () => void;
}

const MIN_WITHDRAWAL = 0.001;

const EthWithdrawModal: React.FC<EthWithdrawModalProps> = ({
  open,
  onClose,
  userId,
  balance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= MIN_WITHDRAWAL && numAmount <= balance;
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);

  const handleSubmit = async () => {
    if (!isValidAmount || !isValidAddress) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdraw-eth', {
        body: {
          userId,
          walletAddress,
          amount: numAmount,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Withdrawal failed');

      setSuccess(true);
      toast.success('Withdrawal request submitted!');
      
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 3000);
    } catch (error: any) {
      console.error('ETH withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal');
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
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <EthIcon size={24} />
            </div>
            <div>
              <span className="font-semibold text-foreground">Withdraw ETH</span>
              <p className="text-xs text-orange-500">Manual (24h)</p>
            </div>
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
              <h3 className="text-lg font-semibold text-foreground mb-1">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                Your withdrawal will be processed within 24 hours
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
                <EthIcon size={36} />
                <span className="text-lg font-semibold text-foreground">Ethereum</span>
              </div>

              {/* Balance Info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-semibold text-foreground">{balance.toFixed(6)} ETH</span>
              </div>

              {/* Wallet Address Input */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">ETH Wallet Address</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="h-12 bg-muted/30 border-0 font-mono text-sm"
                />
                {walletAddress && !isValidAddress && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Invalid ETH address format
                  </p>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={`Min: ${MIN_WITHDRAWAL}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pr-16 bg-muted/30 border-0"
                    min={MIN_WITHDRAWAL}
                    max={balance}
                    step="0.001"
                  />
                  <button
                    type="button"
                    onClick={handleMaxClick}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary"
                  >
                    MAX
                  </button>
                </div>
                {numAmount > 0 && numAmount < MIN_WITHDRAWAL && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Minimum is {MIN_WITHDRAWAL} ETH
                  </p>
                )}
                {numAmount > balance && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Insufficient balance
                  </p>
                )}
              </div>

              {/* Notice */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-500/10">
                <Clock className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-orange-600">
                  ETH withdrawals are processed manually within 24 hours
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isValidAmount || !isValidAddress || isSubmitting}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Withdraw ${numAmount > 0 ? numAmount.toFixed(6) : ''} ETH`
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default EthWithdrawModal;
