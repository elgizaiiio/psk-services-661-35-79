import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy, Medal } from "lucide-react";
import { useBoltLeaderboard } from "@/hooks/useBoltLeaderboard";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useBoltMining } from "@/hooks/useBoltMining";

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
          <p className="text-muted-foreground text-sm">Loading leaderboard...</p>
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
          <Button onClick={clearError} className="w-full bg-primary text-primary-foreground">
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
        return <Trophy className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-500" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground w-5 text-center">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 2:
        return 'bg-gray-300/10 border-gray-300/30';
      case 3:
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-card border-border';
    }
  };

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Top BOLT miners</p>
          </div>

          {/* Leaderboard List */}
          {leaderboard.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Crown className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No miners yet</h3>
              <p className="text-sm text-muted-foreground">Be the first to start mining!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map(entry => {
                const name = entry.first_name || entry.telegram_username || 'Anonymous';
                const initials = name.charAt(0).toUpperCase();
                const isCurrentUser = boltUser && entry.id === boltUser.id;
                const rank = entry.rank || 0;
                
                return (
                  <div 
                    key={entry.id} 
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${getRankBg(rank)} ${isCurrentUser ? 'ring-1 ring-primary' : ''}`}
                  >
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 border-2 border-border">
                      <AvatarImage src={entry.photo_url || undefined} alt={name} />
                      <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Name & Badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm truncate">{name}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Balance */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-foreground text-sm">
                        {(entry.token_balance || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-primary">BOLT</p>
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
