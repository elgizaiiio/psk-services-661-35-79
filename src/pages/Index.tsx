import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useUserServers } from '@/hooks/useUserServers';
import { Server, Zap, ChevronRight, Wallet } from 'lucide-react';

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
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();
  const { getTotalStats } = useUserServers(user?.id || null);
  const stats = getTotalStats();

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Helmet><title>Bolt</title></Helmet>
        <div className="simple-loader" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <Helmet><title>Error</title></Helmet>
        <div className="text-center space-y-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" variant="outline">Try Again</Button>
        </div>
      </main>
    );
  }

  const boltBalance = user?.token_balance || 0;
  const usdtBalance = (user as any)?.usdt_balance || 0;
  const isMining = activeMiningSession && new Date() < new Date(activeMiningSession.end_time);
  const progress = miningProgress ? Math.round(miningProgress.progress * 100) : 0;

  return (
    <main className="min-h-screen bg-background pb-28">
      <Helmet>
        <title>Bolt Mining</title>
        <meta name="description" content="Mine BOLT & USDT tokens" />
      </Helmet>

      <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Hey, {telegramUser?.first_name || 'Miner'}
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back</p>
          </div>
          {!isConnected ? (
            <Button
              onClick={() => connectWallet()}
              disabled={isConnecting}
              size="sm"
              variant="outline"
              className="text-xs h-9"
            >
              {isConnecting ? "..." : "Connect"}
            </Button>
          ) : (
            <div className="h-9 px-3 flex items-center rounded-lg bg-primary/10 text-primary text-xs font-medium">
              Connected
            </div>
          )}
        </div>

        {/* Total Balance Card */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <p className="text-4xl font-bold text-foreground tracking-tight">
            ${(usdtBalance + (boltBalance * 0.001)).toFixed(2)}
          </p>
          {stats.totalBoltPerDay > 0 && (
            <p className="text-sm text-primary mt-2">
              +${((stats.totalBoltPerDay * 0.001) + stats.totalUsdtPerDay).toFixed(4)}/day
            </p>
          )}
        </div>

        {/* Balances Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">BOLT</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{boltBalance.toLocaleString()}</p>
            {stats.totalBoltPerDay > 0 && (
              <p className="text-xs text-primary mt-1">+{stats.totalBoltPerDay}/day</p>
            )}
          </div>
          
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-green-500 text-sm font-bold">$</span>
              </div>
              <span className="text-xs text-muted-foreground">USDT</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{usdtBalance.toFixed(2)}</p>
            {stats.totalUsdtPerDay > 0 && (
              <p className="text-xs text-green-500 mt-1">+${stats.totalUsdtPerDay.toFixed(4)}/day</p>
            )}
          </div>
        </div>

        {/* Servers Card */}
        <button 
          onClick={() => navigate('/mining-servers')}
          className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">My Servers</p>
              <p className="text-xs text-muted-foreground">
                {stats.totalServers > 0 
                  ? `${stats.totalServers} servers • ${stats.totalHashRate} TH/s`
                  : 'No servers yet'
                }
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Mining Button / Progress */}
        {stats.totalServers > 0 && (
          <div>
            {isMining && miningProgress ? (
              <div className="p-4 rounded-xl bg-card border border-primary/20">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-foreground">Mining</span>
                  <span className="text-lg font-bold text-primary">{progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>+{miningProgress.tokensMinedSoFar.toFixed(2)} BOLT</span>
                  <span>+${(miningProgress.tokensMinedSoFar * 0.001).toFixed(4)} USDT</span>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleStartMining}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Mining
              </Button>
            )}
          </div>
        )}

        {/* Wallet Quick Access */}
        <button 
          onClick={() => navigate('/wallet')}
          className="w-full p-4 rounded-xl bg-card border border-border flex items-center justify-between hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Wallet className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Wallet</p>
              <p className="text-xs text-muted-foreground">Manage assets</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

      </div>
    </main>
  );
};

export default Index;
