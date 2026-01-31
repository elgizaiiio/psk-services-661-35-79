import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { LeaderboardEntry } from '@/hooks/useBoltTown';
import { cn } from '@/lib/utils';

interface BoltTownLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  myUserId?: string;
  myRank?: number | null;
  myPoints?: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
    case 2:
      return 'from-gray-300/20 to-gray-400/10 border-gray-300/30';
    case 3:
      return 'from-amber-500/20 to-amber-600/10 border-amber-500/30';
    default:
      return 'from-background to-background border-border';
  }
};

export const BoltTownLeaderboard: React.FC<BoltTownLeaderboardProps> = ({
  leaderboard,
  myUserId,
  myRank,
  myPoints,
}) => {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
        <span>Rank</span>
        <span>Player</span>
        <span>Points</span>
      </div>

      {/* My Position (if not in top 50) */}
      {myUserId && myRank && myRank > 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-bold text-primary">#{myRank}</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-primary">You</span>
            </div>
            <span className="font-bold text-primary">{myPoints || 0}</span>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-1.5 max-h-80 overflow-y-auto">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No participants yet today</p>
            <p className="text-xs">Be the first to earn points!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => {
            const isMe = entry.user_id === myUserId;
            const displayName = entry.telegram_username
              ? `@${entry.telegram_username}`
              : entry.first_name || 'Anonymous';

            return (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                className={cn(
                  'p-3 rounded-xl border bg-gradient-to-r transition-all',
                  getRankColor(entry.rank),
                  isMe && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 text-center">
                      {getRankIcon(entry.rank) || (
                        <span className="text-sm font-medium text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className={cn(
                      'font-medium text-sm truncate max-w-[120px]',
                      isMe && 'text-primary'
                    )}>
                      {isMe ? 'You' : displayName}
                    </span>
                  </div>
                  <span className={cn(
                    'font-bold',
                    entry.rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {entry.total_points}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
