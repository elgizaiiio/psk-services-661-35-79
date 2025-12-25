import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useBoltLeaderboard } from '@/hooks/useBoltLeaderboard';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

// Mock performance history data (in production, fetch from database)
const generatePerformanceHistory = (currentRank: number) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, index) => ({
    day,
    rank: Math.max(1, currentRank + Math.floor(Math.random() * 10) - 5),
    balance: Math.floor(Math.random() * 5000) + 1000
  }));
};

// Rank rewards data
const RANK_REWARDS = [
  { rank: 1, reward: 10000, label: 'Champion', color: '#F59E0B' },
  { rank: 2, reward: 5000, label: 'Elite', color: '#9CA3AF' },
  { rank: 3, reward: 2500, label: 'Pro', color: '#D97706' },
  { rank: '4-10', reward: 1000, label: 'Top 10', color: '#8B5CF6' },
  { rank: '11-50', reward: 500, label: 'Top 50', color: '#3B82F6' },
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

  // Performance history for chart
  const performanceHistory = useMemo(() => {
    return generatePerformanceHistory(currentUserRank || 50);
  }, [currentUserRank]);

  // Filter leaderboard
  const filteredLeaderboard = useMemo(() => {
    let filtered = [...leaderboard];
    
    if (timeFilter === 'week') {
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.8));
    } else if (timeFilter === 'month') {
      filtered = filtered.slice(0, Math.ceil(filtered.length * 0.9));
    }
    
    if (viewFilter === 'friends' && boltUser) {
      filtered = filtered.filter(user => 
        (user.total_referrals || 0) > 0 || user.id === boltUser.id
      ).slice(0, 10);
    }
    
    return filtered;
  }, [leaderboard, timeFilter, viewFilter, boltUser]);

  const topThree = filteredLeaderboard.slice(0, 3);
  const restOfLeaderboard = filteredLeaderboard.slice(3);

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'from-yellow-500 to-amber-600';
    if (rank === 2) return 'from-gray-400 to-gray-500';
    if (rank === 3) return 'from-amber-600 to-orange-700';
    return 'from-primary/80 to-purple-600';
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent mx-auto"
          />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </motion.div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} className="w-full rounded-full">
            Try Again
          </Button>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>Leaderboard | Rankings</title>
        <meta name="description" content="View top BOLT miners and your ranking history." />
      </Helmet>

      <main className="min-h-screen bg-background pb-24">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredLeaderboard.length} miners competing
            </p>
          </motion.div>

          {/* View Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
              <TabsList className="w-full grid grid-cols-2 h-11 bg-muted rounded-xl p-1">
                <TabsTrigger 
                  value="all"
                  className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  All Miners
                </TabsTrigger>
                <TabsTrigger 
                  value="friends"
                  className="rounded-lg text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Friends
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>

          {/* Time Filter */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2 mb-5"
          >
            {[
              { value: 'all', label: 'All Time' },
              { value: 'month', label: 'Month' },
              { value: 'week', label: 'Week' },
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeFilter(filter.value as TimeFilter)}
                className={`flex-1 rounded-lg text-xs h-9 ${
                  timeFilter === filter.value ? 'bg-primary' : 'bg-muted'
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </motion.div>

          {/* Your Rank & Performance Card */}
          {boltUser && currentUserRank && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-5"
            >
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Your Rank</p>
                    <p className="text-3xl font-bold text-foreground">#{currentUserRank}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-xl font-bold text-primary">
                      {(boltUser.token_balance || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Performance Chart */}
                <div className="h-24 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceHistory}>
                      <defs>
                        <linearGradient id="rankGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        reversed 
                        hide 
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value: number) => [`#${value}`, 'Rank']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rank" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fill="url(#rankGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Your rank history this week
                </p>
              </Card>
            </motion.div>
          )}

          {/* Weekly Rewards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-5"
          >
            <Card 
              className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setShowRewards(!showRewards)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-foreground">Weekly Rewards</p>
                  <p className="text-xs text-muted-foreground">Tap to view prizes</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  20K+ BOLT
                </Badge>
              </div>

              <AnimatePresence>
                {showRewards && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border space-y-2">
                      {RANK_REWARDS.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-1.5"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: item.color }}
                            >
                              {typeof item.rank === 'number' ? `#${item.rank}` : item.rank}
                            </div>
                            <span className="text-sm text-foreground">{item.label}</span>
                          </div>
                          <span className="font-bold text-sm text-primary">
                            +{item.reward.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>

          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                {viewFilter === 'friends' ? 'No friends yet' : 'No miners yet'}
              </p>
              {viewFilter === 'friends' && (
                <Button 
                  className="mt-4"
                  onClick={() => window.location.href = '/invite'}
                >
                  Invite Friends
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Top 3 Podium - Minimal Design */}
              {topThree.length >= 3 && viewFilter === 'all' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-5"
                >
                  <div className="flex items-end justify-center gap-2 px-2">
                    {/* 2nd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRankStyle(2)} flex items-center justify-center mb-2`}>
                        <span className="text-lg font-bold text-white">
                          {(topThree[1].first_name || topThree[1].telegram_username || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate max-w-full text-center">
                        {topThree[1].first_name || topThree[1].telegram_username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(topThree[1].token_balance || 0).toLocaleString()}
                      </p>
                      <div className="w-full h-16 bg-muted rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-2xl font-bold text-muted-foreground">2</span>
                      </div>
                    </div>

                    {/* 1st Place */}
                    <div className="flex-1 flex flex-col items-center -mt-4">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getRankStyle(1)} flex items-center justify-center mb-2 shadow-lg`}>
                        <span className="text-2xl font-bold text-white">
                          {(topThree[0].first_name || topThree[0].telegram_username || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate max-w-full text-center">
                        {topThree[0].first_name || topThree[0].telegram_username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-primary font-medium">
                        {(topThree[0].token_balance || 0).toLocaleString()}
                      </p>
                      <div className="w-full h-24 bg-primary/20 rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">1</span>
                      </div>
                    </div>

                    {/* 3rd Place */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRankStyle(3)} flex items-center justify-center mb-2`}>
                        <span className="text-lg font-bold text-white">
                          {(topThree[2].first_name || topThree[2].telegram_username || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground truncate max-w-full text-center">
                        {topThree[2].first_name || topThree[2].telegram_username || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(topThree[2].token_balance || 0).toLocaleString()}
                      </p>
                      <div className="w-full h-12 bg-muted rounded-t-lg mt-2 flex items-center justify-center">
                        <span className="text-xl font-bold text-muted-foreground">3</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Leaderboard List */}
              <div className="space-y-2">
                {(viewFilter === 'friends' ? filteredLeaderboard : restOfLeaderboard).map((entry, index) => {
                  const name = entry.first_name || entry.telegram_username || 'Anonymous';
                  const initials = name.charAt(0).toUpperCase();
                  const isCurrentUser = boltUser && entry.id === boltUser.id;
                  const rank = entry.rank || index + (viewFilter === 'friends' ? 1 : 4);
                  
                  return (
                    <motion.div 
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.02 }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isCurrentUser 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 text-center">
                        <span className="text-sm font-bold text-muted-foreground">
                          {rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrentUser 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted-foreground/20 text-foreground'
                      }`}>
                        <span className="text-sm font-semibold">{initials}</span>
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
                      <div className="text-right">
                        <span className="text-sm font-semibold text-foreground">
                          {(entry.token_balance || 0).toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {/* Progress to next rank */}
          {currentUserRank && currentUserRank > 1 && viewFilter === 'all' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5"
            >
              <Card className="p-4">
                <p className="text-sm font-medium text-foreground mb-2">Progress to Rank #{currentUserRank - 1}</p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Need {((leaderboard[currentUserRank - 2]?.token_balance || 0) - (boltUser?.token_balance || 0)).toLocaleString()} more BOLT
                </p>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </>
  );
};

export default Leaderboard;
