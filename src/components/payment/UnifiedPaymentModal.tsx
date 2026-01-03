import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useUnifiedPayment, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { supabase } from '@/integrations/supabase/client';
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
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
    calculateUsdFromTon,
    tonPrice,
  } = useUnifiedPayment();

  const usdAmount = calculateUsdFromTon(amount);

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

    const success = await processPayment(paymentParams);
    
    if (success) {
      await notifyAdminPayment('ton', amount, 'TON');
      onSuccess?.();
      onClose();
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
            <p className="text-xs text-muted-foreground mt-0.5">≈ ${usdAmount.toFixed(2)} USD</p>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {/* TON Payment */}
          <button
            onClick={handleTonPayment}
            disabled={isProcessing || !isWalletConnected}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <div className="flex flex-col items-start">
              <span className="font-medium text-foreground">TON Wallet</span>
              <span className="text-[10px] text-muted-foreground">~${usdAmount.toFixed(2)}</span>
            </div>
            <span className="font-bold text-foreground">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : `${amount} TON`}
            </span>
          </button>

          {!isWalletConnected && (
            <p className="text-xs text-center text-muted-foreground">
              <button onClick={() => { onClose(); navigate('/wallet'); }} className="text-primary underline">
                Connect wallet
              </button>{' '}for TON payment
            </p>
          )}

          {/* Price info */}
          <p className="text-[10px] text-center text-muted-foreground pt-2">
            1 TON ≈ ${tonPrice.toFixed(2)}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
