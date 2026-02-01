import React, { Suspense, lazy } from 'react';
import { Helmet } from "react-helmet-async";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pickaxe, Zap, Clock, Server, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import { useNavigate } from 'react-router-dom';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';

// Lazy load 3D model for performance
const AnimatedDuckModel = lazy(() => import('@/components/mining/AnimatedDuckModel'));

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

  const upgradePrices = { power: 0.5, duration: 0.5 };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartMining = async () => {
    if (!user) {
      toast.error('Please wait for user data to load');
      return;
    }
    hapticFeedback.impact('medium');
    try {
      await startMining();
      toast.success('Mining started!');
    } catch (err) {
      toast.error('Failed to start mining');
    }
  };

  const handleUpgradeClick = async (type: 'power' | 'duration') => {
    hapticFeedback.impact('light');
    if (!wallet?.account) {
      toast.error("Connect wallet first");
      return;
    }
    if (!user?.id) {
      toast.error("User error");
      return;
    }
    try {
      const success = await createMiningUpgradePayment({
        upgradeType: type,
        currentValue: type === 'power' ? (user.mining_power || 2) : (user.mining_duration_hours || 4),
        tonAmount: upgradePrices[type],
        userId: user.id
      });
      if (success) {
        if (type === 'power') await upgradeMiningPower();
        else await upgradeMiningDuration();
      }
    } catch (error) {
      console.error(`${type} upgrade failed:`, error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-black font-bold mb-4">{error}</p>
          <Button onClick={clearError} className="bg-black text-yellow-400">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mining | BOLT</title>
      </Helmet>

      <div className="min-h-screen bg-yellow-400 flex flex-col overflow-hidden">
        {/* Top Section - Balance & Mining Status */}
        <div className="pt-14 px-4 pb-2">
          {/* Balance */}
          <div className="text-center mb-2">
            <p className="text-black/60 text-xs font-medium">BOLT Balance</p>
            <p className="text-3xl font-black text-black">
              {user?.token_balance?.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Mining Progress or Start Button */}
          {activeMiningSession ? (
            <div className="bg-black/10 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-black/70 text-sm font-medium">Mining...</span>
                <span className="text-black font-bold text-lg font-mono">
                  {formatTime(miningProgress?.timeRemaining || 0)}
                </span>
              </div>
              <Progress 
                value={(miningProgress?.progress || 0) * 100} 
                className="h-3 bg-black/20 [&>div]:bg-black" 
              />
              <p className="text-center text-black/60 text-xs mt-1">
                {((miningProgress?.progress || 0) * 100).toFixed(0)}% complete
              </p>
            </div>
          ) : (
            <Button 
              onClick={handleStartMining}
              className="w-full h-14 text-lg font-black bg-black text-yellow-400 hover:bg-black/90 rounded-2xl"
            >
              <Pickaxe className="w-5 h-5 mr-2" />
              Start Mining
            </Button>
          )}
        </div>

        {/* Center - Big Duck */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <Suspense fallback={
            <div className="flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-black/40" />
            </div>
          }>
            <AnimatedDuckModel className="w-full h-full max-h-[45vh]" />
          </Suspense>
        </div>

        {/* Bottom Section - Action Buttons */}
        <div className="px-4 pb-20 space-y-2">
          {/* Upgrade Buttons Row */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => handleUpgradeClick('power')}
              disabled={isProcessing || !wallet?.account}
              className="h-14 bg-black text-yellow-400 hover:bg-black/90 rounded-xl flex flex-col items-center justify-center gap-0.5"
            >
              {isProcessing && isUpgrading === 'power' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span className="text-xs font-bold">Power ×{user?.mining_power || 2}</span>
                </>
              )}
            </Button>

            <Button 
              onClick={() => handleUpgradeClick('duration')}
              disabled={(user?.mining_duration_hours || 4) >= 24 || isProcessing || !wallet?.account}
              className="h-14 bg-black text-yellow-400 hover:bg-black/90 rounded-xl flex flex-col items-center justify-center gap-0.5"
            >
              {isProcessing && isUpgrading === 'duration' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  <span className="text-xs font-bold">Duration {user?.mining_duration_hours || 4}h</span>
                </>
              )}
            </Button>
          </div>

          {/* Servers Button */}
          <Button 
            onClick={() => navigate('/mining-servers')}
            className="w-full h-12 bg-black/20 text-black hover:bg-black/30 rounded-xl font-bold"
            variant="ghost"
          >
            <Server className="w-5 h-5 mr-2" />
            Mining Servers
          </Button>
        </div>
      </div>
    </>
  );
};

export default MiningInner;
