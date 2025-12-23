import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Zap, TrendingUp, Clock, Server, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
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

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background">
        <Helmet>
          <title>Bolt Mining | Mining App</title>
          <meta name="description" content="Start mining and earn free Bolt tokens" />
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
                <BoltIcon size="xl" />
              </div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-2 border-primary/30 animate-ping mx-auto" />
            </div>
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <Helmet>
          <title>Error | Bolt Mining</title>
        </Helmet>
        
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
            <p className="text-destructive text-sm">{error}</p>
          </div>
          <Button 
            onClick={clearError} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  const formatBalance = (balance: number) => {
    return balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progressPercent = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Bolt Mining | Earn Cryptocurrency</title>
        <meta name="description" content="Start mining free Bolt tokens through Telegram Web App" />
        <link rel="canonical" href={`${window.location.origin}/`} />
      </Helmet>

      <div className="max-w-md mx-auto px-5 py-6 space-y-8">
        
        {/* Header with Wallet */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BoltIcon size="lg" />
            <span className="text-xl font-bold text-foreground">Bolt</span>
          </div>
          
          {!isConnected ? (
            <Button 
              onClick={handleConnectWallet}
              disabled={isConnecting}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10 gap-2"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? "..." : "Connect"}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">Connected</span>
            </div>
          )}
        </div>

        {/* Balance Display */}
        <div className="text-center space-y-2 py-8">
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-bold text-foreground tracking-tight">
              {formatBalance(user?.token_balance || 0)}
            </span>
          </div>
          <p className="text-primary font-medium text-lg">BOLT</p>
        </div>

        {/* Mining Section */}
        <div className="space-y-4">
          {isMining && miningProgress ? (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              {/* Progress Ring */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      className="text-primary transition-all duration-500"
                      strokeDasharray={`${progressPercent * 3.52} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-foreground">{progressPercent}%</span>
                    <span className="text-xs text-muted-foreground">Mining</span>
                  </div>
                </div>
              </div>
              
              {/* Mining Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Mined</p>
                  <p className="text-lg font-bold text-primary">
                    {miningProgress.tokensMinedSoFar.toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                  <p className="text-lg font-bold text-foreground">
                    {Math.max(0, Math.ceil(miningProgress.timeRemaining / 60))}m
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              onClick={handleStartMining}
              className="w-full h-16 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl font-semibold gap-3"
            >
              <Zap className="w-6 h-6" />
              Start Mining
            </Button>
          )}
        </div>

        {/* Upgrade Cards */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePowerUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'power'}
            className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Power</h3>
            <p className="text-2xl font-bold text-primary mb-1">×{user?.mining_power || 2}</p>
            <p className="text-xs text-muted-foreground">0.5 TON</p>
          </button>

          <button
            onClick={handleDurationUpgrade}
            disabled={!!activeMiningSession || isUpgrading === 'duration'}
            className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 text-left disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Duration</h3>
            <p className="text-2xl font-bold text-primary mb-1">{user?.mining_duration_hours || 4}h</p>
            <p className="text-xs text-muted-foreground">0.5 TON</p>
          </button>
        </div>

        {/* Servers Card */}
        <button 
          onClick={() => handleNavigation('/mining-servers')}
          className="w-full p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Mining Servers</h3>
            <p className="text-sm text-muted-foreground">Choose your mining server</p>
          </div>
          <div className="text-muted-foreground">→</div>
        </button>

      </div>
    </main>
  );
};

export default Index;
