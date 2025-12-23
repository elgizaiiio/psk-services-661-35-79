import React from "react";
import { Helmet } from "react-helmet-async";
import { Crown, Trophy, Medal, Zap } from "lucide-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useBoltLeaderboard } from '@/hooks/useBoltLeaderboard';
import { Button } from "@/components/ui/button";

const Leaderboard: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(tgUser);
  const { leaderboard, loading, error, clearError } = useBoltLeaderboard();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Leaderboard",
    description: "View top BOLT miners and compare your ranking with other players.",
    url: currentUrl
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Crown className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} className="w-full bg-primary text-primary-foreground rounded-full">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">{rank}</span>;
    }
  };

  // Get top 3 for podium
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <>
      <Helmet>
        <title>Leaderboard | Top Miners</title>
        <meta name="description" content="View top BOLT miners and compare your ranking with other players." />
        <meta property="og:title" content="Leaderboard | Top Miners" />
        <meta property="og:description" content="View top BOLT miners and compare your ranking with other players." />
        <meta property="og:url" content={currentUrl} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-5 py-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Top BOLT miners</p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No miners yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to start mining!</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {topThree.length >= 3 && (
                <div className="flex items-end justify-center gap-2 mb-8">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2 border-2 border-gray-400">
                      <span className="text-lg font-bold text-foreground">
                        {(topThree[1].first_name || topThree[1].telegram_username || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Trophy className="w-5 h-5 text-gray-400 mb-1" />
                    <p className="text-xs text-muted-foreground truncate max-w-16">
                      {topThree[1].first_name || topThree[1].telegram_username || 'Anonymous'}
                    </p>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {(topThree[1].token_balance || 0).toLocaleString()}
                    </p>
                    <div className="w-16 h-16 bg-gray-400/20 rounded-t-lg mt-2" />
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center -mt-4">
                    <div className="w-18 h-18 rounded-full bg-muted flex items-center justify-center mb-2 border-2 border-yellow-400 w-[72px] h-[72px]">
                      <span className="text-xl font-bold text-foreground">
                        {(topThree[0].first_name || topThree[0].telegram_username || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Crown className="w-6 h-6 text-yellow-400 mb-1" />
                    <p className="text-xs text-muted-foreground truncate max-w-20">
                      {topThree[0].first_name || topThree[0].telegram_username || 'Anonymous'}
                    </p>
                    <p className="text-sm font-medium text-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {(topThree[0].token_balance || 0).toLocaleString()}
                    </p>
                    <div className="w-20 h-24 bg-yellow-400/20 rounded-t-lg mt-2" />
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-2 border-2 border-amber-600">
                      <span className="text-lg font-bold text-foreground">
                        {(topThree[2].first_name || topThree[2].telegram_username || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <Medal className="w-5 h-5 text-amber-600 mb-1" />
                    <p className="text-xs text-muted-foreground truncate max-w-16">
                      {topThree[2].first_name || topThree[2].telegram_username || 'Anonymous'}
                    </p>
                    <p className="text-xs font-medium text-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" />
                      {(topThree[2].token_balance || 0).toLocaleString()}
                    </p>
                    <div className="w-16 h-12 bg-amber-600/20 rounded-t-lg mt-2" />
                  </div>
                </div>
              )}

              {/* Rest of Leaderboard */}
              <div className="space-y-2">
                {restOfLeaderboard.map(entry => {
                  const name = entry.first_name || entry.telegram_username || 'Anonymous';
                  const initials = name.charAt(0).toUpperCase();
                  const isCurrentUser = boltUser && entry.id === boltUser.id;
                  const rank = entry.rank || 0;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                        isCurrentUser 
                          ? 'bg-primary/10 border-primary/30' 
                          : 'bg-card border-border'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 flex justify-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-foreground">{initials}</span>
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </p>
                      </div>

                      {/* Balance */}
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          {(entry.token_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* If less than 3 users, show simple list */}
              {topThree.length < 3 && (
                <div className="space-y-2">
                  {leaderboard.map(entry => {
                    const name = entry.first_name || entry.telegram_username || 'Anonymous';
                    const initials = name.charAt(0).toUpperCase();
                    const isCurrentUser = boltUser && entry.id === boltUser.id;
                    const rank = entry.rank || 0;
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                          isCurrentUser 
                            ? 'bg-primary/10 border-primary/30' 
                            : 'bg-card border-border'
                        }`}
                      >
                        <div className="w-8 flex justify-center">
                          {getRankIcon(rank)}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium text-foreground">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {name}
                            {isCurrentUser && <span className="ml-2 text-xs text-primary">(You)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold text-foreground">
                            {(entry.token_balance || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </>
  );
};

export default Leaderboard;
