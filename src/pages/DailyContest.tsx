import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp } from '@/components/ui/motion-wrapper';

interface Winner {
  id: string;
  winner_name: string;
  contest_date: string;
  prize_amount: number;
}

const DailyContest = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user } = useBoltMining(tgUser);
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const { usdToTon } = usePriceCalculator();
  useTelegramBackButton();

  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [participantCount] = useState(() => 2847 + Math.floor(Math.random() * 200));

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      // Fetch recent winners
      const { data: winnersData } = await supabase
        .from('daily_contest_winners')
        .select('*')
        .order('contest_date', { ascending: false })
        .limit(7);

      setWinners(winnersData || []);

      // Check if user has entered today
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

    const entryFeeUsd = 0.25;
    const entryFeeTon = usdToTon(entryFeeUsd);

    try {
      const success = await sendDirectPayment({
        amount: entryFeeTon,
        description: 'Daily Contest Entry - $100 Prize',
        productType: 'token_purchase',
        productId: 'daily_contest',
        userId: user.id,
      });

      if (success) {
        // Record entry
        await supabase.from('daily_contest_entries').insert({
          user_id: user.id,
          paid_amount: entryFeeUsd,
        });

        setHasEntered(true);
        toast.success('You have entered the contest!');
      }
    } catch (error) {
      console.error('Error entering contest:', error);
      toast.error('Failed to enter contest');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return `${diffDays} days ago`;
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

      <div className="max-w-md mx-auto px-5 pt-16">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">$100 Daily Prize</h1>
              <p className="text-muted-foreground">One lucky winner every day</p>
            </div>
          </FadeUp>

          {/* Prize Info Card */}
          <FadeUp>
            <motion.div 
              className="p-6 rounded-2xl bg-card border border-border"
              whileHover={{ y: -2 }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-primary">$100</p>
                  <p className="text-xs text-muted-foreground mt-1">Prize Pool</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">$0.25</p>
                  <p className="text-xs text-muted-foreground mt-1">Entry Fee</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{participantCount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Participants</p>
                </div>
              </div>
            </motion.div>
          </FadeUp>

          {/* How It Works */}
          <FadeUp>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">How It Works</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-sm text-muted-foreground">Pay $0.25 entry fee to join today's contest</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-sm text-muted-foreground">Stay active in the app to increase your chances</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">3</span>
                  <p className="text-sm text-muted-foreground">Winner is selected randomly at midnight UTC</p>
                </div>
              </div>
            </div>
          </FadeUp>

          {/* Enter Button */}
          <FadeUp>
            <Button
              onClick={handleEnterContest}
              disabled={hasEntered || isProcessing}
              className="w-full h-14 text-base font-semibold rounded-xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : hasEntered ? (
                'Entered Today'
              ) : (
                'Enter Contest - $0.25'
              )}
            </Button>
            {hasEntered && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                You are in! Winner will be announced at midnight UTC
              </p>
            )}
          </FadeUp>

          {/* Previous Winners */}
          <FadeUp>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">Previous Winners</h2>
              <div className="space-y-3">
                {winners.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No winners yet</p>
                ) : (
                  winners.map((winner) => (
                    <motion.div
                      key={winner.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{winner.winner_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(winner.contest_date)}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">${winner.prize_amount}</span>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default DailyContest;
