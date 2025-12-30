import { useState, useEffect, useCallback } from 'react';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useToast } from '@/hooks/use-toast';

export const useTelegramTonConnect = () => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { webApp, hapticFeedback } = useTelegramAuth();
  const { toast } = useToast();
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number>(0);

  // Enhanced connection status
  const connectionStatus = wallet?.account ? 'connected' : isConnecting ? 'connecting' : 'disconnected';
  
  // Check if we're in Telegram environment
  const isTelegramEnvironment = !!webApp;

  useEffect(() => {
    // Monitor connection status changes
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo?.account) {
        console.log('✅ Wallet connected in Telegram:', walletInfo);
        setIsConnecting(false);
        setConnectionError(null);
        
        if (isTelegramEnvironment) {
          hapticFeedback.notification('success');
          toast({
            title: "Wallet connected successfully",
            description: `Address: ${walletInfo.account.address.slice(0, 6)}...${walletInfo.account.address.slice(-4)}`,
          });
        }
      } else {
        console.log('❌ Wallet disconnected in Telegram');
        setIsConnecting(false);
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, hapticFeedback, toast, isTelegramEnvironment]);

  const connectWallet = useCallback(async () => {
    const now = Date.now();
    
    // Prevent rapid connection attempts
    if (now - lastConnectionAttempt < 2000) {
      console.log('⏳ Too many connection attempts, please wait');
      return false;
    }

    try {
      setIsConnecting(true);
      setConnectionError(null);
      setLastConnectionAttempt(now);

      console.log('🔗 Starting wallet connection...');
      console.log('📱 Environment:', isTelegramEnvironment ? 'Telegram WebApp' : 'Browser');
      console.log('🌐 Current URL:', window.location.href);
      console.log('📋 Manifest URL:', 'TON Connect UI initialized');

      if (isTelegramEnvironment) {
        hapticFeedback.impact('light');
        
        // Special handling for Telegram WebApp
        console.log('📱 Using Telegram-specific connection flow');
        
        // Open modal with custom configuration for Telegram
        await tonConnectUI.openModal();
        
        // Set a reasonable timeout for Telegram environment
        const timeoutId = setTimeout(() => {
          if (!wallet?.account) {
            console.log('⏰ Connection timeout in Telegram');
            setIsConnecting(false);
            setConnectionError('Connection timeout. Try again or use manual linking.');
            
            toast({
              title: "Connection Timeout",
              description: "Try manual linking or try again",
              variant: "destructive",
            });
          }
        }, 15000); // 15 seconds timeout for Telegram

        // Clear timeout if connection succeeds
        if (wallet?.account) {
          clearTimeout(timeoutId);
        }
        
      } else {
        // Standard browser connection
        console.log('🌐 Using standard browser connection flow');
        await tonConnectUI.openModal();
      }

      return true;
    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      setIsConnecting(false);
      setConnectionError(error instanceof Error ? error.message : 'Connection error');
      
      if (isTelegramEnvironment) {
        hapticFeedback.notification('error');
      }
      
      toast({
        title: "Wallet connection error",
        description: "An error occurred while trying to connect the wallet. Try again.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [wallet, tonConnectUI, isTelegramEnvironment, hapticFeedback, toast, lastConnectionAttempt]);

  const disconnectWallet = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting wallet...');
      
      if (isTelegramEnvironment) {
        hapticFeedback.impact('light');
      }
      
      await tonConnectUI.disconnect();
      setConnectionError(null);
      
      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Disconnect error:', error);
      
      if (isTelegramEnvironment) {
        hapticFeedback.notification('error');
      }
      
      toast({
        title: "Disconnection error",
        description: "An error occurred while disconnecting",
        variant: "destructive",
      });
      
      return false;
    }
  }, [tonConnectUI, isTelegramEnvironment, hapticFeedback, toast]);

  const openWalletDirectly = useCallback(() => {
    console.log('🔗 Opening wallet directly...');
    
    if (isTelegramEnvironment) {
      hapticFeedback.impact('medium');
    }
    
    // List of popular TON wallets
    const walletUrls = {
      tonkeeper: 'https://app.tonkeeper.com/',
      tonhub: 'https://tonhub.com/',
      openmask: 'https://www.openmask.app/',
    };
    
    const tonkeeperUrl = walletUrls.tonkeeper;
    
    if (isTelegramEnvironment && (webApp as any)?.openLink) {
      // Try to use Telegram's openLink method
      (webApp as any).openLink(tonkeeperUrl);
    } else {
      // Fallback to regular window.open
      window.open(tonkeeperUrl, '_blank');
    }
    
    toast({
      title: "Open Wallet",
      description: "Tonkeeper wallet will open. After connecting, return to this app.",
    });
  }, [isTelegramEnvironment, webApp, hapticFeedback, toast]);

  const getWalletInfo = useCallback(() => {
    if (!wallet?.account) return null;
    
    return {
      address: wallet.account.address,
      chain: wallet.account.chain,
      shortAddress: `${wallet.account.address.slice(0, 6)}...${wallet.account.address.slice(-4)}`,
      publicKey: wallet.account.publicKey || null,
    };
  }, [wallet]);

  // Debug info for development
  const debugInfo = {
    isConnected: !!wallet?.account,
    isConnecting,
    connectionError,
    isTelegramEnvironment,
    walletInfo: getWalletInfo(),
    manifestUrl: 'Configured via TelegramTonConnectProvider',
  };

  return {
    // Connection state
    wallet,
    isConnected: !!wallet?.account,
    isConnecting,
    connectionStatus,
    connectionError,
    
    // Environment info
    isTelegramEnvironment,
    
    // Actions
    connectWallet,
    disconnectWallet,
    openWalletDirectly,
    
    // Utilities
    getWalletInfo,
    debugInfo,
  };
};