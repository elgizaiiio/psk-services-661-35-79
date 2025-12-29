import { useState } from 'react';
import { toast } from 'sonner';
import { useTelegramAuth } from './useTelegramAuth';
import { supabase } from '@/integrations/supabase/client';

export interface TonPaymentParams {
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase';
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

// Wallet address for receiving TON payments
const TON_DESTINATION_ADDRESS = 'UQB3zld6sleav5U7Rga1JmpHJccaczHzCuTRNK4QM5i001Vm';

export const useTonPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: telegramUser } = useTelegramAuth();

  const createPayment = async (params: TonPaymentParams): Promise<PaymentResult | null> => {
    const telegramId = telegramUser?.id || 123456789; // Dev fallback

    setIsProcessing(true);
    
    try {
      // Create payment record in Supabase
      const { data: paymentData, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: telegramId.toString(),
          amount_ton: params.amount,
          description: params.description,
          product_type: params.productType,
          product_id: params.productId,
          status: 'pending',
          destination_address: TON_DESTINATION_ADDRESS,
          payment_method: 'ton',
          payment_currency: 'TON',
          metadata: {
            credits: params.credits,
            server_name: params.serverName,
            telegram_user_id: telegramId,
            telegram_username: telegramUser?.username,
            telegram_first_name: telegramUser?.first_name
          }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment creation error:', paymentError);
        toast.error('فشل إنشاء الدفع');
        return null;
      }

      const result: PaymentResult = {
        paymentId: paymentData.id,
        destinationAddress: TON_DESTINATION_ADDRESS,
        amount: params.amount,
        status: 'pending'
      };

      toast.success('تم إنشاء الدفع! أرسل TON لإكمال عملية الشراء.');
      return result;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('فشل إنشاء الدفع');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (paymentId: string): Promise<boolean> => {
    try {
      const { data: payment, error } = await supabase
        .from('ton_payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (error || !payment) {
        toast.error('لم يتم العثور على الدفع');
        return false;
      }

      if (payment.status === 'confirmed') {
        toast.success('تم تأكيد الدفع! 🎉');
        return true;
      } else {
        toast.info('الدفع قيد الانتظار. يرجى المحاولة مرة أخرى.');
        return false;
      }
      
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('فشل التحقق');
      return false;
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const { data: payment, error } = await supabase
        .from('ton_payments')
        .select('status, confirmed_at')
        .eq('id', paymentId)
        .single();

      if (error) {
        console.error('Payment status error:', error);
        return null;
      }

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
    isProcessing,
    destinationAddress: TON_DESTINATION_ADDRESS
  };
};