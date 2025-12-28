import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { BrowserProvider, parseEther, formatEther } from 'ethers';
import { useTelegramAuth } from './useTelegramAuth';
import { supabase } from '@/integrations/supabase/client';

export interface MetaMaskPaymentParams {
  amount: number; // Amount in ETH
  description: string;
  productType: 'ai_credits' | 'game_powerup' | 'subscription' | 'server_hosting';
  productId?: string;
  credits?: number;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export const useMetaMaskPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { user: telegramUser } = useTelegramAuth();

  // Destination wallet for receiving payments
  const DESTINATION_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f5bC91'; // Replace with your ETH wallet

  const checkMetaMask = useCallback(() => {
    return typeof window !== 'undefined' && window.ethereum?.isMetaMask;
  }, []);

  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!checkMetaMask()) {
      toast.error('MetaMask غير مثبت. يرجى تثبيت MetaMask أولاً');
      window.open('https://metamask.io/download/', '_blank');
      return null;
    }

    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        toast.success('تم الاتصال بـ MetaMask بنجاح');
        return accounts[0];
      }
      return null;
    } catch (error: unknown) {
      console.error('MetaMask connection error:', error);
      if ((error as { code?: number }).code === 4001) {
        toast.error('تم رفض الاتصال من قبل المستخدم');
      } else {
        toast.error('فشل الاتصال بـ MetaMask');
      }
      return null;
    }
  }, [checkMetaMask]);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
    setIsConnected(false);
    toast.info('تم قطع الاتصال بـ MetaMask');
  }, []);

  const getBalance = useCallback(async (): Promise<string | null> => {
    if (!walletAddress || !window.ethereum) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(walletAddress);
      return formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  }, [walletAddress]);

  const sendPayment = useCallback(async (params: MetaMaskPaymentParams): Promise<boolean> => {
    if (!telegramUser) {
      toast.error('يرجى تسجيل الدخول عبر Telegram أولاً');
      return false;
    }

    if (!isConnected || !walletAddress) {
      const connected = await connectWallet();
      if (!connected) return false;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      // Check balance
      const balance = await provider.getBalance(walletAddress!);
      const amountWei = parseEther(params.amount.toString());

      if (balance < amountWei) {
        toast.error('رصيد ETH غير كافٍ');
        return false;
      }

      // Create payment record first
      const paymentId = `eth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error: dbError } = await supabase
        .from('ton_payments')
        .insert({
          id: paymentId,
          user_id: telegramUser.id.toString(),
          amount_ton: params.amount,
          description: params.description,
          product_type: params.productType,
          product_id: params.productId,
          destination_address: DESTINATION_WALLET,
          payment_method: 'metamask',
          payment_currency: 'ETH',
          status: 'pending',
          metadata: {
            credits: params.credits,
            from_address: walletAddress,
          },
        });

      if (dbError) {
        console.error('Database error:', dbError);
      }

      toast.info('جاري إرسال المعاملة...');

      // Send transaction
      const tx = await signer.sendTransaction({
        to: DESTINATION_WALLET,
        value: amountWei,
      });

      toast.info('جاري تأكيد المعاملة...');

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt && receipt.status === 1) {
        // Update payment status
        await supabase
          .from('ton_payments')
          .update({
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            eth_tx_hash: tx.hash,
            metadata: {
              credits: params.credits,
              from_address: walletAddress,
              tx_hash: tx.hash,
              block_number: receipt.blockNumber,
            },
          })
          .eq('id', paymentId);

        toast.success('تم الدفع بنجاح! 🎉');
        return true;
      } else {
        await supabase
          .from('ton_payments')
          .update({ status: 'failed' })
          .eq('id', paymentId);

        toast.error('فشلت المعاملة');
        return false;
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      if ((error as { code?: string }).code === 'ACTION_REJECTED') {
        toast.error('تم رفض المعاملة من قبل المستخدم');
      } else {
        toast.error('فشل الدفع');
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [telegramUser, isConnected, walletAddress, connectWallet]);

  return {
    isProcessing,
    isConnected,
    walletAddress,
    isMetaMaskAvailable: checkMetaMask(),
    connectWallet,
    disconnectWallet,
    getBalance,
    sendPayment,
  };
};
