import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Gift, Star, Zap } from 'lucide-react';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';

const MonthlyContest = () => {
  useTelegramBackButton();

  const benefits = [
    { icon: Users, text: 'Daily active users get more chances' },
    { icon: Zap, text: 'Complete tasks to boost engagement' },
    { icon: Star, text: 'Invite friends for bonus entries' },
    { icon: Calendar, text: 'Winner selected at month end' },
  ];

  return (
    <PageWrapper className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>$3,000 Monthly Contest</title>
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-4 space-y-6">
        {/* Hero Section */}
        <FadeUp delay={0.1}>
          <motion.div 
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 p-6 border border-amber-500/20"
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
            
            <div className="relative text-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
              >
                <Trophy className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h1 className="text-3xl font-bold text-foreground">Monthly Contest</h1>
                <p className="text-muted-foreground mt-1">Win big every month!</p>
              </div>

              <motion.div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-2xl shadow-lg shadow-amber-500/30"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-6 h-6" />
                $3,000 USDT
              </motion.div>
            </div>
          </motion.div>
        </FadeUp>

        {/* How It Works */}
        <FadeUp delay={0.2}>
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">How It Works</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  1
                </div>
                <div>
                  <p className="font-medium text-foreground">Stay Active</p>
                  <p className="text-sm text-muted-foreground">Use the app daily and complete tasks</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  2
                </div>
                <div>
                  <p className="font-medium text-foreground">Earn Engagement Points</p>
                  <p className="text-sm text-muted-foreground">Mining, tasks, referrals all count</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  3
                </div>
                <div>
                  <p className="font-medium text-foreground">Monthly Selection</p>
                  <p className="text-sm text-muted-foreground">One user selected based on engagement</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm shrink-0">
                  4
                </div>
                <div>
                  <p className="font-medium text-foreground">Win $3,000 USDT</p>
                  <p className="text-sm text-muted-foreground">Prize sent directly to your wallet</p>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Benefits */}
        <FadeUp delay={0.3}>
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Increase Your Chances</h2>
            
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="p-3 rounded-xl bg-muted/50 text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <benefit.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">{benefit.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Info Box */}
        <FadeUp delay={0.4}>
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Every month, we select one lucky winner based on their engagement and activity. 
              The more active you are, the higher your chances of winning!
            </p>
          </div>
        </FadeUp>
      </div>
    </PageWrapper>
  );
};

export default MonthlyContest;
