import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet, Star, AlertCircle, X } from 'lucide-react';
import { useUnifiedPayment, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { TonIcon } from '@/components/ui/currency-icons';

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
  const { webApp, user: tgUser } = useTelegramAuth();
  const { user } = useViralMining(tgUser);
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
  } = useUnifiedPayment();

  const [starsLoading, setStarsLoading] = useState(false);

  // Calculate stars amount from TON
  const tonInUsd = amount * TON_TO_USD;
  const starsAmount = Math.ceil(tonInUsd / STAR_PRICE_USD);

  const handleTonPayment = async () => {
    if (!isWalletConnected) {
      toast.error('Please connect your wallet first');
      navigate('/wallet');
      onClose();
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
    if (!webApp || !user?.id || !tgUser?.id) {
      toast.error('Stars payment only available in Telegram');
      return;
    }

    setStarsLoading(true);
    try {
      // Create payment record
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('stars_payments')
        .insert({
          user_id: user.id,
          telegram_id: tgUser.id,
          product_type: productType,
          product_id: productId || null,
          amount_stars: starsAmount,
          amount_usd: tonInUsd,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Create invoice link via edge function
      const { data: invoiceData, error: invoiceError } = await supabase.functions.invoke('create-stars-invoice', {
        body: {
          title: description,
          description: `Purchase ${description}`,
          payload: JSON.stringify({
            payment_id: paymentRecord.id,
            product_type: productType,
            product_id: productId,
            credits: credits,
            user_id: user.id,
          }),
          amount: starsAmount,
        },
      });

      if (invoiceError) throw invoiceError;

      if (invoiceData?.invoice_link && 'openInvoice' in webApp) {
        // Open Telegram Stars payment
        (webApp as any).openInvoice(invoiceData.invoice_link, async (status: string) => {
          if (status === 'paid') {
            // Update payment status
            await supabase
              .from('stars_payments')
              .update({ status: 'completed' })
              .eq('id', paymentRecord.id);

            onSuccess?.();
            onClose();
            toast.success('Payment successful!');
          } else if (status === 'cancelled') {
            await supabase
              .from('stars_payments')
              .update({ status: 'cancelled' })
              .eq('id', paymentRecord.id);
            toast.info('Payment cancelled');
          } else if (status === 'failed') {
            await supabase
              .from('stars_payments')
              .update({ status: 'failed' })
              .eq('id', paymentRecord.id);
            toast.error('Payment failed');
          }
        });
      } else {
        toast.error('Stars payment not supported');
      }
    } catch (error) {
      console.error('Stars payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setStarsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[340px] p-0 gap-0 bg-card border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold text-foreground">
              Choose Payment
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Product Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
            <span className="text-sm text-muted-foreground">{description}</span>
            <span className="text-sm font-semibold text-foreground">{amount} TON</span>
          </div>

          {/* Wallet Warning */}
          {!isWalletConnected && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
              <p className="text-xs text-yellow-600">
                Connect wallet in{' '}
                <button 
                  onClick={() => { onClose(); navigate('/wallet'); }}
                  className="underline font-medium"
                >
                  Wallet page
                </button>
                {' '}for TON payment
              </p>
            </div>
          )}

          {/* Payment Options */}
          <div className="space-y-2">
            {/* TON Payment */}
            <button
              onClick={handleTonPayment}
              disabled={isProcessing || !isWalletConnected}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0098EA] flex items-center justify-center">
                  <TonIcon size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">TON Wallet</p>
                  <p className="text-xs text-muted-foreground">Pay with crypto</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-sm font-semibold text-foreground">{amount} TON</span>
                )}
              </div>
            </button>

            {/* Stars Payment */}
            <button
              onClick={handleStarsPayment}
              disabled={starsLoading}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Star className="w-5 h-5 fill-white text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Telegram Stars</p>
                  <p className="text-xs text-muted-foreground">Fast & easy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {starsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <span className="text-sm font-semibold text-yellow-600">{starsAmount} ⭐</span>
                )}
              </div>
            </button>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-center text-muted-foreground">
            Secure payment • Instant delivery
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
