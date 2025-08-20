import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useToast } from '@/hooks/use-toast';

interface TelegramWalletConnectProps {
  onConnect?: () => void;
  showTitle?: boolean;
  className?: string;
}

export const TelegramWalletConnect: React.FC<TelegramWalletConnectProps> = ({
  onConnect,
  showTitle = true,
  className = ''
}) => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const { webApp, hapticFeedback } = useTelegramAuth();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    if (wallet?.account) {
      setConnectionStatus('connected');
      setIsConnecting(false);
      if (onConnect) {
        onConnect();
      }
    } else {
      setConnectionStatus('disconnected');
    }
  }, [wallet, onConnect]);

  useEffect(() => {
    // Listen for connection events
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo?.account) {
        console.log('✅ Wallet connected successfully:', walletInfo);
        hapticFeedback.notification('success');
        toast({
          title: "Wallet Connected",
          description: "TON wallet linked successfully",
        });
        setConnectionStatus('connected');
        setIsConnecting(false);
      } else {
        console.log('❌ Wallet disconnected');
        setConnectionStatus('disconnected');
        setIsConnecting(false);
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, hapticFeedback, toast]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');
      hapticFeedback.impact('light');
      
      console.log('🔗 Attempting to connect wallet...');
      console.log('📱 Is Telegram WebApp:', !!webApp);
      console.log('🌐 Current URL:', window.location.href);
      
      // For Telegram WebApp, use specific connection strategy
      if (webApp) {
        console.log('📱 Connecting in Telegram WebApp mode');
        
        // Try to open wallet selector
        await tonConnectUI.openModal();
        
        // Set a timeout to handle connection issues
        setTimeout(() => {
          if (connectionStatus === 'connecting') {
            console.log('⏰ Connection timeout, showing fallback options');
            setIsConnecting(false);
            toast({
              title: "Connection Difficulty",
              description: "Try opening the wallet manually or use a direct link",
              variant: "destructive",
            });
          }
        }, 10000); // 10 seconds timeout
        
      } else {
        console.log('🌐 Connecting in browser mode');
        await tonConnectUI.openModal();
      }
      
    } catch (error) {
      console.error('❌ Error connecting wallet:', error);
      hapticFeedback.notification('error');
      setIsConnecting(false);
      setConnectionStatus('disconnected');
      
      toast({
        title: "Connection Error",
        description: "An error occurred while trying to connect the wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      hapticFeedback.impact('light');
      await tonConnectUI.disconnect();
      toast({
        title: "Disconnected",
        description: "Wallet has been disconnected",
      });
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
      hapticFeedback.notification('error');
    }
  };

  const openWalletDirectly = () => {
    hapticFeedback.impact('medium');
    
    toast({
      title: "Manual Connection",
      description: "1. Open your TON wallet app\n2. Go to Settings → Connected Apps\n3. Add connection manually\n4. Enter: " + window.location.origin,
    });
  };

  if (connectionStatus === 'connected' && wallet?.account) {
    return (
      <Card className={`border-green-500/20 bg-green-500/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Wallet Connected</p>
                <p className="text-xs text-muted-foreground">
                  {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardContent className="p-6 text-center space-y-4">
        {showTitle && (
          <div>
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">Connect TON Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet to start mining coins
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>

          {webApp && (
            <Button 
              variant="outline" 
              onClick={openWalletDirectly}
              className="w-full"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Manual Connection Guide
            </Button>
          )}
        </div>

        {webApp && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-600 text-right">
              <p className="font-medium mb-1">Tip for Telegram usage:</p>
              <p>If the wallet doesn't work, try opening it manually then return to the app</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
