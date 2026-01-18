import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { getValidUntil, tonToNano } from '@/lib/ton-constants';

interface WalletVerificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  walletAddress: string;
  onVerified: () => void;
}

const VERIFICATION_FEE = 3; // TON
const VERIFICATION_WALLET = 'UQCFrjvfMxqHh4-tooMa22uNvbKGd73KfGab3cePjZxq_uNb';

const WalletVerificationModal: React.FC<WalletVerificationModalProps> = ({
  open,
  onClose,
  userId,
  walletAddress,
  onVerified,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Always require new verification payment - no checking old records
  useEffect(() => {
    if (open) {
      setCheckingStatus(false);
      setIsVerified(false);
    }
  }, [open]);

  const handleVerify = async () => {
    // Check if wallet is connected
    if (!wallet?.account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!tonConnectUI.connected) {
      toast.error('Wallet not connected');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Starting wallet verification transaction...');
      console.log('Destination:', VERIFICATION_WALLET);
      console.log('Amount:', VERIFICATION_FEE, 'TON');
      
      // Create TON transaction using consistent helpers
      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: VERIFICATION_WALLET,
            amount: tonToNano(VERIFICATION_FEE)
          }
        ]
      };

      console.log('Transaction object:', JSON.stringify(transaction, null, 2));
      
      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);
      
      console.log('Transaction result:', result);
      
      if (result && result.boc) {
        // Record verification in database
        const { error } = await supabase
          .from('wallet_verifications')
          .insert({
            user_id: userId,
            wallet_address: walletAddress,
            currency: 'TON',
            verification_fee: VERIFICATION_FEE,
            tx_hash: result.boc,
            verified_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Wallet verification insert error:', error);
          throw error;
        }

        setIsVerified(true);
        toast.success('Wallet verified successfully!');
        
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1500);
      } else {
        throw new Error('No transaction result received');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      
      if (error?.message?.includes('Cancelled') || error?.message?.includes('cancelled') || error?.message?.includes('User declined')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(`Verification failed: ${error?.message || 'Unknown error'}`);
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
        <DialogContent className="max-w-xs border-0 bg-background p-6">
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xs border-0 bg-background p-0 gap-0" hideCloseButton>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <span className="font-semibold text-foreground">Wallet Verification</span>
          <button onClick={handleClose} className="text-muted-foreground" disabled={isLoading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isVerified ? (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-10 text-center px-6"
            >
              <p className="text-lg font-semibold text-green-500 mb-1">✓ Verified</p>
              <p className="text-sm text-muted-foreground">
                You can now withdraw
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 space-y-4"
            >
              {/* Simple Text */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Verify your wallet ownership
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {VERIFICATION_FEE} TON
                </p>
                <p className="text-xs text-muted-foreground">
                  One-time fee • Refunded to your wallet
                </p>
              </div>

              {/* Verify Button */}
              <Button
                onClick={handleVerify}
                disabled={isLoading || !wallet?.account}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !wallet?.account ? (
                  'Connect wallet first'
                ) : (
                  'Verify Wallet'
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WalletVerificationModal;
