import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ChevronRight, Wallet, ExternalLink } from 'lucide-react';
import { useUnifiedPayment, PaymentMethod, UnifiedPaymentParams } from '@/hooks/useUnifiedPayment';
import { cn } from '@/lib/utils';

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
    selectedMethod,
    setSelectedMethod,
    selectedCurrency,
    setSelectedCurrency,
    paymentMethods,
    isProcessing,
    processPayment,
    metaMaskWallet,
  } = useUnifiedPayment();

  const [step, setStep] = useState<'select' | 'currency' | 'confirm'>('select');

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    const methodInfo = paymentMethods.find(m => m.id === method);
    
    if (methodInfo?.currencies && methodInfo.currencies.length > 1) {
      setStep('currency');
    } else {
      if (methodInfo?.currencies?.[0]) {
        setSelectedCurrency(methodInfo.currencies[0]);
      }
      setStep('confirm');
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setSelectedCurrency(currency);
    setStep('confirm');
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

  const handleBack = () => {
    if (step === 'currency') {
      setStep('select');
    } else if (step === 'confirm') {
      const methodInfo = paymentMethods.find(m => m.id === selectedMethod);
      if (methodInfo?.currencies && methodInfo.currencies.length > 1) {
        setStep('currency');
      } else {
        setStep('select');
      }
    }
  };

  const selectedMethodInfo = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Select Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount Display */}
          <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">{description}</p>
            <p className="text-3xl font-bold text-primary">${amount}</p>
          </div>

          {/* Step: Select Payment Method */}
          {step === 'select' && (
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={cn(
                    'p-4 cursor-pointer transition-all hover:border-primary/50',
                    !method.available && 'opacity-50 cursor-not-allowed',
                    selectedMethod === method.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => method.available && handleMethodSelect(method.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{method.icon}</span>
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {method.currencies && (
                        <div className="flex gap-1">
                          {method.currencies.slice(0, 3).map((curr) => (
                            <Badge key={curr} variant="secondary" className="text-xs">
                              {curr}
                            </Badge>
                          ))}
                          {method.currencies.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{method.currencies.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Step: Select Currency */}
          {step === 'currency' && selectedMethodInfo?.currencies && (
            <div className="space-y-2">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Back
              </Button>
              <p className="text-sm text-muted-foreground mb-3">Select Currency:</p>
              <div className="grid grid-cols-3 gap-2">
                {selectedMethodInfo.currencies.map((currency) => (
                  <Card
                    key={currency}
                    className={cn(
                      'p-3 cursor-pointer text-center transition-all hover:border-primary/50',
                      selectedCurrency === currency && 'border-primary bg-primary/5'
                    )}
                    onClick={() => handleCurrencySelect(currency)}
                  >
                    <p className="font-bold">{currency}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step: Confirm Payment */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2">
                ← Back
              </Button>

              <Card className="p-4 bg-secondary/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{selectedMethodInfo?.icon}</span>
                  <div>
                    <p className="font-semibold">{selectedMethodInfo?.name}</p>
                    <Badge variant="outline">{selectedCurrency}</Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold">${amount}</span>
                  </div>
                  {credits && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credits:</span>
                      <span className="font-bold">{credits} points</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* MetaMask Connection Status */}
              {selectedMethod === 'metamask' && (
                <div className="p-3 bg-secondary/30 rounded-lg">
                  {metaMaskWallet.isConnected ? (
                    <div className="flex items-center gap-2 text-green-500">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">
                        Connected: {metaMaskWallet.address?.slice(0, 8)}...{metaMaskWallet.address?.slice(-6)}
                      </span>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={metaMaskWallet.connect}
                      className="w-full"
                    >
                      <span className="mr-2">🦊</span>
                      Connect MetaMask
                    </Button>
                  )}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing || (selectedMethod === 'metamask' && !metaMaskWallet.isConnected)}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedMethod === 'nowpayments' && <ExternalLink className="w-4 h-4 mr-2" />}
                    Confirm Payment
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
