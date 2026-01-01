import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDirectTonPayment } from './useDirectTonPayment';
import { usePriceCalculator, STAR_PRICE_USD } from './usePriceCalculator';

export type PaymentMethod = 'ton_connect' | 'stars';

export type ProductType = 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase' | 'spin_tickets';

export interface UnifiedPaymentParams {
  amount: number;
  description: string;
  productType: ProductType;
  productId?: string;
  credits?: number;
  serverName?: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  nameAr: string;
  icon: string;
  description: string;
  descriptionAr: string;
  available: boolean;
  currencies?: string[];
}

// Re-export for backwards compatibility
export { STAR_PRICE_USD };

export const useUnifiedPayment = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('ton_connect');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('TON');

  const directTonPayment = useDirectTonPayment();
  const { tonPrice, tonToStars, tonToUsd } = usePriceCalculator();

  const isProcessing = directTonPayment.isProcessing;

  // Dynamic Stars calculation using real TON price
  const calculateStarsFromTon = useCallback(
    (tonAmount: number): number => {
      return tonToStars(tonAmount);
    },
    [tonToStars]
  );

  // Get USD value for TON amount
  const calculateUsdFromTon = useCallback(
    (tonAmount: number): number => {
      return tonToUsd(tonAmount);
    },
    [tonToUsd]
  );

  const paymentMethods: PaymentMethodInfo[] = [
    {
      id: 'ton_connect',
      name: 'TON Connect',
      nameAr: 'TON Connect',
      icon: '💎',
      description: 'Pay with TON wallet (Tonkeeper, etc.)',
      descriptionAr: 'ادفع بمحفظة TON (Tonkeeper، إلخ)',
      available: true,
      currencies: ['TON'],
    },
    {
      id: 'stars',
      name: 'Telegram Stars',
      nameAr: 'نجوم تليجرام',
      icon: '⭐',
      description: 'Pay with Telegram Stars',
      descriptionAr: 'ادفع بنجوم تليجرام',
      available: true,
      currencies: ['STARS'],
    },
  ];

  const processPayment = useCallback(async (params: UnifiedPaymentParams): Promise<boolean> => {
    try {
      return await directTonPayment.sendDirectPayment({
        amount: params.amount,
        description: params.description,
        productType: params.productType,
        productId: params.productId,
        credits: params.credits,
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
      return false;
    }
  }, [directTonPayment]);

  return {
    selectedMethod,
    setSelectedMethod,
    selectedCurrency,
    setSelectedCurrency,
    paymentMethods,
    isProcessing,
    processPayment,
    isWalletConnected: directTonPayment.isWalletConnected,
    destinationAddress: directTonPayment.destinationAddress,
    calculateStarsFromTon,
    calculateUsdFromTon,
    tonPrice,
  };
};
