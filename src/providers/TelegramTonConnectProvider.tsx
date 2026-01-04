import React, { ReactNode, useEffect, useState } from 'react';
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

interface TelegramTonConnectProviderProps {
  children: ReactNode;
}

export const TelegramTonConnectProvider: React.FC<TelegramTonConnectProviderProps> = ({ children }) => {
  const { webApp } = useTelegramAuth();

  // In Telegram Mini App, always use production manifest
  // In preview, use same-origin
  const isTelegram = !!webApp;
  const manifestUrl = isTelegram
    ? 'https://viral.elgiza.site/tonconnect-manifest.json'
    : (typeof window !== 'undefined' 
        ? new URL('/tonconnect-manifest.json', window.location.origin).toString()
        : 'https://viral.elgiza.site/tonconnect-manifest.json');

  console.log('📋 TON Connect manifest URL:', manifestUrl, 'isTelegram:', isTelegram);

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