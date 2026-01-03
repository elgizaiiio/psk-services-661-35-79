import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { CountdownTimer } from '@/components/contest/CountdownTimer';
import { Leaderboard } from '@/components/contest/Leaderboard';
import { useContestLeaderboard } from '@/hooks/useContestLeaderboard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { toast } from 'sonner';
import { Copy, Check, Share2 } from 'lucide-react';

const Contest = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: userData } = useBoltMining(tgUser);
  const { contest, leaderboard, userRank, loading } = useContestLeaderboard(userData?.id);
  const [copied, setCopied] = useState(false);
  useTelegramBackButton();

  const referralLink = useMemo(() => {
    if (!tgUser?.id) return '';
    return `https://t.me/Boltminingbot?start=ref_${tgUser.id}`;
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
    const text = `Join the BOLT Referral Championship!\n\nPrize Pool: $10,000 in TON\n\nJoin now and compete!`;
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
        <h1 className="text-lg font-semibold mb-2 text-foreground">No Active Contest</h1>
        <p className="text-sm text-muted-foreground mb-6">Check back later for new competitions</p>
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
        <title>Referral Contest | BOLT</title>
      </Helmet>

      <div className="min-h-screen bg-background pb-32">
        <div className="px-5 pt-16 pb-4 max-w-md mx-auto">
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">{contest.name}</h1>
            <p className="text-muted-foreground text-sm">Invite friends to win prizes</p>
          </div>

          {/* Prize & Timer */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
              <p className="text-2xl font-bold text-primary">$10,000</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Ends In</p>
              <CountdownTimer endDate={contest.end_date} compact />
            </div>
          </div>

          {/* Your Position */}
          {userRank && (
            <div className="mb-8">
              <h2 className="text-sm font-medium text-foreground mb-3">Your Position</h2>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {userRank.rank > 0 ? `#${userRank.rank}` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Rank</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <p className="text-2xl font-bold text-foreground">{userRank.referral_count}</p>
                  <p className="text-xs text-muted-foreground">Referrals</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border text-center">
                  <p className="text-2xl font-bold text-primary">
                    {userRank.prize_usd ? `$${userRank.prize_usd}` : '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">Prize</p>
                </div>
              </div>
            </div>
          )}

          {/* Prize Breakdown */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-foreground mb-3">Prize Distribution</h2>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="space-y-2">
                {prizes.slice(0, 10).map((prize: any) => (
                  <div 
                    key={prize.rank} 
                    className={`flex items-center justify-between py-2 ${
                      prize.rank <= 3 ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    <span className="text-sm">
                      {prize.rank === 1 ? '1st' : prize.rank === 2 ? '2nd' : prize.rank === 3 ? '3rd' : `${prize.rank}th`} Place
                    </span>
                    <span className="font-semibold">${prize.prize_usd}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-8">
            <h2 className="text-sm font-medium text-foreground mb-3">Leaderboard</h2>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <Leaderboard
                entries={leaderboard}
                prizes={prizes}
                currentUserId={userData?.id}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto flex gap-3">
            <Button onClick={handleShare} className="flex-1 h-12 rounded-xl font-medium">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button
              onClick={handleCopy}
              variant="outline"
              className="h-12 w-12 p-0 rounded-xl"
            >
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contest;