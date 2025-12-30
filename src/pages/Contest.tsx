import { Helmet } from 'react-helmet-async';
import { Trophy, Gift, Users, Share2, Copy, Check, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountdownTimer } from '@/components/contest/CountdownTimer';
import { Leaderboard } from '@/components/contest/Leaderboard';
import { useContestLeaderboard } from '@/hooks/useContestLeaderboard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { toast } from 'sonner';

const Contest = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: userData } = useBoltMining(tgUser);
  const { contest, leaderboard, userRank, loading } = useContestLeaderboard(userData?.id);
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    if (!tgUser?.id) return '';
    return `https://t.me/BoltMiningBot?start=ref_${tgUser.id}`;
  }, [tgUser?.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = () => {
    const text = `🏆 Join the BOLT Referral Championship!\n\n💰 Prize Pool: $10,000 in TON\n🥇 1st Place: $3,000\n🥈 2nd Place: $2,000\n🥉 3rd Place: $1,500\n\nJoin now and compete for amazing prizes!`;
    const webApp = (window as any).Telegram?.WebApp;
    
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`);
    } else {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto text-center py-20">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Active Contest</h1>
          <p className="text-muted-foreground mb-6">Check back later for upcoming contests!</p>
          <Link to="/invite">
            <Button>Back to Invite</Button>
          </Link>
        </div>
      </div>
    );
  }

  const prizes = contest.prizes_config || [];

  return (
    <>
      <Helmet>
        <title>Referral Contest - $10,000 Prize Pool</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <Link to="/invite">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="font-bold">{contest.name}</h1>
              <p className="text-xs text-muted-foreground">Top 10 Winners</p>
            </div>
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          {/* Prize Pool & Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <span className="font-bold text-primary">$10,000 in TON</span>
            </div>
            
            <h2 className="text-lg font-medium text-muted-foreground mb-4">Time Remaining</h2>
            <CountdownTimer endDate={contest.end_date} />
          </motion.div>

          {/* Your Stats */}
          {userRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <h3 className="font-medium text-center mb-3">Your Stats</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {userRank.rank > 0 ? `#${userRank.rank}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Rank</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{userRank.referral_count}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {userRank.prize_usd ? `$${userRank.prize_usd}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Prize</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Prize Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-primary" />
                Prize Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {prizes.slice(0, 10).map((prize: any) => (
                  <div
                    key={prize.rank}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      prize.rank <= 3 ? 'bg-primary/10' : 'bg-muted/50'
                    }`}
                  >
                    <span className="font-medium">
                      {prize.rank === 1 && '🥇'}
                      {prize.rank === 2 && '🥈'}
                      {prize.rank === 3 && '🥉'}
                      {prize.rank > 3 && `#${prize.rank}`}
                    </span>
                    <span className="font-bold text-primary">${prize.prize_usd}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Live Leaderboard
              </h3>
              <Leaderboard
                entries={leaderboard}
                prizes={prizes}
                currentUserId={userData?.id}
              />
            </Card>
          </motion.div>

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Button onClick={handleShare} className="w-full gap-2" size="lg">
              <Share2 className="w-5 h-5" />
              Invite Friends
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Link
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Contest;
