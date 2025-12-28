import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTelegramAuth } from './useTelegramAuth';
import { supabase } from '@/integrations/supabase/client';

export interface NowPaymentsParams {
  amount: number; // Amount in USD
  currency: 'BTC' | 'ETH' | 'USDT' | 'LTC' | 'DOGE' | 'TRX' | 'SOL';
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting';
  productId?: string;
  credits?: number;
}

export interface NowPaymentsResult {
  success: boolean;
  invoiceUrl?: string;
  invoiceId?: string;
  payAddress?: string;
  payAmount?: number;
  payCurrency?: string;
}

export const useNowPayments = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user: telegramUser } = useTelegramAuth();

  const createPayment = useCallback(async (params: NowPaymentsParams): Promise<NowPaymentsResult> => {
    if (!telegramUser) {
      toast.error('يرجى تسجيل الدخول عبر Telegram أولاً');
      return { success: false };
    }

    setIsProcessing(true);

    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase.functions.invoke('nowpayments-create', {
        body: {
          amount: params.amount,
          currency: params.currency,
          description: params.description,
          productType: params.productType,
          productId: params.productId,
          orderId,
        },
        headers: {
          'x-telegram-id': telegramUser.id.toString(),
        },
      });

      if (error) {
        console.error('NOWPayments error:', error);
        toast.error('فشل إنشاء الدفع');
        return { success: false };
      }

      if (data?.invoiceUrl) {
        toast.success('تم إنشاء الفاتورة بنجاح');
        
        // Open invoice URL in new tab
        window.open(data.invoiceUrl, '_blank');
        
        return {
          success: true,
          invoiceUrl: data.invoiceUrl,
          invoiceId: data.invoiceId,
          payAddress: data.payAddress,
          payAmount: data.payAmount,
          payCurrency: data.payCurrency,
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('حدث خطأ أثناء إنشاء الدفع');
      return { success: false };
    } finally {
      setIsProcessing(false);
    }
  }, [telegramUser]);

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const { data, error } = await supabase
        .from('ton_payments')
        .select('status, confirmed_at, metadata')
        .eq('nowpayments_id', paymentId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }, []);

  return {
    isProcessing,
    createPayment,
    checkPaymentStatus,
  };
};
