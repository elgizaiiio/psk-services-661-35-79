import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, Check, X, AlertTriangle } from 'lucide-react';
import { TonIcon } from '@/components/ui/currency-icons';
import { useTonConnectUI } from '@tonconnect/ui-react';

interface WalletVerificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  walletAddress: string;
  onVerified: () => void;
}

const VERIFICATION_FEE = 0.5; // TON
const ADMIN_WALLET = 'UQBYkuShEeeXsFapHtT4LNALrprfZ9rF3hCP3lYorBvro7SM';

const WalletVerificationModal: React.FC<WalletVerificationModalProps> = ({
  open,
  onClose,
  userId,
  walletAddress,
  onVerified,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check if wallet is already verified
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!userId || !walletAddress) return;
      
      setCheckingStatus(true);
      try {
        const { data } = await supabase
          .from('wallet_verifications')
          .select('id')
          .eq('user_id', userId)
          .eq('wallet_address', walletAddress)
          .single();
        
        if (data) {
          setIsVerified(true);
          onVerified();
        }
      } catch (error) {
        // Not verified yet
      } finally {
        setCheckingStatus(false);
      }
    };

    if (open) {
      checkVerificationStatus();
    }
  }, [open, userId, walletAddress, onVerified]);

  const handleVerify = async () => {
    if (!tonConnectUI.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      // Create TON transaction for verification fee
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: ADMIN_WALLET,
            amount: (VERIFICATION_FEE * 1e9).toString(), // Convert to nanoTON
          },
        ],
      };

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result.boc) {
        // Record verification in database
        const { error } = await supabase
          .from('wallet_verifications')
          .insert({
            user_id: userId,
            wallet_address: walletAddress,
            currency: 'TON',
            verification_fee: VERIFICATION_FEE,
            tx_hash: result.boc,
          });

        if (error) throw error;

        setIsVerified(true);
        toast.success('Wallet verified successfully!');
        
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error?.message?.includes('Cancelled')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error('Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (checkingStatus) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm border-0 bg-background p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-semibold text-foreground">Wallet Verification</span>
          </div>
          <button onClick={handleClose} className="text-muted-foreground" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isVerified ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12 text-center px-6"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Wallet Verified!</h3>
              <p className="text-sm text-muted-foreground">
                You can now withdraw your funds
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
              {/* Warning Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-foreground mb-2">
                  Verify Your Wallet
                </h3>
                <p className="text-sm text-muted-foreground">
                  To ensure you're a real person and not a bot, a one-time verification fee is required.
                </p>
              </div>

              {/* Fee Display */}
              <div className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verification Fee</span>
                  <div className="flex items-center gap-2">
                    <TonIcon size={20} />
                    <span className="font-bold text-foreground">{VERIFICATION_FEE} TON</span>
                  </div>
                </div>
                
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-green-500 flex items-center gap-2">
                    <Check className="w-3 h-3" />
                    This amount will be sent back to your wallet
                  </p>
                </div>
              </div>

              {/* Why Section */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Why is this needed?</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Prevents bots from abusing the system</li>
                  <li>• Verifies wallet ownership</li>
                  <li>• One-time verification per wallet</li>
                  <li>• Fee is refunded to your wallet</li>
                </ul>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Verify Wallet ({VERIFICATION_FEE} TON)
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By verifying, you confirm you own this wallet
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WalletVerificationModal;