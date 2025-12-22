import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import BoltIcon from "@/components/ui/bolt-icon";

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
      <main className="min-h-screen bg-background">
        <Helmet>
          <title>Bolt Mining | Mining App</title>
          <meta name="description" content="Start mining and earn free Bolt tokens" />
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center space-y-6">
            <div className="simple-loader mx-auto"></div>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <BoltIcon size="lg" />
                <span className="text-xl font-bold text-primary">Bolt Mining</span>
              </div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <Helmet>
          <title>Error | Bolt Mining</title>
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="p-8 max-w-md w-full text-center bg-card border-border">
            <div className="space-y-4">
              <div className="text-4xl">⚠️</div>
              <h3 className="text-lg font-semibold">An error occurred</h3>
              <p className="text-destructive text-sm">{error}</p>
              <Button onClick={clearError} variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
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
        <title>Bolt Mining | Earn Cryptocurrency</title>
        <meta name="description" content="Start mining free Bolt tokens through Telegram Web App" />
        <link rel="canonical" href={`${window.location.origin}/`} />
      </Helmet>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BoltIcon size="xl" />
            <h1 className="text-3xl font-bold text-primary">Bolt</h1>
          </div>
          <p className="text-muted-foreground text-sm">Mining Platform</p>
        </div>

        {/* Connect Wallet Button */}
        {!isConnected && (
          <Button 
            onClick={handleConnectWallet}
            disabled={isConnecting}
            className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            size="lg"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        )}

        {/* User Balance */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-center gap-3">
            <BoltIcon size="lg" />
            <span className="text-2xl font-bold text-foreground">
              {formatBalance(user?.token_balance || 0)}
            </span>
            <span className="text-primary font-medium">BOLT</span>
          </div>
        </Card>

        {/* Mining Progress */}
        {isMining && miningProgress && (
          <Card className="p-6 bg-card border-border">
            <h3 className="text-lg font-bold mb-4 text-center text-primary">Mining in progress...</h3>
            <div className="w-full bg-muted rounded-full h-3 mb-4">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-300"
                style={{ width: `${(miningProgress.progress * 100)}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Mined: <span className="text-primary font-medium">{miningProgress.tokensMinedSoFar.toFixed(4)} BOLT</span>
            </p>
          </Card>
        )}

        {/* Mining Button */}
        {!isMining && (
          <Button 
            onClick={handleStartMining}
            className="w-full text-xl py-8 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
            size="lg"
          >
            <Zap className="w-8 h-8 mr-3" />
            Start Mining
          </Button>
        )}

        {/* Upgrade Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handlePowerUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'power'}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border-border hover:border-primary hover:bg-primary/10"
          >
            <TrendingUp className="w-8 h-8 mb-2 text-primary" />
            <h3 className="font-bold text-sm">Power</h3>
            <p className="text-xs text-muted-foreground">×{user?.mining_power_multiplier || 2}</p>
            <p className="text-xs text-primary font-bold mt-1">0.5 TON</p>
          </Button>

          <Button
            onClick={handleDurationUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'duration'}
            variant="outline"
            className="flex flex-col items-center p-4 h-auto border-border hover:border-primary hover:bg-primary/10"
          >
            <Zap className="w-8 h-8 mb-2 text-primary" />
            <h3 className="font-bold text-sm">Duration</h3>
            <p className="text-xs text-muted-foreground">{user?.mining_duration_hours || 4}h</p>
            <p className="text-xs text-primary font-bold mt-1">0.5 TON</p>
          </Button>
        </div>

        {/* Servers Button */}
        <Card 
          className="p-6 text-center cursor-pointer border-border hover:border-primary transition-colors bg-card"
          onClick={() => handleNavigation('/mining-servers')}
        >
          <Server className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-bold mb-2">Servers</h3>
          <p className="text-sm text-muted-foreground">
            Choose your mining server
          </p>
        </Card>
      </div>
    </main>
  );
};

export default Index;
