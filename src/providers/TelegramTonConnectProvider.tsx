import React, { ReactNode, useEffect, useState } from 'react';
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface TelegramTonConnectProviderProps {
  children: ReactNode;
}

export const TelegramTonConnectProvider: React.FC<TelegramTonConnectProviderProps> = ({ children }) => {
  const { webApp } = useTelegramAuth();

  // Get manifest URL immediately with proper fallback
  const getManifestUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://psk-viral-mining.lovable.app/tonconnect-manifest.json';
    }
    
    // Check if we're in Telegram WebApp
    if (webApp) {
      console.log('🔗 Running in Telegram WebApp, using production manifest');
      return 'https://psk-viral-mining.lovable.app/tonconnect-manifest.json';
    }
    
    // Check if we're in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🛠️ Running in development, using local manifest');
      return `${window.location.origin}/tonconnect-manifest.json`;
    }
    
    // Production environment
    console.log('🌐 Running in production, using production manifest');
    return `${window.location.origin}/tonconnect-manifest.json`;
  };

  const manifestUrl = getManifestUrl();
  console.log('📋 TON Connect manifest URL:', manifestUrl);

  // Ensure we always have a valid manifest URL
  if (!manifestUrl) {
    console.error('❌ No manifest URL available');
    return <div>Loading...</div>;
  }

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      actionsConfiguration={{
        twaReturnUrl: webApp ? 'https://t.me/ViralMiningBot' : undefined,
        skipRedirectToWallet: webApp ? 'always' : 'never',
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};