
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'confirmed' | 'failed';
  amount_ton: number;
  tx_hash?: string;
  created_at: string;
  confirmed_at?: string;
}

export const useTonPaymentStatus = () => {
  const [payments, setPayments] = useState<PaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const verifyPayment = async (paymentId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('verify-ton-payment', {
        body: { paymentId }
      });

      if (error) {
        console.error('Payment verification error:', error);
        return false;
      }

      if (data?.ok && data?.status === 'confirmed') {
        // تحديث حالة الدفع محلياً
        setPayments(prev => prev.map(p => 
          p.id === paymentId 
            ? { ...p, status: 'confirmed', confirmed_at: new Date().toISOString() }
            : p
        ));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addPayment = (payment: PaymentStatus) => {
    setPayments(prev => [payment, ...prev]);
  };

  const getRecentPayments = () => {
    return payments.slice(0, 10); // آخر 10 معاملات
  };

  return {
    payments,
    loading,
    verifyPayment,
    addPayment,
    getRecentPayments
  };
};
