import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Clock, Wallet } from "lucide-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';

const Index = () => {
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { 
    user,
    activeMiningSession,
    loading,
    error,
    startMining,
    miningProgress,
    clearError
  } = useBoltMining(telegramUser);
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

  const handleConnectWallet = async () => {
    hapticFeedback.impact('medium');
    await connectWallet();
  };

  const handlePowerUpgrade = async () => {
    if (!user || !telegramUser) return;
    hapticFeedback.impact('medium');
    await createMiningUpgradePayment({
      upgradeType: 'power',
      currentValue: user.mining_power || 2,
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

  // Loading state
  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Helmet>
          <title>Bolt | Mining</title>
        </Helmet>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet>
          <title>Error | Bolt</title>
        </Helmet>
        <div className="text-center space-y-4 max-w-xs">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" className="bg-primary text-primary-foreground">
            Retry
          </Button>
        </div>
      </main>
    );
  }

  const balance = user?.token_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Bolt | Mining</title>
        <meta name="description" content="Mine BOLT tokens" />
      </Helmet>

      <div className="max-w-md mx-auto px-6 pt-8 pb-6">
        
        {/* Wallet */}
        <div className="flex justify-end mb-12">
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Connect
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs text-primary">Connected</span>
            </div>
          )}
        </div>

        {/* Balance */}
        <div className="text-center mb-16">
          <p className="text-6xl font-bold text-foreground tracking-tight mb-2">
            {balance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-primary text-sm font-medium tracking-wide">BOLT</p>
        </div>

        {/* Mining */}
        {isMining && miningProgress ? (
          <div className="mb-12">
            {/* Progress bar */}
            <div className="h-1 bg-muted rounded-full mb-4 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mining</span>
              <span className="text-foreground font-medium">{progress}%</span>
            </div>
            
            <div className="flex justify-between text-sm mt-2">
              <span className="text-primary">+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT</span>
              <span className="text-muted-foreground">
                {Math.max(0, Math.ceil(miningProgress.timeRemaining / 60))}m left
              </span>
            </div>
          </div>
        ) : (
          <Button 
            onClick={handleStartMining}
            className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-base font-medium mb-12"
          >
            <Zap className="w-5 h-5 mr-2" />
            Start Mining
          </Button>
        )}

        {/* Upgrades */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handlePowerUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'power'}
            className="p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-40"
          >
            <TrendingUp className="w-5 h-5 text-primary mb-3" />
            <p className="text-xs text-muted-foreground mb-1">Power</p>
            <p className="text-lg font-semibold text-foreground">×{user?.mining_power || 2}</p>
          </button>

          <button
            onClick={handleDurationUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'duration'}
            className="p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-40"
          >
            <Clock className="w-5 h-5 text-primary mb-3" />
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-lg font-semibold text-foreground">{user?.mining_duration_hours || 4}h</p>
          </button>
        </div>

      </div>
    </main>
  );
};

export default Index;
