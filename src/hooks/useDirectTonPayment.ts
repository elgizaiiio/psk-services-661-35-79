import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { useAiUsageLimit } from './useAiUsageLimit';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';
import { logger } from '@/lib/logger';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

export interface DirectPaymentParams {
  amount: number;
  description: string;
  productType:
    | 'ai_credits'
    | 'game_powerup'
    | 'subscription'
    | 'server_hosting'
    | 'mining_upgrade'
    | 'token_purchase'
    | 'spin_tickets';
  productId?: string;
  credits?: number;
  serverName?: string;
  upgradeType?: 'power' | 'duration';
  userId?: string | null;
}

export type DirectPaymentStatus = 'pending' | 'confirmed' | 'failed';

export interface DirectPaymentResult {
  ok: boolean;
  status: DirectPaymentStatus;
  paymentId?: string;
}

export const useDirectTonPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { addCredits, activateSubscription } = useAiUsageLimit();
  const { user: telegramUser } = useTelegramAuth();

  const sendDirectPayment = async (params: DirectPaymentParams): Promise<DirectPaymentResult> => {
    if (!wallet?.account) {
      toast.error('Please connect your TON wallet first');
      return { ok: false, status: 'failed' };
    }

    setIsProcessing(true);

    try {
      // Get the bolt_users id using telegram_id
      let boltUserId: string | null = null;

      if (telegramUser?.id) {
        const { data: boltUser } = await supabase
          .from('bolt_users')
          .select('id')
          .eq('telegram_id', telegramUser.id)
          .maybeSingle();

        if (boltUser) {
          boltUserId = boltUser.id;
        }
      }

      // Use bolt_users.id if available, otherwise use wallet address
      const userId = boltUserId || params.userId || wallet.account.address.slice(0, 32);

      const amountNano = tonToNano(params.amount);

      if (params.amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      // Create payment record in database first
      const { data: paymentData, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: userId,
          amount_ton: params.amount,
          description: params.description,
          product_type: params.productType,
          product_id: params.productId,
          destination_address: TON_PAYMENT_ADDRESS,
          wallet_address: wallet.account.address,
          payment_method: 'ton',
          payment_currency: 'TON',
          status: 'pending',
          metadata: {
            credits: params.credits,
            server_name: params.serverName,
            upgrade_type: params.upgradeType,
            bolt_user_id: boltUserId,
          },
        })
        .select()
        .single();

      if (paymentError || !paymentData) {
        logger.error('Payment record error', paymentError);
        toast.error('فشل إنشاء الدفع');
        return { ok: false, status: 'failed' };
      }

      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: amountNano,
          },
        ],
      };

      logger.debug('Sending TON transaction', { amount: params.amount });

      const result = await tonConnectUI.sendTransaction(transaction);

      if (!result) {
        throw new Error('Transaction failed - no result returned');
      }

      logger.info('Transaction sent', { boc: result.boc?.slice(0, 20) + '...' });

      // Store the BOC in tx_hash temporarily (will be replaced with real chain tx hash upon verification)
      await supabase
        .from('ton_payments')
        .update({
          status: 'pending',
          tx_hash: result.boc,
          metadata: {
            ...(paymentData.metadata || {}),
            boc_submitted: true,
            submitted_at: new Date().toISOString(),
            wallet_address: wallet.account.address,
          },
        })
        .eq('id', paymentData.id);

      toast.info('تم إرسال التحويل... جاري التأكيد على الشبكة');

      // Poll for confirmation (up to ~2 minutes)
      let confirmed = false;
      for (let attempt = 0; attempt < 12; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 10_000));

        const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
          body: { paymentId: paymentData.id },
        });

        if (!verifyResult.error && verifyResult.data?.ok && (verifyResult.data?.status === 'confirmed' || verifyResult.data?.status === 'already_confirmed')) {
          confirmed = true;
          break;
        }
      }

      if (confirmed) {
        // Handle credits or subscription ONLY after confirmation
        if (params.productType === 'ai_credits' && params.credits) {
          addCredits(params.credits);
        } else if (params.productType === 'subscription') {
          activateSubscription();
        }

        // Notify admin about the confirmed payment
        try {
          await supabase.functions.invoke('notify-admin-payment', {
            body: {
              userId: userId,
              username: telegramUser?.username || telegramUser?.first_name || 'Unknown',
              telegramId: telegramUser?.id,
              paymentMethod: 'ton',
              amount: params.amount,
              currency: 'TON',
              productType: params.productType,
              productName: params.description,
              description: params.description,
            },
          });
        } catch (notifyError) {
          console.error('Failed to notify admin:', notifyError);
          logger.error('Failed to notify admin', notifyError);
        }

        toast.success('تم تأكيد الدفع بنجاح');
        return { ok: true, status: 'confirmed', paymentId: paymentData.id };
      }

      toast.warning('تم إرسال التحويل، لكن لم يتم تأكيده بعد. قد يستغرق ذلك عدة دقائق.');
      return { ok: true, status: 'pending', paymentId: paymentData.id };

    } catch (error: any) {
      logger.error('Payment error', error);

      if (error.message?.includes('User declined') || error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Insufficient funds')) {
        toast.error('Insufficient wallet balance');
      } else {
        toast.error('Payment failed. Check wallet connection and try again.');
      }
      return { ok: false, status: 'failed' };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendDirectPayment,
    isProcessing,
    isWalletConnected: !!wallet?.account,
    destinationAddress: TON_PAYMENT_ADDRESS,
  };
};

