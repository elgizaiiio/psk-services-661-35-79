import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, Gift, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoltIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { useRichAds } from '@/hooks/useRichAds';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WatchAdCardProps {
  userId?: string;
  telegramId?: number;
  onRewardClaimed?: () => void;
}

const DAILY_LIMIT = 500;
const REWARD_BOLT = 10;
const REWARD_USDT = 0.01;

export const WatchAdCard: React.FC<WatchAdCardProps> = ({
  userId,
  telegramId,
  onRewardClaimed,
}) => {
  const { showAd, isReady, isLoading: adLoading } = useRichAds();
  const [dailyCount, setDailyCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load daily ad count
  const loadDailyCount = useCallback(async () => {
    if (!telegramId) return;

    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { count, error } = await supabase
        .from('ad_views')
        .select('*', { count: 'exact', head: true })
        .eq('telegram_id', telegramId)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (!error) {
        setDailyCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading daily ad count:', err);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    loadDailyCount();
  }, [loadDailyCount]);

  const handleWatchAd = async () => {
    if (!telegramId || !userId) {
      toast.error('Please wait for account to load');
      return;
    }

    if (dailyCount >= DAILY_LIMIT) {
      toast.error('Daily limit reached! Come back tomorrow.');
      return;
    }

    setIsProcessing(true);

    // Show instruction toast before ad loads
    toast.info('👆 Click on the ad to complete and earn rewards!', {
      duration: 5000,
    });

    try {
      // Show the ad
      const adCompleted = await showAd();

      if (adCompleted) {
        // Ad completed successfully - reward is given via server callback
        // But we also update the local count for UX
        setDailyCount(prev => prev + 1);
        toast.success(`+${REWARD_BOLT} BOLT +${REWARD_USDT} USDT!`);
        onRewardClaimed?.();
      } else {
        toast.info('Click on the ad to complete and earn rewards');
      }
    } catch (err) {
      console.error('Error watching ad:', err);
      toast.error('Failed to load ad');
    } finally {
      setIsProcessing(false);
    }
  };

  const remaining = DAILY_LIMIT - dailyCount;
  const progress = (dailyCount / DAILY_LIMIT) * 100;
  const isDisabled = !isReady || isProcessing || adLoading || dailyCount >= DAILY_LIMIT;

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-border bg-card animate-pulse">
        <div className="h-20"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">Watch Ads</p>
            <p className="text-xs text-muted-foreground">Click on ad to earn</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
            <Gift className="w-4 h-4" />
            <span>{remaining} left</span>
          </div>
        </div>
      </div>

      {/* Rewards Display */}
      <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-background/50">
        <div className="flex items-center gap-1 text-sm">
          <BoltIcon size={14} />
          <span className="font-medium text-primary">+{REWARD_BOLT}</span>
        </div>
        <span className="text-muted-foreground">+</span>
        <div className="flex items-center gap-1 text-sm">
          <UsdtIcon size={14} />
          <span className="font-medium text-emerald-400">+{REWARD_USDT} USDT</span>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">per ad</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Today's progress</span>
          <span className="text-foreground font-medium">{dailyCount}/{DAILY_LIMIT}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Daily Earnings */}
      {dailyCount > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-emerald-400">
            Today: +{dailyCount * REWARD_BOLT} BOLT, +{(dailyCount * REWARD_USDT).toFixed(2)} USDT
          </span>
        </div>
      )}

      {/* Watch Button */}
      <Button
        onClick={handleWatchAd}
        disabled={isDisabled}
        className="w-full h-12 text-base font-semibold"
        variant={dailyCount >= DAILY_LIMIT ? 'secondary' : 'default'}
      >
        {isProcessing || adLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading Ad...
          </>
        ) : dailyCount >= DAILY_LIMIT ? (
          'Daily Limit Reached'
        ) : !isReady ? (
          'Loading...'
        ) : (
          <>
            <Play className="w-5 h-5 mr-2" />
            Watch Ad
          </>
        )}
      </Button>
    </motion.div>
  );
};
