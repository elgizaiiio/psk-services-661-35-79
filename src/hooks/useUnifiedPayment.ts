import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTonPayment } from './useTonPayment';
import { useDirectTonPayment } from './useDirectTonPayment';
import { useMetaMaskPayment } from './useMetaMaskPayment';
import { useNowPayments } from './useNowPayments';

export type PaymentMethod = 'ton_connect' | 'ton_manual' | 'metamask' | 'nowpayments';

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

export const useUnifiedPayment = () => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('TON');

  const tonPayment = useTonPayment();
  const directTonPayment = useDirectTonPayment();
  const metaMaskPayment = useMetaMaskPayment();
  const nowPayments = useNowPayments();

  const isProcessing = 
    tonPayment.isProcessing || 
    directTonPayment.isProcessing || 
    metaMaskPayment.isProcessing || 
    nowPayments.isProcessing;

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
      id: 'metamask',
      name: 'MetaMask',
      nameAr: 'MetaMask',
      icon: '🦊',
      description: 'Pay with MetaMask (ETH)',
      descriptionAr: 'ادفع بـ MetaMask (ETH)',
      available: metaMaskPayment.isMetaMaskAvailable,
      currencies: ['ETH'],
    },
    {
      id: 'nowpayments',
      name: 'Crypto (NOWPayments)',
      nameAr: 'كريبتو (NOWPayments)',
      icon: '🪙',
      description: 'Pay with BTC, ETH, USDT, and more',
      descriptionAr: 'ادفع بـ BTC، ETH، USDT والمزيد',
      available: true,
      currencies: ['BTC', 'ETH', 'USDT', 'LTC', 'DOGE', 'TRX', 'SOL'],
    },
    {
      id: 'ton_manual',
      name: 'Manual TON Transfer',
      nameAr: 'تحويل TON يدوي',
      icon: '📤',
      description: 'Copy address and send manually',
      descriptionAr: 'انسخ العنوان وأرسل يدوياً',
      available: true,
      currencies: ['TON'],
    },
  ];

  const processPayment = useCallback(async (params: UnifiedPaymentParams): Promise<boolean> => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return false;
    }

    try {
      switch (selectedMethod) {
        case 'ton_connect': {
          return await directTonPayment.sendDirectPayment({
            amount: params.amount,
            description: params.description,
            productType: params.productType,
            productId: params.productId,
            credits: params.credits,
          });
        }

        case 'ton_manual': {
          const result = await tonPayment.createPayment({
            amount: params.amount,
            description: params.description,
            productType: params.productType,
            productId: params.productId,
            credits: params.credits,
            serverName: params.serverName,
          });
          return result !== null;
        }

        case 'metamask': {
          // Convert USD to ETH (rough estimate - you should use a price API)
          const ethAmount = params.amount / 3500;
          return await metaMaskPayment.sendPayment({
            amount: ethAmount,
            description: params.description,
            productType: params.productType,
            productId: params.productId,
            credits: params.credits,
          });
        }

        case 'nowpayments': {
          const result = await nowPayments.createPayment({
            amount: params.amount,
            currency: selectedCurrency as 'BTC' | 'ETH' | 'USDT' | 'LTC' | 'DOGE' | 'TRX' | 'SOL',
            description: params.description,
            productType: params.productType,
            productId: params.productId,
            credits: params.credits,
          });
          return result.success;
        }

        default:
          toast.error('Unknown payment method');
          return false;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed');
      return false;
    }
  }, [selectedMethod, selectedCurrency, tonPayment, directTonPayment, metaMaskPayment, nowPayments]);

  return {
    selectedMethod,
    setSelectedMethod,
    selectedCurrency,
    setSelectedCurrency,
    paymentMethods,
    isProcessing,
    processPayment,
    metaMaskWallet: {
      isConnected: metaMaskPayment.isConnected,
      address: metaMaskPayment.walletAddress,
      connect: metaMaskPayment.connectWallet,
      disconnect: metaMaskPayment.disconnectWallet,
    },
  };
};
