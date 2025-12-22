import React from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="simple-loader mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20 flex items-center justify-center min-h-screen">
          <Card className="p-6 text-center border-destructive/20 bg-card w-full">
            <Trophy className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={clearError} variant="outline" className="border-border">Try Again</Button>
          </Card>
        </div>
      </main>
    );
  }

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

      <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
            <p className="text-muted-foreground text-sm">Top BOLT miners</p>
          </div>

          {/* Leaderboard */}
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No users yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Be the first to start mining!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map(entry => {
                  const name = entry.first_name || entry.telegram_username || 'Unknown';
                  const initials = entry.first_name?.[0] || entry.telegram_username?.[0] || 'U';
                  const isCurrentUser = boltUser && entry.id === boltUser.id;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className={`flex items-center gap-3 p-2 transition-colors hover:bg-muted/30 rounded-lg ${isCurrentUser ? 'bg-primary/5' : ''}`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-8">
                        {entry.rank! <= 3 ? (
                          entry.rank === 1 ? <Crown className="w-4 h-4 text-yellow-400" /> : 
                          entry.rank === 2 ? <Trophy className="w-4 h-4 text-gray-300" /> : 
                          <Medal className="w-4 h-4 text-amber-500" />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">{entry.rank}</span>
                        )}
                      </div>
                      
                      {/* Avatar */}
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.photo_url} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs bg-primary/20 text-primary px-1.5 py-0.5">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Balance */}
                      <div className="text-right">
                        <p className="font-semibold text-primary text-sm">
                          {entry.token_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Leaderboard;
