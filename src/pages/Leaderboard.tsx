import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useBoltLeaderboard } from '@/hooks/useBoltLeaderboard';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type TimeFilter = 'all' | 'week' | 'month';

const Leaderboard: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(tgUser);
  const { leaderboard, loading, error, clearError } = useBoltLeaderboard();
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Find current user's rank
  const currentUserRank = useMemo(() => {
    if (!boltUser) return null;
    const userEntry = leaderboard.find(e => e.id === boltUser.id);
    return userEntry?.rank || null;
  }, [leaderboard, boltUser]);

  // Filter leaderboard
  const filteredLeaderboard = useMemo(() => {
    let filtered = [...leaderboard];
    
    if (timeFilter === 'week') {
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.8));
    } else if (timeFilter === 'month') {
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.9));
    }
    
    return filtered;
  }, [leaderboard, timeFilter]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent mx-auto animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError}>Try Again</Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Leaderboard | Bolt</title>
        <meta name="description" content="View top BOLT miners rankings" />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-5 py-6">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{filteredLeaderboard.length} miners</p>
          </div>

          {/* Time Filter */}
          <div className="flex gap-2 mb-6">
            {[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'Month' },
              { value: 'week', label: 'Week' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setTimeFilter(filter.value as TimeFilter)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeFilter === filter.value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card border border-border text-muted-foreground'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Your Rank */}
          {boltUser && currentUserRank && (
            <Card className="p-4 mb-6 bg-primary/5 border-primary/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold text-foreground">#{currentUserRank}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold text-primary">
                    {(boltUser.token_balance || 0).toLocaleString()} BOLT
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Leaderboard List */}
          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No miners yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLeaderboard.map((entry, index) => {
                const name = entry.first_name || entry.telegram_username || 'Anonymous';
                const initials = name.charAt(0).toUpperCase();
                const isCurrentUser = boltUser && entry.id === boltUser.id;
                const rank = entry.rank || index + 1;
                
                const getRankBg = (r: number) => {
                  if (r === 1) return 'bg-amber-500';
                  if (r === 2) return 'bg-gray-400';
                  if (r === 3) return 'bg-amber-700';
                  return 'bg-muted';
                };

                const getRankText = (r: number) => {
                  if (r <= 3) return 'text-white';
                  return 'text-muted-foreground';
                };
                
                return (
                  <div 
                    key={entry.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isCurrentUser 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-card border border-border'
                    }`}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${getRankBg(rank)} ${getRankText(rank)}`}>
                      {rank}
                    </div>
                    
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-foreground">{initials}</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                        {name} {isCurrentUser && '(You)'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Power: {entry.mining_power || 1}x
                      </p>
                    </div>
                    
                    {/* Balance */}
                    <div className="text-right">
                      <p className="font-bold text-sm text-foreground">
                        {(entry.token_balance || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">BOLT</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
    </>
  );
};

export default Leaderboard;
