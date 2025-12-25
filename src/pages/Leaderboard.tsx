import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Crown, 
  Trophy, 
  Medal, 
  Zap, 
  TrendingUp, 
  Users, 
  Star,
  Sparkles,
  Target,
  ArrowUp,
  Flame,
  Gift,
  Clock,
  UserPlus,
  Calendar
} from "lucide-react";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useBoltLeaderboard } from '@/hooks/useBoltLeaderboard';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Floating particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-yellow-500/30 rounded-full"
        initial={{ 
          x: Math.random() * 400,
          y: Math.random() * 300,
          opacity: 0 
        }}
        animate={{ 
          y: [null, -80],
          opacity: [0, 0.8, 0],
        }}
        transition={{ 
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2
        }}
      />
    ))}
  </div>
);

// Rank rewards data
const RANK_REWARDS = [
  { rank: 1, reward: 10000, icon: Crown, color: 'from-yellow-400 to-amber-500', label: 'Champion' },
  { rank: 2, reward: 5000, icon: Trophy, color: 'from-gray-300 to-gray-400', label: 'Elite' },
  { rank: 3, reward: 2500, icon: Medal, color: 'from-amber-500 to-orange-600', label: 'Pro' },
  { rank: '4-10', reward: 1000, icon: Star, color: 'from-purple-500 to-pink-500', label: 'Top 10' },
  { rank: '11-50', reward: 500, icon: Target, color: 'from-blue-500 to-cyan-500', label: 'Top 50' },
];

type TimeFilter = 'all' | 'week' | 'month';
type ViewFilter = 'all' | 'friends';

