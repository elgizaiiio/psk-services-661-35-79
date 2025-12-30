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
      <DialogContent className="max-w-[320px] p-5 gap-0 bg-card border-border rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-lg font-bold text-foreground">
            {description}
          </DialogTitle>
          <p className="text-center text-2xl font-bold text-primary mt-1">{amount} TON</p>
        </DialogHeader>

        <div className="space-y-3">
          {/* TON Payment */}
          <button
            onClick={handleTonPayment}
            disabled={isProcessing || !isWalletConnected}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <span className="font-medium text-foreground">TON Wallet</span>
            <span className="font-bold text-foreground">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `${amount} TON`}
            </span>
          </button>

          {/* Stars Payment */}
          <button
            onClick={handleStarsPayment}
            disabled={starsLoading}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
          >
            <span className="font-medium text-foreground">Telegram Stars</span>
            <span className="font-bold text-yellow-500">
              {starsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${starsAmount} ⭐`}
            </span>
          </button>

          {!isWalletConnected && (
            <p className="text-xs text-center text-muted-foreground">
              <button onClick={() => { onClose(); navigate('/wallet'); }} className="text-primary underline">
                Connect wallet
              </button>{' '}for TON payment
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
