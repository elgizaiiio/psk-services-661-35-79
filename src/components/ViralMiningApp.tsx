import React, { useEffect, useState } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MiningHeader from '@/components/mining/MiningHeader';
import MiningStatus from '@/components/mining/MiningStatus';
import MiningUpgrades from '@/components/mining/MiningUpgrades';

const ViralMiningApp = () => {
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const {
    user,
    activeMiningSession,
    loading,
    error,
    startMining,
    getCurrentMiningProgress,
    clearError
  } = useViralMining(telegramUser);

  const [currentTime, setCurrentTime] = useState(new Date());
  const miningProgress = getCurrentMiningProgress();

  // Update time every second for real-time countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Handle refresh after upgrades
  const handleUpgradeRefresh = () => {
    // This could trigger a refresh of user data if needed
    console.log('Upgrade completed, refreshing data...');
  };

  const handleStartMining = async () => {
    hapticFeedback.impact('medium');
    await startMining();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center bg-gradient-to-br from-card via-card/95 to-card/90 border border-primary/20">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center animate-pulse">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Loading Bolt Mining</h3>
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-2">Loading Error</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={clearError} className="bg-destructive hover:bg-destructive/90 text-white">
                Try Again
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header Section */}
        <MiningHeader 
          telegramUser={telegramUser}
          user={user}
        />

        {/* Mining Status Section */}
        <MiningStatus
          user={user}
          activeMiningSession={activeMiningSession}
          miningProgress={miningProgress}
          onStartMining={handleStartMining}
          formatTime={formatTime}
        />

        {/* Upgrades Section */}
        <MiningUpgrades
          user={user}
          activeMiningSession={activeMiningSession}
          onUpgrade={handleUpgradeRefresh}
        />
      </div>
    </div>
  );
};

export default ViralMiningApp;