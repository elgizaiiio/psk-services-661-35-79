import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useDirectTonPayment } from './useDirectTonPayment';

export type PaymentMethod = 'ton_connect' | 'stars';

export type ProductType = 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase';

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

// Stars price configuration
export const STAR_PRICE_USD = 0.02;
export const TON_TO_USD = 6; // Approximate

export const calculateStarsFromTon = (tonAmount: number): number => {
  const usdAmount = tonAmount * TON_TO_USD;
  return Math.ceil(usdAmount / STAR_PRICE_USD);
};

export const useUnifiedPayment = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>('ton_connect');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('TON');

  const directTonPayment = useDirectTonPayment();

  const isProcessing = directTonPayment.isProcessing;

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
  };
};
