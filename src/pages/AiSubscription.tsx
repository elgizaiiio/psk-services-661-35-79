import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useAiUsageLimit } from '@/hooks/useAiUsageLimit';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { Sparkles, Crown, Zap, Check, Star, Coins, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const AiSubscription = () => {
  const { user: telegramUser, hapticFeedback } = useTelegramAuth();
  const { usageStats, loading: statsLoading, activateSubscription } = useAiUsageLimit();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();

  const handleSubscribe = async () => {
    hapticFeedback.impact('medium');
    
    const success = await sendDirectPayment({
      amount: 9.99,
      description: 'AI Image Generator - Monthly Subscription',
      productType: 'subscription',
      productId: 'monthly_subscription'
    });

    if (success) {
      activateSubscription();
      toast.success('Subscription activated successfully! 🎉');
    }
  };

  const features = [
    'Unlimited image generation',
    'High quality images',
    'Priority processing',
    'Save images in 4K resolution',
    'Dedicated technical support',
    'Remove watermark'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <Helmet>
          <title>AI Image Generator Subscription | AI Premium</title>
          <meta name="description" content="Get a monthly subscription for AI image generator with exclusive features" />
        </Helmet>

        {/* Header */}
        <Card className="p-4 bg-gradient-to-r from-card/80 to-card/60 border-primary/20 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage src={telegramUser?.photo_url} alt={telegramUser?.first_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <Sparkles className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-lg font-bold flex items-center">
                <Crown className="w-5 h-5 ml-2 text-yellow-500" />
                AI Premium Subscription
              </h1>
              <p className="text-sm text-muted-foreground">Upgrade your account for maximum benefits</p>
            </div>
          </div>
        </Card>

        {/* Current Usage */}
        <Card className="p-4 bg-gradient-to-br from-secondary/5 to-primary/5 border-secondary/20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <Zap className="w-6 h-6 text-secondary ml-2" />
              <h3 className="text-lg font-semibold">Daily Usage</h3>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-secondary">
                {usageStats.dailyUsage}/{usageStats.dailyLimit}
              </div>
              <p className="text-sm text-muted-foreground">
                {usageStats.isSubscribed ? 'Unlimited usage' : 'Free trials remaining today'}
              </p>
              {!usageStats.isSubscribed && (
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(usageStats.dailyUsage / usageStats.dailyLimit) * 100}%` }}
                  />
                </div>
              )}
              {usageStats.remainingCredits > 0 && (
                <div className="text-sm text-primary font-medium">
                  {usageStats.remainingCredits} purchased credits available
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Premium Plan */}
        <Card className="relative overflow-hidden border-primary/30">
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
            Most Popular
          </div>
          <CardHeader className="text-center pt-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Monthly Subscription</CardTitle>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">$9.99</div>
              <p className="text-muted-foreground">per month</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={handleSubscribe}
              disabled={usageStats.isSubscribed || isProcessing}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Processing payment...
                </div>
              ) : usageStats.isSubscribed ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Already subscribed
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Subscribe Now
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Free Plan */}
        <Card className="border-muted">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl">Free Plan</CardTitle>
            <div className="text-center">
              <div className="text-3xl font-bold text-muted-foreground mb-2">Free</div>
              <p className="text-muted-foreground">3 daily trials</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">3 images per day</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Standard quality</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-muted rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-sm text-muted-foreground">Watermark included</span>
              </div>
            </div>
            
            <Button variant="outline" className="w-full py-3" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Benefits */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <div className="text-center">
            <Coins className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Why Premium Subscription?
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Get unlimited high-quality images with priority support and exclusive features
            </p>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default AiSubscription;