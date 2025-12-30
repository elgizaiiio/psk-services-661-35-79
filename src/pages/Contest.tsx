import { Helmet } from 'react-helmet-async';
import { Trophy, Gift, Users, Share2, Copy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/contest/CountdownTimer';
import { Leaderboard } from '@/components/contest/Leaderboard';
import { useContestLeaderboard } from '@/hooks/useContestLeaderboard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { toast } from 'sonner';

const Contest = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: userData } = useBoltMining(tgUser);
  const { contest, leaderboard, userRank, loading } = useContestLeaderboard(userData?.id);
  const [copied, setCopied] = useState(false);
  useTelegramBackButton();

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
    const text = `🏆 Join the BOLT Referral Championship!\n\n💰 Prize Pool: $10,000 in TON\n\nJoin now and compete!`;
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
        <h1 className="text-lg font-semibold mb-2">No Active Contest</h1>
        <p className="text-sm text-muted-foreground mb-6">Check back later</p>
        <Link to="/invite">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
      </div>
    );
  }

  const prizes = contest.prizes_config || [];

  return (
    <>
      <Helmet>
        <title>Referral Contest</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-foreground">{contest.name}</h1>
              <p className="text-xs text-muted-foreground">Top 10 Winners</p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">$10,000</span>
            </div>
          </div>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <CountdownTimer endDate={contest.end_date} />
          </motion.div>

          {/* Your Stats */}
          {userRank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">
                  {userRank.rank > 0 ? `#${userRank.rank}` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{userRank.referral_count}</p>
                <p className="text-xs text-muted-foreground">Referrals</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-green-500">
                  {userRank.prize_usd ? `$${userRank.prize_usd}` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Prize</p>
              </div>
            </motion.div>
          )}

          {/* Prizes */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Prizes
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {prizes.slice(0, 10).map((prize: any) => (
                <div
                  key={prize.rank}
                  className={`p-2 rounded-lg text-center ${
                    prize.rank <= 3 ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border'
                  }`}
                >
                  <p className="text-xs mb-1">
                    {prize.rank === 1 && '🥇'}
                    {prize.rank === 2 && '🥈'}
                    {prize.rank === 3 && '🥉'}
                    {prize.rank > 3 && `#${prize.rank}`}
                  </p>
                  <p className="text-xs font-semibold text-primary">${prize.prize_usd}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Leaderboard
            </h3>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Leaderboard
                entries={leaderboard}
                prizes={prizes}
                currentUserId={userData?.id}
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border">
          <div className="max-w-lg mx-auto flex gap-3">
            <Button onClick={handleShare} className="flex-1 h-11 rounded-xl gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-11 w-11 p-0 rounded-xl"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contest;