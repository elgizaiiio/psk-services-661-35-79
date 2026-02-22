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

// Generate unique payment comment for verification
function generatePaymentComment(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BOLT-${timestamp}-${random}`.toUpperCase();
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

    if (params.amount <= 0) {
      toast.error('Invalid payment amount');
      return false;
    }

    setIsProcessing(true);
    
    try {
      const telegramId = telegramUser?.id?.toString() || '';
      const walletAddress = wallet.account.address;
      
      // Generate unique comment for this payment
      const paymentComment = generatePaymentComment();
      
      // Use telegram_id as user_id directly (no bolt_users lookup needed)
      const userId = telegramId || walletAddress.slice(0, 32);
      
      const amountNano = tonToNano(params.amount);

      // Create payment record with comment for matching
      const { data: paymentData, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: userId,
          amount_ton: params.amount,
          description: params.description,
          product_type: params.productType,
          product_id: params.productId,
          destination_address: TON_PAYMENT_ADDRESS,
          wallet_address: walletAddress,
          payment_method: 'ton',
          payment_currency: 'TON',
          status: 'pending',
          metadata: {
            credits: params.credits,
            server_name: params.serverName,
            upgrade_type: params.upgradeType,
            payment_comment: paymentComment,
            telegram_id: telegramId,
            telegram_username: telegramUser?.username,
          }
        })
        .select()
        .single();

      if (paymentError) {
        logger.error('Payment record creation failed', paymentError);
        toast.error('Failed to create payment record');
        return false;
      }

      logger.info('Payment record created', { 
        id: paymentData.id, 
        comment: paymentComment,
        amount: params.amount 
      });

      // Build transaction WITH comment payload for verification
      const commentPayload = new TextEncoder().encode(paymentComment);
      // TON comment payload: 4 bytes opcode (0x00000000 for text) + UTF-8 text
      const payload = new Uint8Array(4 + commentPayload.length);
      payload.set([0, 0, 0, 0], 0); // text comment opcode
      payload.set(commentPayload, 4);
      
      // Convert to base64
      const payloadBase64 = btoa(String.fromCharCode(...payload));

      const transaction = {
        validUntil: getValidUntil(),
        messages: [
          {
            address: TON_PAYMENT_ADDRESS,
            amount: amountNano,
            payload: payloadBase64, // Comment for payment verification
          }
        ]
      };

      logger.info('Sending TON transaction', { 
        address: TON_PAYMENT_ADDRESS, 
        amount: params.amount,
        comment: paymentComment,
      });
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (!result?.boc) {
        throw new Error('Transaction failed - no result returned');
      }

      logger.info('Transaction sent successfully', { boc: result.boc?.slice(0, 20) + '...' });
      
      // Update payment with BOC
      await supabase
        .from('ton_payments')
        .update({
          tx_hash: result.boc,
          metadata: { 
            ...(paymentData.metadata as Record<string, unknown> || {}),
            boc_submitted: true, 
            submitted_at: new Date().toISOString(),
            wallet_address: walletAddress,
          }
        })
        .eq('id', paymentData.id);
      
      // Start verification
      toast.info('Verifying transaction on blockchain...');
      
      // Wait for blockchain propagation
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Verify payment
      const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
        body: {
          paymentId: paymentData.id,
          txHash: result.boc,
          walletAddress: walletAddress,
          paymentComment: paymentComment,
        },
        headers: {
          'x-telegram-id': telegramId,
        }
      });
      
      if (verifyResult.error || !verifyResult.data?.ok) {
        logger.warn('Payment sent, verification pending', verifyResult);
        toast.warning('Payment sent! Verification may take a few minutes.');
        // Payment was sent - don't return false
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
        
        // Handle product-specific rewards
        if (params.productType === 'ai_credits' && params.credits) {
          addCredits(params.credits);
        } else if (params.productType === 'subscription') {
          activateSubscription();
        }

        // Mark server as verified
        if (params.productType === 'server_hosting') {
          try {
            await supabase
              .from('user_servers')
              .update({ payment_verified: true })
              .eq('payment_id', paymentData.id);
          } catch (e) {
            console.error('Server verify error:', e);
          }
        }

        // Notify admin
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
              description: `${params.description} (verified, comment: ${paymentComment})`,
            }
          });
        } catch (e) {
          console.error('Admin notification failed:', e);
        }
        
        toast.success('Payment verified successfully! 🎉');
      }

      return true;

    } catch (error: any) {
      logger.error('Payment error', error);
      
      if (error.message?.includes('User declined') || error.message?.includes('cancelled')) {
        toast.error('Transaction cancelled');
      } else if (error.message?.includes('Insufficient funds')) {
        toast.error('Insufficient wallet balance');
      } else {
        toast.error('Payment failed. Please try again.');
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
