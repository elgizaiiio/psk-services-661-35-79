import React, { ReactNode } from 'react';
import { TelegramWalletConnect } from '@/components/TelegramWalletConnect';
import { useTonWallet } from "@tonconnect/ui-react";
interface WalletGuardProps {
  children: ReactNode;
}

const WalletGuardInner: React.FC<WalletGuardProps> = ({ children }) => {
  const wallet = useTonWallet();

  if (!wallet?.account?.address) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-6">
          <TelegramWalletConnect 
            onConnect={() => console.log('Wallet connected via WalletGuard')}
            showTitle={true}
            className="glassmorphism"
          />
        </div>
      </main>
    );
  }

  return <>{children}</>;
};

const WalletGuard: React.FC<WalletGuardProps> = ({ children }) => {
  return (
    <WalletGuardInner>{children}</WalletGuardInner>
  );
};

export default WalletGuard;