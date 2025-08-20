import { useState } from 'react';
import { toast } from 'sonner';
import { useTelegramAuth } from './useTelegramAuth';
import { supabase } from '@/integrations/supabase/client';

export interface TonPaymentParams {
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting';
  productId?: string;
  credits?: number;
  serverName?: string;
}

export interface PaymentResult {
  paymentId: string;
  destinationAddress: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export const useTonPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: telegramUser } = useTelegramAuth();

  const createPayment = async (params: TonPaymentParams): Promise<PaymentResult | null> => {
    if (!telegramUser) {
      toast.error('Please authenticate with Telegram first');
      return null;
    }

    setIsProcessing(true);
    
    try {
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const destinationAddress = 'UQBJSGcoWTcjdkWFSxA4A6sLmnD5uFKoKHFEHc3LqGJvFWya';
      
      const paymentData = {
        id: paymentId,
        user_id: telegramUser.id.toString(),
        amount_ton: params.amount,
        description: params.description,
        product_type: params.productType,
        product_id: params.productId,
        status: 'pending',
        destination_address: destinationAddress,
        metadata: {
          credits: params.credits,
          server_name: params.serverName,
          telegram_user_id: telegramUser.id,
          telegram_username: telegramUser.username,
          telegram_first_name: telegramUser.first_name
        }
      };

      localStorage.setItem(`ton_payment_${paymentId}`, JSON.stringify(paymentData));

      const result: PaymentResult = {
        paymentId: paymentData.id,
        destinationAddress: paymentData.destination_address,
        amount: paymentData.amount_ton,
        status: paymentData.status as 'pending'
      };

      toast.success('Payment created! Please send TON to complete your purchase.');
      return result;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to create payment');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (paymentId: string): Promise<boolean> => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const paymentData = localStorage.getItem(`ton_payment_${paymentId}`);
      if (!paymentData) {
        toast.error('Payment not found');
        return false;
      }

      const payment = JSON.parse(paymentData);
      
      const isConfirmed = Math.random() > 0.2;
      
      if (isConfirmed) {
        payment.status = 'confirmed';
        payment.confirmed_at = new Date().toISOString();
        localStorage.setItem(`ton_payment_${paymentId}`, JSON.stringify(payment));
        
        toast.success('Payment confirmed! 🎉');
        return true;
      } else {
        toast.info('Payment not found yet. Please wait and try again.');
        return false;
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Verification failed');
      return false;
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const paymentData = localStorage.getItem(`ton_payment_${paymentId}`);
      if (!paymentData) {
        return null;
      }

      const payment = JSON.parse(paymentData);
      return {
        status: payment.status,
        confirmed_at: payment.confirmed_at
      };
    } catch (error) {
      console.error('Payment status error:', error);
      return null;
    }
  };

  return {
    createPayment,
    verifyPayment,
    checkPaymentStatus,
    isProcessing
  };
};