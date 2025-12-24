import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Zap, Wallet, ArrowUp, Settings, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';

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
        
        {/* Header with Settings & Wallet */}
        <div className="flex justify-between items-center mb-12">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          
          {!isConnected ? (
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? "..." : "Connect Wallet"}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
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
          <div className="mb-8">
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
          <div className="space-y-3">
            <Button 
              onClick={handleStartMining}
              className="w-full h-14 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-base font-medium"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Mining
            </Button>
            
            <Button 
              onClick={() => navigate('/upgrade-center')}
              variant="outline"
              className="w-full h-12 rounded-full border-border text-foreground hover:bg-muted"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Upgrades
            </Button>
            
            <Button 
              onClick={() => navigate('/challenges')}
              variant="outline"
              className="w-full h-12 rounded-full border-border text-foreground hover:bg-muted"
            >
              <Target className="w-4 h-4 mr-2" />
              Challenges
            </Button>
          </div>
        )}

      </div>
    </main>
  );
};

export default Index;
