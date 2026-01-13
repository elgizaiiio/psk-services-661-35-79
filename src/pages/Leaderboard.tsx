import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Loader2, Trophy, Medal, Award } from 'lucide-react';
import { PageWrapper, StaggerContainer, FadeUp, ScaleIn } from '@/components/ui/motion-wrapper';
import { UsdtIcon } from '@/components/ui/currency-icons';

interface LeaderboardEntry {
  id: string;
  telegram_username: string | null;
  first_name: string | null;
  usdt_balance: number;
}

const PRIZES = [
  { rank: 1, prize: 50, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/20' },
  { rank: 2, prize: 30, icon: Medal, color: 'text-slate-400', bg: 'bg-slate-400/20' },
  { rank: 3, prize: 15, icon: Award, color: 'text-orange-500', bg: 'bg-orange-500/20' },
  { rank: 4, prize: 5 },
  { rank: 5, prize: 3 },
];

const Leaderboard = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: userData } = useBoltMining(tgUser);
  useTelegramBackButton();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [userData?.id]);

  const fetchLeaderboard = async () => {
    try {
      // Fetch top users by USDT balance
      const { data, error } = await supabase
        .from('bolt_users')
        .select('id, telegram_username, first_name, usdt_balance')
        .order('usdt_balance', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLeaderboard(data || []);

      // Calculate user rank
      if (userData?.id && data) {
        const rank = data.findIndex(u => u.id === userData.id);
        setUserRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrize = (rank: number) => {
    const prize = PRIZES.find(p => p.rank === rank);
    return prize?.prize || 0;
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
        <title>Top Earners</title>
      </Helmet>

      <div className="max-w-md mx-auto px-5 pt-10">
        <StaggerContainer className="space-y-5">
          
          {/* Header */}
          <FadeUp>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Top Earners</h1>
              <p className="text-sm text-muted-foreground mt-1">Highest USDT balances</p>
            </div>
          </FadeUp>

          {/* Prize Pool */}
          <FadeUp delay={0.1}>
            <div className="p-4 rounded-2xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-3">Prize Distribution</p>
              <div className="flex justify-between">
                {PRIZES.slice(0, 5).map((item) => (
                  <div key={item.rank} className="text-center">
                    <p className="text-lg font-bold text-foreground">${item.prize}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.rank === 1 ? '1st' : item.rank === 2 ? '2nd' : item.rank === 3 ? '3rd' : `${item.rank}th`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Your Position */}
          {userRank && userRank <= 50 && (
            <FadeUp delay={0.15}>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      #{userRank}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">Your Rank</p>
                      <p className="text-xs text-muted-foreground">
                        {getPrize(userRank) > 0 ? `Prize: $${getPrize(userRank)}` : 'Keep earning!'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <UsdtIcon size={16} />
                    <span className="text-sm font-semibold text-foreground">
                      {(userData as any)?.usdt_balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </FadeUp>
          )}

          {/* Leaderboard List */}
          <FadeUp delay={0.2}>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No data yet</p>
                </div>
              ) : (
                leaderboard.slice(0, 20).map((entry, index) => {
                  const rank = index + 1;
                  const prize = getPrize(rank);
                  const isCurrentUser = userData?.id === entry.id;
                  const prizeInfo = PRIZES.find(p => p.rank === rank);
                  
                  return (
                    <ScaleIn key={entry.id} delay={0.05 * index}>
                      <motion.div
                        className={`flex items-center justify-between p-3 rounded-xl ${
                          isCurrentUser 
                            ? 'bg-primary/10 border border-primary/30' 
                            : 'bg-card border border-border'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="flex items-center gap-3">
                          {prizeInfo?.icon ? (
                            <div className={`w-9 h-9 rounded-xl ${prizeInfo.bg} flex items-center justify-center`}>
                              <prizeInfo.icon className={`w-4 h-4 ${prizeInfo.color}`} />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
                              <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {entry.telegram_username || entry.first_name || `User ${entry.id.slice(0, 6)}`}
                            </p>
                            {prize > 0 && (
                              <p className="text-[10px] text-primary font-medium">Prize: ${prize}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <UsdtIcon size={14} />
                          <span className="text-sm font-semibold text-foreground">
                            {entry.usdt_balance?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      </motion.div>
                    </ScaleIn>
                  );
                })
              )}
            </div>
          </FadeUp>

        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Leaderboard;