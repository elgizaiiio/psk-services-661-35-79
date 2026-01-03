import React, { ReactNode, useEffect, useState } from 'react';
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface TelegramTonConnectProviderProps {
  children: ReactNode;
}

export const TelegramTonConnectProvider: React.FC<TelegramTonConnectProviderProps> = ({ children }) => {
  const { webApp } = useTelegramAuth();

  // Use official TON Connect demo manifest (works 100%)
  const manifestUrl = 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json';
  
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
        twaReturnUrl: webApp ? 'https://t.me/Boltminingbot?startapp' : undefined,
        skipRedirectToWallet: 'never',
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
};