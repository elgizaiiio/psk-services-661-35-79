import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { useAiUsageLimit } from './useAiUsageLimit';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from './useTelegramAuth';

export interface DirectPaymentParams {
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase';
  productId?: string;
  credits?: number;
  serverName?: string;
  upgradeType?: 'power' | 'duration';
  userId?: string | null;
}

// Wallet address for receiving TON payments
const TON_DESTINATION_ADDRESS = 'UQB3zld6sleav5U7Rga1JmpHJccaczHzCuTRNK4QM5i001Vm';

export const useDirectTonPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { addCredits, activateSubscription } = useAiUsageLimit();
  const { user: telegramUser } = useTelegramAuth();

  const sendDirectPayment = async (params: DirectPaymentParams): Promise<boolean> => {
    if (!wallet?.account) {
      toast.error('Please connect your TON wallet first');
      return false;
    }

    // Use provided userId, telegram ID, or wallet address as fallback
    const userId = params.userId 
      || telegramUser?.id?.toString() 
      || wallet.account.address.slice(0, 32);
    
    setIsProcessing(true);
    
    try {
      const amountNano = Math.floor(params.amount * 1e9);

      if (amountNano <= 0) {
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
          destination_address: TON_DESTINATION_ADDRESS,
          wallet_address: wallet.account.address,
          payment_method: 'ton',
          payment_currency: 'TON',
          status: 'pending',
          metadata: {
            credits: params.credits,
            server_name: params.serverName,
            upgrade_type: params.upgradeType,
            has_bolt_user: !!params.userId
          }
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment record error:', paymentError);
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: TON_DESTINATION_ADDRESS,
            amount: amountNano.toString()
          }
        ]
      };

      console.log('Sending TON transaction:', transaction);
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        console.log('Transaction successful:', result);
        
        // Update payment status in database
        if (paymentData) {
          await supabase
            .from('ton_payments')
            .update({
              status: 'confirmed',
              tx_hash: result.boc,
              confirmed_at: new Date().toISOString()
            })
            .eq('id', paymentData.id);
        }
        
        // Handle credits or subscription
        if (params.productType === 'ai_credits' && params.credits) {
          addCredits(params.credits);
        } else if (params.productType === 'subscription') {
          activateSubscription();
        }
        
        toast.success('Payment successful! 🎉');
        return true;
      } else {
        throw new Error('Transaction failed - no result returned');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      
      if (error.message?.includes('User declined') || error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Insufficient funds')) {
        toast.error('Insufficient wallet balance');
      } else {
        toast.error('Payment failed. Check wallet connection and try again.');
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    sendDirectPayment,
    isProcessing,
    isWalletConnected: !!wallet?.account,
    destinationAddress: TON_DESTINATION_ADDRESS
  };
};
