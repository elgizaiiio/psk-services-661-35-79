import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, Check, X, Zap } from 'lucide-react';
import { ViralIcon } from '@/components/ui/currency-icons';
import { useTonWallet } from '@tonconnect/ui-react';

interface ViralWithdrawModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  balance: number;
  onSuccess?: () => void;
}

const MIN_WITHDRAWAL = 100;

const ViralWithdrawModal: React.FC<ViralWithdrawModalProps> = ({
  open,
  onClose,
  userId,
  balance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const wallet = useTonWallet();

  const numAmount = parseFloat(amount) || 0;
  const isValidAmount = numAmount >= MIN_WITHDRAWAL && numAmount <= balance;
  const walletAddress = wallet?.account?.address;

  const handleSubmit = async () => {
    if (!isValidAmount || !walletAddress) return;

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('withdraw-viral', {
        body: {
          userId,
          walletAddress,
          amount: numAmount,
        },
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Withdrawal failed');

      setTxHash(data.txHash);
      setSuccess(true);
      toast.success('Withdrawal completed!');
      
      setTimeout(() => {
        onSuccess?.();
        handleClose();
      }, 3000);
    } catch (error: any) {
      console.error('Viral withdrawal error:', error);
      toast.error(error.message || 'Failed to process withdrawal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAmount('');
    setSuccess(false);
    setTxHash(null);
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
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <span className="font-semibold text-foreground">Withdraw VIRAL</span>
              <p className="text-xs text-green-500">Instant</p>
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
              <h3 className="text-lg font-semibold text-foreground mb-1">Withdrawal Complete!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {numAmount.toLocaleString()} VIRAL sent to your wallet
              </p>
              {txHash && (
                <p className="text-xs text-muted-foreground font-mono">
                  TX: {txHash.slice(0, 12)}...
                </p>
              )}
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
                <ViralIcon size={36} />
                <span className="text-lg font-semibold text-foreground">VIRAL</span>
              </div>

              {/* Balance Info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
                <span className="text-sm text-muted-foreground">Available</span>
                <span className="font-semibold text-foreground">{balance.toLocaleString()} VIRAL</span>
              </div>

              {/* Wallet Address Display */}
              {walletAddress && (
                <div className="p-3 rounded-xl bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Sending to</p>
                  <p className="text-sm font-mono text-foreground truncate">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder={`Min: ${MIN_WITHDRAWAL}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 pr-16 bg-muted/30 border-0"
                    min={MIN_WITHDRAWAL}
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
                {numAmount > 0 && numAmount < MIN_WITHDRAWAL && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="w-3 h-3" />
                    Minimum is {MIN_WITHDRAWAL} VIRAL
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
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10">
                <Zap className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-600">
                  Instant withdrawal - tokens sent immediately!
                </p>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!isValidAmount || !walletAddress || isSubmitting}
                className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Withdraw ${numAmount > 0 ? numAmount.toLocaleString() : ''} VIRAL`
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ViralWithdrawModal;
