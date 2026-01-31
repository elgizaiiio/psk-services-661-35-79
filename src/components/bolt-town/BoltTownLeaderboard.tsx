import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown } from 'lucide-react';
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
      return <Crown className="w-4 h-4 text-yellow-400" />;
    case 2:
      return <Medal className="w-4 h-4 text-gray-300" />;
    case 3:
      return <Medal className="w-4 h-4 text-amber-600" />;
    default:
      return null;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/5 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-300/20 to-gray-400/5 border-gray-300/30';
    case 3:
      return 'bg-gradient-to-r from-amber-500/20 to-amber-600/5 border-amber-500/30';
    default:
      return 'bg-card border-border';
  }
};

const getInitials = (name: string) => {
  return name.slice(0, 2).toUpperCase();
};

const getAvatarColor = (userId: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
  ];
  const index = userId.charCodeAt(0) % colors.length;
  return colors[index];
};

export const BoltTownLeaderboard: React.FC<BoltTownLeaderboardProps> = ({
  leaderboard,
  myUserId,
  myRank,
  myPoints,
}) => {
  return (
    <div className="space-y-2">
      {/* My Position (if not in top 50) */}
      {myUserId && myRank && myRank > 50 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 mb-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              Y
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">You</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">#{myRank}</p>
              <p className="text-sm font-bold text-primary">{myPoints || 0} pts</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Leaderboard List */}
      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No participants yet</p>
          <p className="text-xs">Be the first to earn points!</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {leaderboard.map((entry, index) => {
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
                  'flex items-center gap-3 p-2.5 rounded-xl border transition-all',
                  getRankBg(entry.rank),
                  isMe && 'ring-1 ring-primary'
                )}
              >
                {/* Rank */}
                <div className="w-6 flex justify-center">
                  {getRankIcon(entry.rank) || (
                    <span className="text-xs font-medium text-muted-foreground">
                      {entry.rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                  isMe ? 'bg-primary' : getAvatarColor(entry.user_id)
                )}>
                  {isMe ? 'Y' : getInitials(displayName)}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isMe && 'text-primary'
                  )}>
                    {isMe ? 'You' : displayName}
                  </p>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-bold',
                    entry.rank <= 3 ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {entry.total_points}
                  </p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
