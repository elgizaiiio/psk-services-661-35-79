import React, { ReactNode, useEffect, useState } from 'react';
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface TelegramTonConnectProviderProps {
  children: ReactNode;
}

export const TelegramTonConnectProvider: React.FC<TelegramTonConnectProviderProps> = ({ children }) => {
  const { webApp } = useTelegramAuth();

  // Get dynamic manifest URL using Supabase Edge function
  const getManifestUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://gzzwjopalvopvgofepvj.supabase.co/functions/v1/tonconnect-manifest';
    }
    
    // Always use dynamic manifest from Supabase Edge function
    const dynamicManifestUrl = 'https://gzzwjopalvopvgofepvj.supabase.co/functions/v1/tonconnect-manifest';
    
    if (webApp) {
      console.log('🔗 Running in Telegram WebApp, using dynamic manifest');
    } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('🛠️ Running in development, using dynamic manifest');
    } else {
      console.log('🌐 Running in production, using dynamic manifest');
    }
    
    return dynamicManifestUrl;
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
        twaReturnUrl: webApp ? 'https://t.me/Vlralbot?startapp' : undefined,
        skipRedirectToWallet: 'never',
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};