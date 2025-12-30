import { Trophy, Crown, Medal, Award, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  user_id: string;
  referral_count: number;
  rank: number;
  username: string | null;
  first_name: string | null;
  photo_url: string | null;
}

interface Prize {
  rank: number;
  prize_usd: number;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  prizes: Prize[];
  currentUserId?: string;
}

export const Leaderboard = ({ entries, prizes, currentUserId }: LeaderboardProps) => {
  const getPrize = (rank: number) => {
    const prize = prizes.find(p => p.rank === rank);
    return prize?.prize_usd || 0;
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default:
        return 'bg-card/50 border-border/50';
    }
  };

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No participants yet</p>
        <p className="text-sm text-muted-foreground">Be the first to join!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => {
        const isCurrentUser = entry.user_id === currentUserId;
        const prize = getPrize(entry.rank);

        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm
              ${getRankBg(entry.rank)}
              ${isCurrentUser ? 'ring-2 ring-primary' : ''}
            `}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-8 h-8">
              {entry.rank <= 3 ? (
                getRankIcon(entry.rank)
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  #{entry.rank}
                </span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="w-10 h-10 border-2 border-border">
              <AvatarImage src={entry.photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {entry.first_name?.[0] || entry.username?.[0] || '?'}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {entry.username ? `@${entry.username}` : entry.first_name || 'Anonymous'}
                {isCurrentUser && <span className="text-primary ml-1">(You)</span>}
              </p>
              <p className="text-sm text-muted-foreground">
                {entry.referral_count} referrals
              </p>
            </div>

            {/* Prize */}
            {prize > 0 && (
              <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary">${prize}</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
