
import React from 'react';
import { Helmet } from "react-helmet-async";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Pickaxe, Timer, Zap, Clock, Coins, TrendingUp, Server, Wallet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTonConnectUI, TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { useNavigate } from 'react-router-dom';
import WalletConnectDialog from '@/components/WalletConnectDialog';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';


const MiningInner = () => {
  const navigate = useNavigate();
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const {
    user,
    activeMiningSession,
    loading,
    error,
    startMining,
    miningProgress,
    upgradeMiningPower,
    upgradeMiningDuration,
    clearError
  } = useViralMining(telegramUser);

  const { createMiningUpgradePayment, isUpgrading, isProcessing } = useMiningUpgrades();

  const upgradePrices = {
    power: 0.5,
    duration: 0.5
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };

  const handleStartMining = async () => {
    if (!user) {
      toast.error('Please wait for user data to load');
      return;
    }
    hapticFeedback.impact('medium');
    try {
      await startMining();
      toast.success('Mining started successfully!');
    } catch (err) {
      toast.error('Failed to start mining');
    }
  };

  const handleUpgradeClick = async (type: 'power' | 'duration') => {
    hapticFeedback.impact('light');
    
    if (!wallet?.account) {
      toast.error("Please connect TON wallet from home page first");
      return;
    }

    if (!user?.id) {
      toast.error("User ID error");
      return;
    }
    
    try {
      const success = await createMiningUpgradePayment({
        upgradeType: type,
        currentValue: type === 'power' 
          ? (user.mining_power || 2) 
          : (user.mining_duration_hours || 4),
        tonAmount: upgradePrices[type],
        userId: user.id
      });
      
      if (success) {
        if (type === 'power') {
          await upgradeMiningPower();
        } else {
          await upgradeMiningDuration();
        }
      }
    } catch (error) {
      console.error(`${type} upgrade failed:`, error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 max-w-sm w-full text-center glassmorphism">
          <Pickaxe className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-semibold mb-2 text-foreground">System Error</h3>
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={clearError} className="w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Bolt Mining | Cryptocurrency Mining</title>
        <meta name="description" content="Start mining BOLT cryptocurrency through Telegram app" />
      </Helmet>

      <main className="safe-area pb-16">
        <div className="max-w-sm mx-auto px-6 pt-16 pb-8 space-y-6">
          {/* User Avatar */}
          <div className="text-center">
            <Avatar className="w-20 h-20 mx-auto border-4 border-primary/20">
              <AvatarImage 
                src={user?.photo_url || telegramUser?.photo_url} 
                alt={user?.first_name || telegramUser?.first_name || 'User'} 
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-primary text-xl font-bold">
                {(user?.first_name?.[0] || telegramUser?.first_name?.[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              {user?.first_name || telegramUser?.first_name || 'User'}
            </h2>
          </div>

          {/* User Balance */}
          <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <div className="text-3xl font-bold text-primary mb-2">
              {user?.token_balance?.toFixed(4) || '0.0000'}
            </div>
            <div className="text-sm text-muted-foreground font-medium">BOLT Tokens</div>
          </Card>

          {/* Start Mining Button */}
          {!activeMiningSession ? (
            <Button 
              onClick={handleStartMining}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all duration-300 shadow-lg"
            >
              <Pickaxe className="w-5 h-5 mr-3" />
              Start Mining
            </Button>
          ) : (
            <Card className="p-6 text-center bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <div className="space-y-4">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(miningProgress?.timeRemaining || 0)}
                </div>
                <Progress 
                  value={(miningProgress?.progress || 0) * 100} 
                  className="h-2" 
                />
                <div className="text-sm text-muted-foreground">
                  Mining in progress... {((miningProgress?.progress || 0) * 100).toFixed(1)}%
                </div>
              </div>
            </Card>
          )}

          {/* Servers Button */}
          <Button 
            onClick={() => navigate('/mining-servers')}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-accent/20 to-accent/30 border border-accent/30 hover:bg-accent/40 transition-all duration-300"
            variant="outline"
          >
            <Server className="w-5 h-5 mr-3" />
            Servers
          </Button>

          {/* Upgrades Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-center text-foreground">Upgrades</h3>
            
            <div className="space-y-4">
              {/* Power Upgrade */}
              <Card className="p-5 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">Mining Power</p>
                      <p className="text-sm text-muted-foreground">
                        ×{user?.mining_power || 2} → ×{(user?.mining_power || 2) + 2}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-0 text-sm px-3 py-1">
                    {upgradePrices.power} TON
                  </Badge>
                </div>
                <Button 
                  onClick={() => handleUpgradeClick('power')}
                  disabled={isProcessing || !wallet?.account}
                  className="w-full h-12 text-base"
                >
                  {isProcessing && isUpgrading === 'power' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Upgrade Power'
                  )}
                </Button>
              </Card>

              {/* Duration Upgrade */}
              <Card className="p-5 bg-gradient-to-r from-secondary/5 to-secondary/10 border-secondary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">Mining Duration</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.mining_duration_hours || 4}h → {Math.min(24, (user?.mining_duration_hours || 4) * 2)}h
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-secondary/20 text-secondary border-0 text-sm px-3 py-1">
                    {upgradePrices.duration} TON
                  </Badge>
                </div>
                <Button 
                  onClick={() => handleUpgradeClick('duration')}
                  disabled={(user?.mining_duration_hours || 4) >= 24 || isProcessing || !wallet?.account}
                  className="w-full h-12 text-base"
                  variant="outline"
                >
                  {isProcessing && isUpgrading === 'duration' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Upgrade Duration'
                  )}
                </Button>
              </Card>
            </div>
          </div>

          {/* Wallet Status */}
          {!wallet?.account && (
            <Card className="p-4 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-base font-semibold text-foreground">Connect Wallet</p>
                    <p className="text-sm text-muted-foreground">Required for upgrades</p>
                  </div>
                </div>
                <TonConnectButton />
              </div>
            </Card>
          )}

        </div>
      </main>
    </>
  );
};

export default MiningInner;
