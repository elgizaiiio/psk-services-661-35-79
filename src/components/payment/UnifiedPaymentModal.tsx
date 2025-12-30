import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, Star, AlertCircle } from 'lucide-react';
import { useUnifiedPayment, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { toast } from 'sonner';

interface UnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase' | 'spin_tickets';
  productId?: string;
  credits?: number;
  onSuccess?: () => void;
}

// Stars price: approximately $0.02 per star
const TON_TO_USD = 6;
const STAR_PRICE_USD = 0.02;

export const UnifiedPaymentModal: React.FC<UnifiedPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  description,
  productType,
  productId,
  credits,
  onSuccess,
}) => {
  const navigate = useNavigate();
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
  } = useUnifiedPayment();

  const [starsLoading, setStarsLoading] = useState(false);
  const { webApp } = useTelegramAuth();

  // Calculate stars amount from TON
  const tonInUsd = amount * TON_TO_USD;
  const starsAmount = Math.ceil(tonInUsd / STAR_PRICE_USD);

  const handleTonPayment = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const params: UnifiedPaymentParams = {
      amount,
      description,
      productType,
      productId,
      credits,
    };

    const success = await processPayment(params);
    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleStarsPayment = async () => {
    if (!webApp) {
      toast.error('Stars payment only available in Telegram');
      return;
    }

    setStarsLoading(true);
    try {
      if ('openInvoice' in webApp) {
        toast.info('Stars payment coming soon!');
      } else {
        toast.error('Stars payment not supported in this version');
      }
    } catch (error) {
      console.error('Stars payment error:', error);
      toast.error('Failed to process Stars payment');
    } finally {
      setStarsLoading(false);
    }
  };

  const handleGoToWallet = () => {
    onClose();
    navigate('/wallet');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Amount Display */}
          <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">{description}</p>
            <p className="text-3xl font-bold text-primary">{amount} TON</p>
            <p className="text-xs text-muted-foreground mt-1">≈ ${tonInUsd.toFixed(2)} USD</p>
            {credits && (
              <Badge variant="secondary" className="mt-2">
                +{credits} Tickets
              </Badge>
            )}
          </div>

          {/* Wallet Connection Warning */}
          {!isWalletConnected && (
            <div className="p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">Wallet not connected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Please connect your wallet in the Wallet page first
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGoToWallet}
                    className="mt-3 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
                  >
                    Go to Wallet
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Pay with</p>
            
            {/* TON Button */}
            <Button
              className="w-full h-14 justify-between px-4"
              variant={isWalletConnected ? "default" : "secondary"}
              onClick={handleTonPayment}
              disabled={isProcessing || !isWalletConnected}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0098EA] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">💎</span>
                </div>
                <span className="font-semibold">TON</span>
              </div>
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="font-bold">{amount} TON</span>
              )}
            </Button>

            {/* Stars Button */}
            <Button
              className="w-full h-14 justify-between px-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
              onClick={handleStarsPayment}
              disabled={starsLoading}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-white text-white" />
                </div>
                <span className="font-semibold text-white">Stars</span>
              </div>
              {starsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              ) : (
                <span className="font-bold text-white">{starsAmount} ⭐</span>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Payment will be confirmed automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
