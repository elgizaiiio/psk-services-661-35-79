import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Star } from 'lucide-react';
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

// 100 Stars = 1 TON
const STARS_PER_TON = 100;

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
  const { user: tgUser } = useTelegramAuth();
  const { user } = useViralMining(tgUser);
  const [starsProcessing, setStarsProcessing] = useState(false);
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
  } = useUnifiedPayment();

  const starsAmount = Math.ceil(amount * STARS_PER_TON);

  const notifyAdminPayment = async (paymentMethod: string, paymentAmount: number, currency: string) => {
    try {
      await supabase.functions.invoke('notify-admin-payment', {
        body: {
          userId: user?.id,
          username: tgUser?.username || tgUser?.first_name || 'Unknown',
          telegramId: tgUser?.id,
          paymentMethod,
          amount: paymentAmount,
          currency,
          productType,
          productName: description,
          description: `Purchase ${description}`,
        }
      });
    } catch (e) {
      console.error('Failed to notify admin:', e);
    }
  };

  const handleTonPayment = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    const paymentParams: UnifiedPaymentParams = {
      amount,
      description,
      productType,
      productId,
      credits,
    };

    const result = await processPayment(paymentParams);
    
    if (result) {
      await notifyAdminPayment('ton', amount, 'TON');
      onSuccess?.();
      onClose();
    }
  };

  const handleStarsPayment = async () => {
    if (!user?.id || !tgUser?.id) {
      toast.error('User not found');
      return;
    }

    setStarsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stars-invoice', {
        body: {
          amountTon: amount,
          description,
          productType,
          productId,
          userId: user.id,
          telegramId: tgUser.id,
        },
      });

      if (error || !data?.invoiceUrl) {
        throw new Error(error?.message || 'Failed to create invoice');
      }

      // Open the invoice URL in Telegram
      const tg = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) {
        tg.openInvoice(data.invoiceUrl, async (status: string) => {
          if (status === 'paid') {
            toast.success('Payment successful! 🎉');
            await notifyAdminPayment('stars', starsAmount, 'Stars');
            onSuccess?.();
            onClose();
          } else if (status === 'cancelled') {
            toast.info('Payment cancelled');
          } else if (status === 'failed') {
            toast.error('Payment failed');
          }
          setStarsProcessing(false);
        });
      } else {
        // Fallback: open in browser
        window.open(data.invoiceUrl, '_blank');
        toast.info('Complete payment in Telegram');
        setStarsProcessing(false);
      }
    } catch (err: any) {
      console.error('Stars payment error:', err);
      toast.error('Failed to create Stars invoice');
      setStarsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] p-5 gap-0 bg-card border-border rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-lg font-bold text-foreground">
            {description}
          </DialogTitle>
          <div className="text-center mt-1">
            <p className="text-2xl font-bold text-primary">{amount} TON</p>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* TON Payment */}
          <button
            onClick={handleTonPayment}
            disabled={isProcessing || starsProcessing || !isWalletConnected}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <TonIcon size={20} />
              <span className="font-medium text-foreground">TON Wallet</span>
            </div>
            <span className="font-bold text-foreground">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `${amount} TON`}
            </span>
          </button>

          {/* Stars Payment */}
          <button
            onClick={handleStarsPayment}
            disabled={isProcessing || starsProcessing}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-medium text-foreground">Telegram Stars</span>
            </div>
            <span className="font-bold text-foreground">
              {starsProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `${starsAmount} ⭐`}
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
