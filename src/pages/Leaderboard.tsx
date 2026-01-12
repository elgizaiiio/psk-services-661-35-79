import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { useContestLeaderboard } from '@/hooks/useContestLeaderboard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Loader2 } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp } from '@/components/ui/motion-wrapper';

const PRIZES = [
  { rank: 1, prize: 50 },
  { rank: 2, prize: 30 },
  { rank: 3, prize: 15 },
  { rank: 4, prize: 5 },
  { rank: 5, prize: 3 },
];

const Leaderboard = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: userData } = useBoltMining(tgUser);
  const { leaderboard, userRank, loading } = useContestLeaderboard(userData?.id);
  useTelegramBackButton();

  const getPrize = (rank: number) => {
    const prize = PRIZES.find(p => p.rank === rank);
    return prize ? prize.prize : 0;
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
        <title>Leaderboard</title>
      </Helmet>

      <div className="max-w-md mx-auto px-5 pt-16">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Referral Leaderboard</h1>
              <p className="text-muted-foreground text-sm">Top 5 referrers win prizes</p>
            </div>
          </FadeUp>

          {/* Prize Pool */}
          <FadeUp>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">Prize Distribution</h2>
              <div className="space-y-2">
                {PRIZES.map((item) => (
                  <div 
                    key={item.rank}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.rank === 1 ? '1st' : item.rank === 2 ? '2nd' : item.rank === 3 ? '3rd' : `${item.rank}th`} Place
                    </span>
                    <span className={`font-bold ${item.rank <= 3 ? 'text-primary' : 'text-foreground'}`}>
                      ${item.prize}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Your Position */}
          {userRank && (
            <FadeUp>
              <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                <h2 className="text-sm font-semibold text-foreground mb-3">Your Position</h2>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {userRank.rank > 0 ? `#${userRank.rank}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Rank</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{userRank.referral_count}</p>
                    <p className="text-xs text-muted-foreground">Referrals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {getPrize(userRank.rank) > 0 ? `$${getPrize(userRank.rank)}` : '-'}
                    </p>
                    <p className="text-xs text-muted-foreground">Prize</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          )}

          {/* Leaderboard */}
          <FadeUp>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">Top Referrers</h2>
              
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No participants yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry, index) => {
                    const rank = index + 1;
                    const prize = getPrize(rank);
                    const isCurrentUser = userData?.id === entry.user_id;
                    
                    return (
                      <motion.div
                        key={entry.user_id}
                        className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/30' 
                            : rank <= 3 
                              ? 'bg-muted/50' 
                              : 'bg-background'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            rank === 1 
                              ? 'bg-amber-500/20 text-amber-500' 
                              : rank === 2 
                                ? 'bg-slate-400/20 text-slate-400'
                                : rank === 3
                                  ? 'bg-orange-500/20 text-orange-500'
                                  : 'bg-muted text-muted-foreground'
                          }`}>
                            {rank}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {entry.username || entry.first_name || `User ${entry.user_id.slice(0, 6)}`}
                            </p>
                            <p className="text-xs text-muted-foreground">{entry.referral_count} referrals</p>
                          </div>
                        </div>
                        {prize > 0 && (
                          <span className="text-sm font-bold text-primary">${prize}</span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Leaderboard;
