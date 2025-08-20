import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TelegramWalletConnect } from '@/components/TelegramWalletConnect';

interface WalletConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverName?: string;
  serverPrice?: string;
}

const WalletConnectDialog: React.FC<WalletConnectDialogProps> = ({
  open,
  onOpenChange,
  serverName,
  serverPrice
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-background/95 to-card/95 backdrop-blur-lg border border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-4">
          {/* Server Info */}
          {serverName && serverPrice && (
            <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
              <h3 className="font-bold text-lg mb-1">{serverName}</h3>
              <p className="text-2xl font-bold text-primary">{serverPrice}</p>
            </div>
          )}

          <TelegramWalletConnect 
            onConnect={() => onOpenChange(false)}
            showTitle={!serverName}
            className="border-none shadow-none bg-transparent"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnectDialog;