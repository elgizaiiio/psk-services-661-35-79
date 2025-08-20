import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Server, ArrowRight, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import ViralIcon from "@/components/ui/viral-icon";
import BallBarAnimation from "@/components/animations/BallBarAnimation";
import MiningLoader from "@/components/animations/MiningLoader";
import FloatingCircles from "@/components/animations/FloatingCircles";

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { 
    user,
    activeMiningSession,
    loading,
    error,
    startMining,
    miningProgress,
    clearError
  } = useViralMining(telegramUser);
  const { createMiningUpgradePayment, isUpgrading } = useMiningUpgrades();
  const { 
    isConnected, 
    isConnecting, 
    connectWallet 
  } = useTelegramTonConnect();

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  const handleNavigation = (route: string) => {
    hapticFeedback.impact('light');
    navigate(route);
  };

  const handleConnectWallet = async () => {
    hapticFeedback.impact('medium');
    await connectWallet();
  };

  const handlePowerUpgrade = async () => {
    if (!user || !telegramUser) return;
    
    hapticFeedback.impact('medium');
    await createMiningUpgradePayment({
      upgradeType: 'power',
      currentValue: user.mining_power_multiplier || 2,
      tonAmount: 0.5,
      userId: user.id
    });
  };

  const handleDurationUpgrade = async () => {
    if (!user || !telegramUser) return;
    
    hapticFeedback.impact('medium');
    await createMiningUpgradePayment({
      upgradeType: 'duration',
      currentValue: user.mining_duration_hours || 4,
      tonAmount: 0.5,
      userId: user.id
    });
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-primary/10">
        <Helmet>
          <title>VIRAL Mining | Mining App</title>
          <meta name="description" content="Start mining and earn free VIRAL tokens" />
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="simple-loader"></div>
            <Card className="glassmorphism p-6 max-w-sm">
              <div className="space-y-3">
                <div className="text-gradient text-xl font-bold">VIRAL Mining</div>
                <p className="text-muted-foreground">Loading app...</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-destructive/10">
        <Helmet>
          <title>Error | VIRAL Mining</title>
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="glassmorphism p-8 max-w-md w-full text-center">
            <div className="space-y-4">
              <div className="text-4xl">⚠️</div>
              <h3 className="text-lg font-semibold">An error occurred</h3>
              <p className="text-destructive text-sm">{error}</p>
              <Button onClick={clearError} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  const formatBalance = (balance: number) => {
    return balance.toFixed(4);
  };

  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>VIRAL Mining | Earn Cryptocurrency</title>
        <meta name="description" content="Start mining free VIRAL tokens through Telegram Web App" />
        <link rel="canonical" href={`${window.location.origin}/`} />
      </Helmet>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Animation Section */}
        {!isMining ? (
          <BallBarAnimation />
        ) : (
          <MiningLoader />
        )}

        {/* Connect Wallet Button - Only show if not connected */}
        {!isConnected && (
          <div className="p-4">
            <Button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
              size="lg"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}

        {/* User Balance - Small */}
        <div className="flex items-center justify-center gap-2 p-3">
          <ViralIcon className="w-6 h-6" />
          <span className="text-lg font-bold">
            {formatBalance(user?.token_balance || 0)} VIRAL
          </span>
        </div>

        {/* Mining Progress */}
        {isMining && miningProgress && (
          <div className="text-center p-4">
            <h3 className="text-lg font-bold mb-4">Mining in progress...</h3>
            <div className="w-full bg-muted rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-4 rounded-full transition-all duration-300"
                style={{ width: `${(miningProgress.progress * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Mined: {miningProgress.tokensMinedSoFar.toFixed(4)} VIRAL
            </p>
          </div>
        )}

        {/* First Box - Mining Button */}
        {!isMining && (
          <div className="p-6">
            <Button 
              onClick={handleStartMining}
              className="w-full text-xl py-8 bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
            >
              <Zap className="w-8 h-8 mr-3" />
              Start Mining
            </Button>
          </div>
        )}

        {/* Second Box - Upgrade Buttons with TON Payment */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handlePowerUpgrade}
              disabled={!!activeMiningSession || isUpgrading === 'power'}
              className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/20 hover:to-primary/10 text-foreground"
              variant="outline"
            >
              <TrendingUp className="w-8 h-8 mb-2 text-primary" />
              <h3 className="font-bold text-sm">Power Upgrade</h3>
              <p className="text-xs text-muted-foreground">×{user?.mining_power_multiplier || 2}</p>
              <p className="text-xs text-primary font-bold mt-1">0.5 TON</p>
              {isUpgrading === 'power' && <p className="text-xs text-muted-foreground">Upgrading...</p>}
            </Button>

            <Button
              onClick={handleDurationUpgrade}
              disabled={!!activeMiningSession || isUpgrading === 'duration'}
              className="flex flex-col items-center p-4 h-auto bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20 hover:from-secondary/20 hover:to-secondary/10 text-foreground"
              variant="outline"
            >
              <Zap className="w-8 h-8 mb-2 text-secondary" />
              <h3 className="font-bold text-sm">Duration Upgrade</h3>
              <p className="text-xs text-muted-foreground">{user?.mining_duration_hours || 4}h</p>
              <p className="text-xs text-secondary font-bold mt-1">0.5 TON</p>
              {isUpgrading === 'duration' && <p className="text-xs text-muted-foreground">Upgrading...</p>}
            </Button>
          </div>
        </div>

        {/* Servers Button */}
        <div className="cursor-pointer hover:scale-105 transition-all duration-300 p-6 text-center"
              onClick={() => handleNavigation('/mining-servers')}>
          <Server className="w-12 h-12 mx-auto mb-4 text-accent" />
          <h3 className="text-xl font-bold mb-2">Servers</h3>
          <p className="text-sm text-muted-foreground">
            Choose your mining server
          </p>
        </div>

        {/* Floating Circles Animation */}
        <FloatingCircles />
      </div>
    </main>
  );
};

export default Index;