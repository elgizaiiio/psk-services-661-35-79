import React from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Trophy, Medal, Star, RefreshCw, Zap, TrendingUp, Award, Users } from "lucide-react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import SnowLoaderAnimation from "@/components/animations/SnowLoaderAnimation";
const Leaderboard: React.FC = () => {
  const {
    user: tgUser
  } = useTelegramAuth();
  const {
    user: vmUser
  } = useViralMining(tgUser);
  const {
    leaderboard,
    loading,
    error,
    refreshLeaderboard,
    clearError
  } = useLeaderboard();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-lg" />;
      case 2:
        return <Trophy className="w-6 h-6 text-gray-300 drop-shadow-lg" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-500 drop-shadow-lg" />;
      default:
        return <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
          <span className="text-sm font-bold text-background">{rank}</span>
        </div>;
    }
  };
  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-background";
    } else if (rank <= 10) {
      return "bg-gradient-to-r from-primary to-secondary text-background";
    }
    return "bg-muted text-muted-foreground";
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Leaderboard",
    description: "View top VIRAL miners and compare your ranking with other players.",
    url: currentUrl
  };
  if (loading) {
    return <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </main>;
  }
  if (error) {
    return <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20 flex items-center justify-center min-h-screen">
          <Card className="p-6 text-center border-destructive/20 bg-destructive/5 w-full">
            <Trophy className="w-12 h-12 text-destructive mx-auto mb-4 opacity-50" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={clearError} variant="outline">Try Again</Button>
          </Card>
        </div>
      </main>;
  }
  return <>
      <Helmet>
        <title>Leaderboard | Top Miners</title>
        <meta name="description" content="View top VIRAL miners and compare your ranking with other players." />
        <meta property="og:title" content="Leaderboard | Top Miners" />
        <meta property="og:description" content="View top VIRAL miners and compare your ranking with other players." />
        <meta property="og:url" content={currentUrl} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="min-h-screen bg-background">
        <div className="container max-w-md mx-auto p-4 pb-20">
          
          {/* Snow Animation */}
          <SnowLoaderAnimation />
          
          {/* Header */}
          <div className="text-center mb-6">
          </div>

          {/* Leaderboard */}
          <div className="space-y-2">
            {leaderboard.length === 0 ? <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No users yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Be the first to start mining!</p>
              </div> : <div className="space-y-1">
                {leaderboard.map(entry => {
              const name = entry.first_name || entry.telegram_username || 'Unknown';
              const initials = entry.first_name?.[0] || entry.telegram_username?.[0] || 'U';
              const isCurrentUser = vmUser && entry.id === vmUser.id;
              const isTopThree = entry.rank! <= 3;
              return <div key={entry.id} className={`flex items-center gap-3 p-2 transition-colors hover:bg-muted/30 rounded-lg ${isCurrentUser ? 'bg-primary/5' : ''}`}>
                      {/* Rank */}
                      <div className="flex items-center justify-center w-8">
                        {entry.rank! <= 3 ? entry.rank === 1 ? <Crown className="w-4 h-4 text-yellow-400" /> : entry.rank === 2 ? <Trophy className="w-4 h-4 text-gray-300" /> : <Medal className="w-4 h-4 text-amber-500" /> : <span className="text-xs font-medium text-muted-foreground">{entry.rank}</span>}
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
                          {isCurrentUser && <Badge variant="secondary" className="text-xs bg-primary/20 text-primary px-1.5 py-0.5">
                              You
                            </Badge>}
                        </div>
                        
                      </div>
                      
                      {/* Balance */}
                      <div className="text-right">
                        <p className="font-semibold text-primary text-sm">
                          {entry.token_balance.toFixed(2)}
                        </p>
                        
                      </div>
                    </div>;
            })}
              </div>}
          </div>
        </div>
      </main>
    </>;
};
export default Leaderboard;