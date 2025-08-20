
import { useState, useEffect } from 'react';
import { useTelegramAuth } from './useTelegramAuth';
import { toast } from 'sonner';

export interface UsageStats {
  dailyUsage: number;
  remainingCredits: number;
  isSubscribed: boolean;
  dailyLimit: number;
}

export const useAiUsageLimit = () => {
  const { user: telegramUser } = useTelegramAuth();
  const [usageStats, setUsageStats] = useState<UsageStats>({
    dailyUsage: 0,
    remainingCredits: 0,
    isSubscribed: false,
    dailyLimit: 3
  });
  const [loading, setLoading] = useState(true);

  const loadUsageStats = () => {
    if (!telegramUser) {
      setLoading(false);
      return;
    }

    try {
      const today = new Date().toDateString();
      const userId = telegramUser.id.toString();
      
      // Get today's usage from localStorage
      const usageKey = `ai_usage_${userId}_${today}`;
      const dailyUsage = parseInt(localStorage.getItem(usageKey) || '0');
      
      // Get remaining credits from localStorage
      const creditsKey = `ai_credits_${userId}`;
      const remainingCredits = parseInt(localStorage.getItem(creditsKey) || '0');
      
      // Check subscription status from localStorage
      const subscriptionKey = `ai_subscription_${userId}`;
      const subscriptionData = localStorage.getItem(subscriptionKey);
      let isSubscribed = false;
      if (subscriptionData) {
        const subscription = JSON.parse(subscriptionData);
        const startDate = new Date(subscription.startDate);
        const now = new Date();
        const monthsDiff = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        isSubscribed = subscription.active && monthsDiff < 1;
      }
      
      const dailyLimit = isSubscribed ? 999 : 3;

      setUsageStats({
        dailyUsage,
        remainingCredits,
        isSubscribed,
        dailyLimit
      });

    } catch (error) {
      console.error('Error loading usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const canUseAI = (): boolean => {
    if (usageStats.isSubscribed) {
      return true;
    }
    
    if (usageStats.remainingCredits > 0) {
      return true;
    }
    
    return usageStats.dailyUsage < usageStats.dailyLimit;
  };

  const incrementUsage = (): boolean => {
    if (!telegramUser || !canUseAI()) {
      toast.error('Daily limit reached! You can purchase more uses or subscribe');
      return false;
    }

    try {
      const today = new Date().toDateString();
      const userId = telegramUser.id.toString();
      
      // If user has credits, deduct one
      if (usageStats.remainingCredits > 0) {
        const creditsKey = `ai_credits_${userId}`;
        const newCredits = Math.max(0, usageStats.remainingCredits - 1);
        localStorage.setItem(creditsKey, newCredits.toString());
      }

      // Update usage count
      const usageKey = `ai_usage_${userId}_${today}`;
      const newUsage = usageStats.dailyUsage + 1;
      localStorage.setItem(usageKey, newUsage.toString());

      // Refresh stats
      loadUsageStats();
      return true;

    } catch (error) {
      console.error('Error incrementing usage:', error);
      toast.error('Failed to track usage');
      return false;
    }
  };

  const addCredits = (amount: number): boolean => {
    if (!telegramUser) return false;

    try {
      const userId = telegramUser.id.toString();
      const creditsKey = `ai_credits_${userId}`;
      const currentCredits = parseInt(localStorage.getItem(creditsKey) || '0');
      const newCredits = currentCredits + amount;
      
      localStorage.setItem(creditsKey, newCredits.toString());
      loadUsageStats();
      toast.success(`Added ${amount} credits!`);
      return true;

    } catch (error) {
      console.error('Error adding credits:', error);
      return false;
    }
  };

  const activateSubscription = () => {
    if (!telegramUser) return false;

    try {
      const userId = telegramUser.id.toString();
      const subscriptionKey = `ai_subscription_${userId}`;
      const subscriptionData = {
        active: true,
        startDate: new Date().toISOString(),
        type: 'monthly'
      };
      
      localStorage.setItem(subscriptionKey, JSON.stringify(subscriptionData));
      loadUsageStats();
      toast.success('Subscription activated!');
      return true;

    } catch (error) {
      console.error('Error activating subscription:', error);
      return false;
    }
  };

  useEffect(() => {
    loadUsageStats();
  }, [telegramUser]);

  return {
    usageStats,
    loading,
    canUseAI,
    incrementUsage,
    addCredits,
    activateSubscription,
    refreshStats: loadUsageStats
  };
};
