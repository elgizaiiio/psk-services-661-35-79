import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { toast } from 'sonner';
import { Loader2, Gift, Users, Sparkles, Clock } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, ScaleIn } from '@/components/ui/motion-wrapper';

const DailyContest = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user } = useBoltMining(tgUser);
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  useTelegramBackButton();

  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [participantCount, setParticipantCount] = useState(2847);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const countRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchData();
    // Increment participants randomly
    countRef.current = setInterval(() => {
      setParticipantCount(prev => prev + Math.floor(Math.random() * 3));
    }, 8000);

    return () => {
      if (countRef.current) clearInterval(countRef.current);
    };
  }, [user?.id]);

  // Countdown timer to midnight UTC
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      if (user?.id) {
        const today = new Date().toISOString().split('T')[0];
        const { data: entry } = await supabase
          .from('daily_contest_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('entry_date', today)
          .single();

        setHasEntered(!!entry);
      }
    } catch (error) {
      console.error('Error fetching contest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterContest = async () => {
    if (!user?.id) {
      toast.error('Please wait for data to load');
      return;
    }

    const entryFeeTon = 0.25;

    try {
      const success = await sendDirectPayment({
        amount: entryFeeTon,
        description: 'Daily Contest Entry - $100 Prize',
        productType: 'token_purchase',
        productId: 'daily_contest',
        userId: user.id,
      });

      if (success) {
        await supabase.from('daily_contest_entries').insert({
          user_id: user.id,
          paid_amount: entryFeeTon,
        });

        setHasEntered(true);
        setParticipantCount(prev => prev + 1);
        toast.success('You have entered the contest!');
      }
    } catch (error) {
      console.error('Error entering contest:', error);
      toast.error('Failed to enter contest');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-background pb-32">
      <Helmet>
        <title>Daily $100 Contest</title>
      </Helmet>

      <div className="max-w-md mx-auto px-5 pt-10">
        <StaggerContainer className="space-y-5">
          
          {/* Header */}
          <FadeUp>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">$100 Daily</h1>
              <p className="text-sm text-muted-foreground mt-1">One lucky winner every day</p>
            </div>
          </FadeUp>

          {/* Prize Card */}
          <ScaleIn delay={0.1}>
            <motion.div 
              className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/10 border border-emerald-500/20 text-center"
              whileHover={{ scale: 1.01 }}
            >
              <p className="text-5xl font-bold text-emerald-500 mb-1">$100</p>
              <p className="text-sm text-muted-foreground">Prize Pool</p>
            </motion.div>
          </ScaleIn>

          {/* Stats Row */}
          <FadeUp delay={0.15}>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-card border border-border text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-2" />
                <motion.p 
                  className="text-xl font-bold text-foreground"
                  key={participantCount}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {participantCount.toLocaleString()}
                </motion.p>
                <p className="text-xs text-muted-foreground">Participants</p>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border text-center">
                <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">0.25</p>
                <p className="text-xs text-muted-foreground">TON Entry</p>
              </div>
            </div>
          </FadeUp>

          {/* Countdown */}
          <FadeUp delay={0.2}>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Drawing in</p>
              </div>
              <div className="flex justify-center gap-3">
                {[
                  { value: timeLeft.hours, label: 'H' },
                  { value: timeLeft.minutes, label: 'M' },
                  { value: timeLeft.seconds, label: 'S' },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <motion.div 
                      className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center"
                      key={item.value}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="text-xl font-bold text-foreground">
                        {item.value.toString().padStart(2, '0')}
                      </span>
                    </motion.div>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* How it Works */}
          <FadeUp delay={0.25}>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-sm font-semibold text-foreground mb-3">How It Works</p>
              <div className="space-y-2.5">
                {[
                  'Pay 0.25 TON to join today\'s contest',
                  'Stay active to increase your chances',
                  'Winner selected at midnight UTC',
                ].map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Enter Button */}
          <FadeUp delay={0.3}>
            <Button
              onClick={handleEnterContest}
              disabled={hasEntered || isProcessing}
              className="w-full h-14 text-base font-semibold rounded-2xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : hasEntered ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  You're In!
                </>
              ) : (
                'Enter Contest — 0.25 TON'
              )}
            </Button>
            {hasEntered && (
              <motion.p 
                className="text-xs text-center text-primary mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Good luck! Winner announced at midnight UTC
              </motion.p>
            )}
          </FadeUp>

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default DailyContest;