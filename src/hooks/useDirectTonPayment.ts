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
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade' | 'token_purchase' | 'spin_tickets';
  productId?: string;
  credits?: number;
  serverName?: string;
  upgradeType?: 'power' | 'duration';
  userId?: string | null;
}

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
            bolt_user_id: boltUserId
          }
        })
        .select()
        .single();

      if (paymentError) {
        logger.error('Payment record error', paymentError);
      }

      // SECURITY: Assert the correct payment address is being used
      console.log('TON Payment Details:', {
        destinationAddress: TON_PAYMENT_ADDRESS,
        amount: params.amount,
        amountNano: amountNano,
        productType: params.productType
      });

      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: amountNano
            // No payload/comment - transactions are sent without comments
          }
        ]
      };

      logger.info('Sending TON transaction to unified address', { 
        address: TON_PAYMENT_ADDRESS, 
        amount: params.amount 
      });
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        logger.info('Transaction sent', { boc: result.boc?.slice(0, 20) + '...' });
        
        // Update payment with BOC - but keep as PENDING until verified
        if (paymentData) {
          await supabase
            .from('ton_payments')
            .update({
              status: 'pending', // Keep pending until blockchain verification
              tx_hash: result.boc,
              metadata: { 
                boc_submitted: true, 
                submitted_at: new Date().toISOString(),
              wallet_address: wallet.account.address
              }
            })
            .eq('id', paymentData.id);
          
          // Start verification process
          toast.info('Verifying transaction on blockchain...');
          
          // Wait a few seconds for the transaction to propagate
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Try to verify the payment
          const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
            body: {
              paymentId: paymentData.id,
              txHash: result.boc,
              walletAddress: wallet.account.address
            }
          });
          
          if (verifyResult.error || !verifyResult.data?.ok) {
            logger.warn('Payment sent but verification pending', verifyResult);
            toast.warning('Payment sent! Verification may take a few minutes.');
            // Don't return false - the payment was sent, just not verified yet
          } else {
            logger.info('Payment verified successfully');
            // Update to confirmed
            await supabase
              .from('ton_payments')
              .update({
                status: 'confirmed',
                confirmed_at: new Date().toISOString()
              })
              .eq('id', paymentData.id);
          }
        }
        
        // Handle credits or subscription
        if (params.productType === 'ai_credits' && params.credits) {
          addCredits(params.credits);
        } else if (params.productType === 'subscription') {
          activateSubscription();
        }

        // Notify admin about the payment
        try {
          console.log('Sending admin notification for payment...');
          const notifyResult = await supabase.functions.invoke('notify-admin-payment', {
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
            }
          });
          console.log('Admin notification result:', notifyResult);
        } catch (notifyError) {
          console.error('Failed to notify admin:', notifyError);
          logger.error('Failed to notify admin', notifyError);
        }
        
        toast.success('Payment successful! 🎉');
        return true;
      } else {
        throw new Error('Transaction failed - no result returned');
      }

    } catch (error: any) {
      logger.error('Payment error', error);
      
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
    destinationAddress: TON_PAYMENT_ADDRESS
  };
};
