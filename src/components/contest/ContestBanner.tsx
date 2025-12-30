import { Link } from 'react-router-dom';
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
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-foreground">$10,000 Contest</p>
              {userRank && userRank.rank > 0 && (
                <p className="text-xs text-muted-foreground">Your rank: #{userRank.rank}</p>
              )}
            </div>
            <CountdownTimer endDate={contest.end_date} compact />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to="/contest">
      <div className="p-5 rounded-2xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground">Referral Contest</h3>
            <p className="text-sm text-muted-foreground">Win up to $3,000 in TON</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">$10,000</p>
            <p className="text-xs text-muted-foreground">Prize Pool</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {userRank && userRank.rank > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-lg font-semibold text-foreground">#{userRank.rank}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">Join to compete</p>
            </div>
          )}

          <div className="text-right">
            <p className="text-sm text-muted-foreground">Ends in</p>
            <CountdownTimer endDate={contest.end_date} compact />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <p className="text-sm text-primary font-medium">View Leaderboard</p>
        </div>
      </div>
    </Link>
  );
};