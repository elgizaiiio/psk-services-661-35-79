import { Trophy, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import { useContestLeaderboard } from '@/hooks/useContestLeaderboard';

interface ContestBannerProps {
  userId?: string;
  compact?: boolean;
}

export const ContestBanner = ({ userId, compact = false }: ContestBannerProps) => {
  const { contest, userRank, loading } = useContestLeaderboard(userId);

  if (loading || !contest) return null;

  if (compact) {
    return (
      <Link to="/contest">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 rounded-xl p-3 mb-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">$10,000 Contest</span>
              {userRank && userRank.rank > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                  #{userRank.rank}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CountdownTimer endDate={contest.end_date} compact />
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link to="/contest">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 border border-primary/40 rounded-2xl p-5"
      >
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-1">
                Referral Championship
                <Sparkles className="w-4 h-4 text-yellow-500" />
              </h3>
              <p className="text-sm text-muted-foreground">Win up to $3,000 in TON!</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">$10,000</p>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
            </div>
            
            {userRank && userRank.rank > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold">#{userRank.rank}</p>
                <p className="text-xs text-muted-foreground">Your Rank</p>
              </div>
            )}

            <div className="text-right">
              <CountdownTimer endDate={contest.end_date} compact />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-center mt-4 text-primary text-sm font-medium">
            View Leaderboard <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};
