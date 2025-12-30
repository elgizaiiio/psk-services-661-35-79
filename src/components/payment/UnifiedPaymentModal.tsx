import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, Copy, Check } from 'lucide-react';
import { useUnifiedPayment, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toast } from 'sonner';

interface UnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase';
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
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
    destinationAddress,
  } = useUnifiedPayment();

  const [tonConnectUI] = useTonConnectUI();
  const [copied, setCopied] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to open wallet connection');
    }
  };

  const handlePayment = async () => {
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

  const handleCopyAddress = async () => {
    if (destinationAddress) {
      await navigator.clipboard.writeText(destinationAddress);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            الدفع بـ TON
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">{description}</p>
            <p className="text-3xl font-bold text-primary">{amount} TON</p>
            {credits && (
              <Badge variant="secondary" className="mt-2">
                +{credits} نقطة
              </Badge>
            )}
          </div>

          {/* Payment Method */}
          <Card className="p-4 bg-secondary/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💎</span>
              <div>
                <p className="font-semibold">TON Connect</p>
                <p className="text-xs text-muted-foreground">ادفع باستخدام محفظة TON</p>
              </div>
            </div>

            {/* Wallet Status */}
            {isWalletConnected ? (
              <div className="flex items-center gap-2 text-green-500 mb-3">
                <Check className="w-4 h-4" />
                <span className="text-sm">المحفظة متصلة</span>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleConnectWallet}
                className="w-full mb-3"
              >
                <span className="mr-2">💎</span>
                ربط محفظة TON
              </Button>
            )}

            {/* Destination Address */}
            {destinationAddress && (
              <div className="p-2 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">عنوان الاستلام:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs flex-1 truncate">{destinationAddress}</code>
                  <Button size="sm" variant="ghost" onClick={handleCopyAddress}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Confirm Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isProcessing || !isWalletConnected}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                جاري المعالجة...
              </>
            ) : !isWalletConnected ? (
              'يرجى ربط المحفظة أولاً'
            ) : (
              <>
                💎 تأكيد الدفع - {amount} TON
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            سيتم تأكيد الدفع تلقائياً بعد إتمام المعاملة
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
