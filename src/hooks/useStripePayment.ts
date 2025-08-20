import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentData {
  amount: number;
  currency?: string;
  productName: string;
  productDescription: string;
  serverId: string;
}

interface PaymentResult {
  sessionId: string;
  url: string;
  success: boolean;
}

export const useStripePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createPayment = async (paymentData: PaymentData): Promise<PaymentResult | null> => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-payment', {
        body: {
          amount: paymentData.amount,
          currency: paymentData.currency || 'usd',
          productName: paymentData.productName,
          productDescription: paymentData.productDescription,
          serverId: paymentData.serverId,
        },
      });

      if (error) {
        console.error('Payment creation error:', error);
        toast.error('Failed to create payment');
        return null;
      }

      if (data?.success && data?.url) {
        return {
          sessionId: data.sessionId,
          url: data.url,
          success: true
        };
      }

      toast.error('Failed to create payment');
      return null;

    } catch (error) {
      console.error('Payment error:', error);
      toast.error('An error occurred during payment');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-stripe-payment', {
        body: { sessionId },
      });

      if (error) {
        console.error('Payment verification error:', error);
        return { success: false };
      }

      return data;
    } catch (error) {
      console.error('Payment verification error:', error);
      return { success: false };
    }
  };

  return {
    createPayment,
    verifyPayment,
    isProcessing,
  };
};