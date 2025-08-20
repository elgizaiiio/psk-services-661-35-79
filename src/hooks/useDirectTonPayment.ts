
import { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { useAiUsageLimit } from './useAiUsageLimit';

export interface DirectPaymentParams {
  amount: number;
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting' | 'mining_upgrade';
  productId?: string;
  credits?: number;
  serverName?: string;
  upgradeType?: 'power' | 'duration';
}

export const useDirectTonPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const { addCredits, activateSubscription } = useAiUsageLimit();

  const sendDirectPayment = async (params: DirectPaymentParams): Promise<boolean> => {
    if (!wallet?.account) {
      toast.error('Please connect TON wallet first');
      return false;
    }

    setIsProcessing(true);
    
    try {
      const destinationAddress = 'UQBJSGcoWTcjdkWFSxA4A6sLmnD5uFKoKHFEHc3LqGJvFWya';
      const amountNano = Math.floor(params.amount * 1e9);

      if (amountNano <= 0) {
        throw new Error('Invalid payment amount');
      }

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [
          {
            address: destinationAddress,
            amount: amountNano.toString()
          }
        ]
      };

      console.log('Sending TON transaction:', transaction);
      
      const result = await tonConnectUI.sendTransaction(transaction);
      
      if (result) {
        console.log('Transaction successful:', result);
        
        const paymentRecord = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          amount_ton: params.amount,
          description: params.description,
          product_type: params.productType,
          product_id: params.productId,
          status: 'confirmed',
          tx_hash: result.boc,
          confirmed_at: new Date().toISOString(),
          metadata: {
            credits: params.credits,
            server_name: params.serverName,
            upgrade_type: params.upgradeType
          }
        };

        localStorage.setItem(`ton_payment_${paymentRecord.id}`, JSON.stringify(paymentRecord));
        
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
      
      if (error.message?.includes('User declined')) {
        toast.error('Transaction cancelled by user');
      } else if (error.message?.includes('Insufficient funds')) {
        toast.error('Insufficient funds in wallet');
      } else if (error.message?.includes('Invalid data format')) {
        toast.error('Invalid transaction data - please try again');
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
    isWalletConnected: !!wallet?.account
  };
};
