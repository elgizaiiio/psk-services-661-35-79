import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Wallet, Copy, Check, Star } from 'lucide-react';
import { useUnifiedPayment, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
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

// Stars price: approximately $0.02 per star
const TON_TO_USD = 6; // Approximate TON price in USD
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
  const {
    isProcessing,
    processPayment,
    isWalletConnected,
    destinationAddress,
  } = useUnifiedPayment();

  const [tonConnectUI] = useTonConnectUI();
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'ton' | 'stars'>('ton');
  const [starsLoading, setStarsLoading] = useState(false);
  const { webApp } = useTelegramAuth();

  // Calculate stars amount from TON
  const tonInUsd = amount * TON_TO_USD;
  const starsAmount = Math.ceil(tonInUsd / STAR_PRICE_USD);

  const handleConnectWallet = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to open wallet connection');
    }
  };

  const handleTonPayment = async () => {
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
      // Create invoice payload
      const payload = JSON.stringify({
        type: productType,
        productId,
        credits,
        amount,
      });

      // Use Telegram's openInvoice method if available
      if ('openInvoice' in webApp) {
        // For now, show info that Stars payment will be available
        toast.info('Stars payment coming soon!');
        
        // In production, you would call your backend to create a Stars invoice
        // and then use webApp.openInvoice(invoiceUrl)
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
            Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">{description}</p>
            <p className="text-3xl font-bold text-primary">{amount} TON</p>
            <p className="text-xs text-muted-foreground mt-1">≈ ${tonInUsd.toFixed(2)} USD</p>
            {credits && (
              <Badge variant="secondary" className="mt-2">
                +{credits} Credits
              </Badge>
            )}
          </div>

          {/* Payment Method Tabs */}
          <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'ton' | 'stars')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ton" className="gap-2">
                <span>💎</span> TON
              </TabsTrigger>
              <TabsTrigger value="stars" className="gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> Stars
              </TabsTrigger>
            </TabsList>

            {/* TON Payment */}
            <TabsContent value="ton" className="space-y-4 mt-4">
              <Card className="p-4 bg-secondary/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">💎</span>
                  <div>
                    <p className="font-semibold">TON Connect</p>
                    <p className="text-xs text-muted-foreground">Pay with TON wallet</p>
                  </div>
                </div>

                {isWalletConnected ? (
                  <div className="flex items-center gap-2 text-green-500 mb-3">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Wallet connected</span>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleConnectWallet}
                    className="w-full mb-3"
                  >
                    <span className="mr-2">💎</span>
                    Connect TON Wallet
                  </Button>
                )}

                {destinationAddress && (
                  <div className="p-2 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Destination:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs flex-1 truncate">{destinationAddress}</code>
                      <Button size="sm" variant="ghost" onClick={handleCopyAddress}>
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              <Button
                className="w-full"
                size="lg"
                onClick={handleTonPayment}
                disabled={isProcessing || !isWalletConnected}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !isWalletConnected ? (
                  'Connect wallet first'
                ) : (
                  <>
                    💎 Pay {amount} TON
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Stars Payment */}
            <TabsContent value="stars" className="space-y-4 mt-4">
              <Card className="p-4 bg-secondary/30">
                <div className="flex items-center gap-3 mb-4">
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  <div>
                    <p className="font-semibold">Telegram Stars</p>
                    <p className="text-xs text-muted-foreground">Pay with Telegram Stars</p>
                  </div>
                </div>

                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-yellow-500">{starsAmount}</p>
                  <p className="text-sm text-muted-foreground">Stars</p>
                </div>

                <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
                    1 Star ≈ $0.02 USD
                  </p>
                </div>
              </Card>

              <Button
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
                size="lg"
                onClick={handleStarsPayment}
                disabled={starsLoading}
              >
                {starsLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2 fill-white" />
                    Pay {starsAmount} Stars
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground">
            Payment will be confirmed automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
