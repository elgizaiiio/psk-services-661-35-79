import { useState } from 'react';
import { useTonWallet } from "@tonconnect/ui-react";

export const useWalletGuard = () => {
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const wallet = useTonWallet();

  const executeWithWallet = (callback: () => void) => {
    if (!wallet?.account) {
      setShowWalletDialog(true);
      return false;
    }
    callback();
    return true;
  };

  const isWalletConnected = !!wallet?.account;

  return {
    showWalletDialog,
    setShowWalletDialog,
    executeWithWallet,
    isWalletConnected,
    wallet
  };
};