const Leaderboard: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser } = useBoltMining(tgUser);
  const { leaderboard, loading, error, clearError } = useBoltLeaderboard();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [showRewards, setShowRewards] = useState(false);

  // Find current user's rank
  const currentUserRank = useMemo(() => {
    if (!boltUser) return null;
    const userEntry = leaderboard.find(e => e.id === boltUser.id);
    return userEntry?.rank || null;
  }, [leaderboard, boltUser]);

  // Filter leaderboard based on time (simulated - in production would be server-side)
  const filteredLeaderboard = useMemo(() => {
    let filtered = [...leaderboard];
    
    // In a real app, time filtering would be done server-side
    // This is a simulation for UI purposes
    if (timeFilter === 'week') {
      // Simulate weekly data (shuffle slightly for demo)
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.8));
    } else if (timeFilter === 'month') {
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.9));
    }
    
    // For friends filter - in production this would use referrals table
    // For now, show top referrers as "friends" simulation
    if (viewFilter === 'friends' && boltUser) {
      // Filter to show only users with referrals (simulating friend network)
      filtered = filtered.filter(user => 
        (user.total_referrals || 0) > 0 || user.id === boltUser.id
      ).slice(0, 10);
    }
    
    return filtered;
  }, [leaderboard, timeFilter, viewFilter, boltUser]);

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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/30"
          >
            <Crown className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-muted-foreground text-sm">Loading rankings...</p>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} className="w-full bg-primary text-primary-foreground rounded-full">
            Try Again
          </Button>
        </motion.div>
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
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { color: 'from-yellow-500 to-amber-500', label: 'Champion', icon: Crown };
    if (rank === 2) return { color: 'from-gray-400 to-gray-500', label: 'Elite', icon: Trophy };
    if (rank === 3) return { color: 'from-amber-600 to-orange-600', label: 'Pro', icon: Medal };
    if (rank <= 10) return { color: 'from-purple-500 to-pink-500', label: 'Top 10', icon: Star };
    if (rank <= 50) return { color: 'from-blue-500 to-cyan-500', label: 'Top 50', icon: Target };
    return { color: 'from-primary to-purple-500', label: 'Miner', icon: Zap };
  };

  // Get top 3 for podium
  const topThree = filteredLeaderboard.slice(0, 3);
  const restOfLeaderboard = filteredLeaderboard.slice(3);

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

      <main className="min-h-screen bg-background pb-24 relative">
        <FloatingParticles />
        
        <div className="max-w-md mx-auto px-4 py-6 relative z-10">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Crown className="w-8 h-8 text-yellow-500" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Leaderboard
              </h1>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                <Crown className="w-8 h-8 text-yellow-500" />
              </motion.div>
            </div>
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Users className="w-4 h-4" />
              {filteredLeaderboard.length} Active Miners
            </p>
          </motion.div>

          {/* View Filter Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
              <TabsList className="w-full grid grid-cols-2 h-12 bg-muted/50 rounded-xl p-1">
                <TabsTrigger 
                  value="all"
                  className="rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  All Miners
                </TabsTrigger>
                <TabsTrigger 
                  value="friends"
                  className="rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Friends
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Time Filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mb-4 overflow-x-auto pb-1"
          >
            {[
              { value: 'all', label: 'All Time', icon: Sparkles },
              { value: 'month', label: 'This Month', icon: Calendar },
              { value: 'week', label: 'This Week', icon: Clock },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeFilter(filter.value as TimeFilter)}
                className={`flex-1 rounded-xl text-xs ${
                  timeFilter === filter.value 
                    ? 'bg-gradient-to-r from-primary to-purple-500 border-0' 
                    : 'border-border'
                }`}
              >
                <filter.icon className="w-3 h-3 mr-1" />
                {filter.label}
              </Button>
            ))}
          </motion.div>

          {/* Rank Rewards Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <Card 
              className="p-3 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border-yellow-500/30 cursor-pointer"
              onClick={() => setShowRewards(!showRewards)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center"
                  >
                    <Gift className="w-5 h-5 text-white" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-foreground text-sm">Weekly Rewards</p>
                    <p className="text-xs text-muted-foreground">Tap to see prizes</p>
                  </div>
                </div>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  <Trophy className="w-3 h-3 mr-1" />
                  20K+ BOLT
                </Badge>
              </div>

              {/* Expandable rewards */}
              <AnimatePresence>
                {showRewards && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-2 pt-3 border-t border-yellow-500/20">
                      {RANK_REWARDS.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                              <item.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {typeof item.rank === 'number' ? `Rank #${item.rank}` : `Rank ${item.rank}`}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <img 
                              src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
                              alt="BOLT" 
                              className="w-4 h-4"
                            />
                            <span className="font-bold text-sm text-yellow-500">+{item.reward.toLocaleString()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {/* Your Rank Card */}
          {boltUser && currentUserRank && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-4"
            >
              <Card className="p-4 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 border-primary/30 relative overflow-hidden">
                <motion.div
                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"
                />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRankBadge(currentUserRank).color} flex items-center justify-center shadow-lg`}>
                      <span className="text-xl font-bold text-white">#{currentUserRank}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Your Rank</p>
                      <p className="font-bold text-foreground flex items-center gap-2">
                        {boltUser.first_name || boltUser.telegram_username || 'You'}
                        <Badge className={`bg-gradient-to-r ${getRankBadge(currentUserRank).color} text-white border-0 text-xs`}>
                          {getRankBadge(currentUserRank).label}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-lg font-bold text-primary flex items-center gap-1">
                      <img 
                        src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
                        alt="BOLT" 
                        className="w-5 h-5"
                      />
                      {(boltUser.token_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-2 mb-4"
          >
            <Card className="p-2.5 text-center bg-yellow-500/10 border-yellow-500/20">
              <Crown className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Top Prize</p>
              <p className="font-bold text-yellow-500 text-xs">10K</p>
            </Card>
            <Card className="p-2.5 text-center bg-green-500/10 border-green-500/20">
              <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Total Mined</p>
              <p className="font-bold text-green-500 text-xs">
                {(filteredLeaderboard.reduce((sum, e) => sum + (e.token_balance || 0), 0) / 1000).toFixed(0)}K
              </p>
            </Card>
            <Card className="p-2.5 text-center bg-purple-500/10 border-purple-500/20">
              <Flame className="w-4 h-4 text-purple-500 mx-auto mb-1" />
              <p className="text-[10px] text-muted-foreground">Status</p>
              <p className="font-bold text-purple-500 text-xs">Active</p>
            </Card>
          </motion.div>

          {filteredLeaderboard.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                {viewFilter === 'friends' ? (
                  <UserPlus className="w-10 h-10 text-muted-foreground" />
                ) : (
                  <Crown className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-medium text-foreground mb-1">
                {viewFilter === 'friends' ? 'No friends yet' : 'No miners yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {viewFilter === 'friends' ? 'Invite friends to see them here!' : 'Be the first to start mining!'}
              </p>
              {viewFilter === 'friends' && (
                <Button 
                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500"
                  onClick={() => window.location.href = '/invite'}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite Friends
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Top 3 Podium - Enhanced */}
              {topThree.length >= 3 && viewFilter === 'all' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="mb-4"
                >
                  <Card className="p-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent" />
                    
                    <div className="relative z-10 flex items-end justify-center gap-3 pt-4">
                      {/* 2nd Place */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center mb-2 shadow-lg relative"
                        >
                          <span className="text-lg font-bold text-white">
                            {(topThree[1].first_name || topThree[1].telegram_username || 'A').charAt(0).toUpperCase()}
                          </span>
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">2</span>
                          </div>
                        </motion.div>
                        <Trophy className="w-5 h-5 text-gray-400 mb-1" />
                        <p className="text-xs text-foreground font-medium truncate max-w-[60px] text-center">
                          {topThree[1].first_name || topThree[1].telegram_username || 'Anonymous'}
                        </p>
                        <p className="text-xs font-bold text-gray-500 flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3" />
                          {(topThree[1].token_balance || 0).toLocaleString()}
                        </p>
                        <div className="w-16 h-14 bg-gradient-to-t from-gray-400/30 to-gray-400/10 rounded-t-xl mt-2" />
                      </motion.div>

                      {/* 1st Place */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col items-center -mt-6"
                      >
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <Sparkles className="w-6 h-6 text-yellow-500 mb-1" />
                        </motion.div>
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="w-18 h-18 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-2 shadow-xl shadow-yellow-500/30 relative w-[72px] h-[72px]"
                        >
                          <span className="text-2xl font-bold text-white">
                            {(topThree[0].first_name || topThree[0].telegram_username || 'A').charAt(0).toUpperCase()}
                          </span>
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-lg"
                          >
                            <Crown className="w-4 h-4 text-white" />
                          </motion.div>
                        </motion.div>
                        <Crown className="w-6 h-6 text-yellow-500 mb-1" />
                        <p className="text-sm text-foreground font-bold truncate max-w-[70px] text-center">
                          {topThree[0].first_name || topThree[0].telegram_username || 'Anonymous'}
                        </p>
                        <p className="text-sm font-bold text-yellow-500 flex items-center gap-1 mt-1">
                          <Zap className="w-4 h-4" />
                          {(topThree[0].token_balance || 0).toLocaleString()}
                        </p>
                        <div className="w-20 h-20 bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 rounded-t-xl mt-2" />
                      </motion.div>

                      {/* 3rd Place */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex flex-col items-center"
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1 }}
                          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-2 shadow-lg relative"
                        >
                          <span className="text-lg font-bold text-white">
                            {(topThree[2].first_name || topThree[2].telegram_username || 'A').charAt(0).toUpperCase()}
                          </span>
                          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">3</span>
                          </div>
                        </motion.div>
                        <Medal className="w-5 h-5 text-amber-600 mb-1" />
                        <p className="text-xs text-foreground font-medium truncate max-w-[60px] text-center">
                          {topThree[2].first_name || topThree[2].telegram_username || 'Anonymous'}
                        </p>
                        <p className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                          <Zap className="w-3 h-3" />
                          {(topThree[2].token_balance || 0).toLocaleString()}
                        </p>
                        <div className="w-16 h-10 bg-gradient-to-t from-amber-600/30 to-amber-600/10 rounded-t-xl mt-2" />
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Section Title */}
              {((viewFilter === 'all' && restOfLeaderboard.length > 0) || viewFilter === 'friends') && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-2 mb-3"
                >
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {viewFilter === 'friends' ? (
                      <><UserPlus className="w-3 h-3" /> Your Friends</>
                    ) : (
                      <><Users className="w-3 h-3" /> Other Miners</>
                    )}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </motion.div>
              )}

              {/* Rest of Leaderboard / Friends List */}
              <div className="space-y-2">
                {(viewFilter === 'friends' ? filteredLeaderboard : restOfLeaderboard).map((entry, index) => {
                  const name = entry.first_name || entry.telegram_username || 'Anonymous';
                  const initials = name.charAt(0).toUpperCase();
                  const isCurrentUser = boltUser && entry.id === boltUser.id;
                  const rank = entry.rank || index + (viewFilter === 'friends' ? 1 : 4);
                  
                  return (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.03 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                        isCurrentUser 
                          ? 'bg-gradient-to-r from-primary/20 to-purple-500/10 border-primary/50 shadow-lg shadow-primary/10' 
                          : 'bg-card border-border hover:border-primary/30 hover:shadow-md'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        {getRankIcon(rank)}
                      </div>

                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                        isCurrentUser 
                          ? 'bg-gradient-to-br from-primary to-purple-500' 
                          : 'bg-gradient-to-br from-muted to-muted/80'
                      }`}>
                        <span className={`text-sm font-bold ${isCurrentUser ? 'text-white' : 'text-foreground'}`}>
                          {initials}
                        </span>
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate flex items-center gap-2">
                          {name}
                          {isCurrentUser && (
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              You
                            </Badge>
                          )}
                        </p>
                        {rank <= 10 && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" /> Top 10 Miner
                          </p>
                        )}
                      </div>

                      {/* Balance */}
                      <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <img 
                          src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
                          alt="BOLT" 
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-bold text-foreground">
                          {(entry.token_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Motivation Card */}
          {currentUserRank && currentUserRank > 3 && viewFilter === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6"
            >
              <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <ArrowUp className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Keep Mining!</p>
                    <p className="text-xs text-muted-foreground">
                      You need {((leaderboard[currentUserRank - 2]?.token_balance || 0) - (boltUser?.token_balance || 0)).toLocaleString()} more BOLT to reach rank #{currentUserRank - 1}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default Leaderboard;
