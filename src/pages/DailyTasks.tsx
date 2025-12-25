import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Clock, Zap, Flame, Users, Trophy, Sparkles, Send, BarChart, Star, RefreshCw, Crown, Rocket, Medal, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  send: <Send className="w-5 h-5" />,
  'bar-chart': <BarChart className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />
};

// Floating particles component
const FloatingParticles = () => <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(15)].map((_, i) => <motion.div key={i} className="absolute w-2 h-2 bg-primary/30 rounded-full" initial={{
    x: Math.random() * 400,
    y: Math.random() * 200,
    opacity: 0
  }} animate={{
    y: [null, -100],
    opacity: [0, 0.6, 0]
  }} transition={{
    duration: 3 + Math.random() * 2,
    repeat: Infinity,
    delay: Math.random() * 2
  }} />)}
  </div>;
const DailyTasks = () => {
  const navigate = useNavigate();
  const {
    user: telegramUser
  } = useTelegramAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [streak, setStreak] = useState(0);

  // Get user ID from telegram user
  useEffect(() => {
    const fetchUserId = async () => {
      if (!telegramUser) return;
      const {
        data
      } = await supabase.from('bolt_users').select('id').eq('telegram_id', telegramUser.id).maybeSingle();
      if (data) {
        setUserId(data.id);
        // Fetch streak
        const {
          data: streakData
        } = await supabase.from('bolt_user_streaks').select('current_streak').eq('user_id', data.id).maybeSingle();
        if (streakData) setStreak(streakData.current_streak);
      }
    };
    fetchUserId();
  }, [telegramUser]);
  const {
    tasks,
    loading,
    completedCount,
    totalCount,
    totalRewards,
    todayEarned,
    completeTask,
    refreshTasks
  } = useDailyTasks(userId);

  // Calculate time until reset (midnight UTC)
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor(diff % (1000 * 60 * 60) / (1000 * 60));
      const seconds = Math.floor(diff % (1000 * 60) / 1000);
      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Show celebration when all tasks completed
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [completedCount, totalCount]);
  const handleCompleteTask = async (taskId: string, requiredAction: string | null) => {
    // Handle navigation for certain tasks
    const navigationTasks: Record<string, string> = {
      'visit_achievements': '/achievements',
      'view_leaderboard': '/leaderboard',
      'start_mining': '/',
      'invite_friend': '/invite',
      'lucky_spin': '/slots'
    };
    if (requiredAction && navigationTasks[requiredAction]) {
      navigate(navigationTasks[requiredAction]);
    }
    const result = await completeTask(taskId);
    if (result.success) {
      toast.success(`🎉 +${result.reward} VIRAL!`);
    } else {
      toast.error(result.error || 'Failed to complete task');
    }
  };
  const progress = totalCount > 0 ? completedCount / totalCount * 100 : 0;
  return <main className="min-h-screen bg-background pb-24 relative">
      <Helmet>
        <title>Daily Tasks | VIRAL</title>
        <meta name="description" content="Complete daily tasks and earn rewards" />
      </Helmet>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div initial={{
          scale: 0,
          rotate: -180
        }} animate={{
          scale: 1,
          rotate: 0
        }} exit={{
          scale: 0,
          rotate: 180
        }} className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 p-8 rounded-3xl text-center">
              <motion.div animate={{
            rotate: [0, 10, -10, 0]
          }} transition={{
            repeat: Infinity,
            duration: 0.5
          }}>
                <Crown className="w-20 h-20 text-white mx-auto mb-4" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">All Tasks Done!</h2>
              <p className="text-white/80">You're a VIRAL Champion! 🏆</p>
            </motion.div>
          </motion.div>}
      </AnimatePresence>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header with gradient */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full bg-primary/10 hover:bg-primary/20">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Daily Tasks
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Rocket className="w-3 h-3" /> Complete & Earn VIRAL
              </p>
            </div>
          </div>
          
        </motion.div>

        {/* Streak Card - NEW! */}
        <motion.div initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        delay: 0.1
      }} className="relative mb-4 overflow-hidden">
          <Card className="p-4 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 border-orange-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  
                  {streak > 0 && <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs px-1.5">
                      {streak}
                    </Badge>}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">Daily Streak</h3>
                  <p className="text-sm text-muted-foreground">
                    {streak === 0 ? 'Start your streak today!' : `${streak} day${streak > 1 ? 's' : ''} in a row!`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Bonus</p>
                <p className="text-lg font-bold text-orange-500">+{Math.min(streak * 5, 50)}%</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Timer & Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }}>
            <Card className="p-4 relative overflow-hidden">
              <FloatingParticles />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Reset in</p>
                <p className="text-lg font-bold text-primary font-mono">{timeUntilReset}</p>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }}>
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground">Earned Today</p>
              <p className="text-lg font-bold text-green-500">{todayEarned.toLocaleString()}</p>
            </Card>
          </motion.div>
        </div>

        {/* Progress Card - Enhanced */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }}>
          <Card className="p-4 mb-6 relative overflow-hidden">
            {/* Background glow effect */}
            {progress === 100 && <motion.div animate={{
            opacity: [0.3, 0.6, 0.3]
          }} transition={{
            repeat: Infinity,
            duration: 2
          }} className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-green-500/20 to-yellow-500/20" />}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  
                  <span className="font-semibold text-foreground">Today's Progress</span>
                </div>
                <Badge variant="outline" className={progress === 100 ? 'bg-green-500/20 border-green-500 text-green-500' : ''}>
                  {completedCount}/{totalCount}
                </Badge>
              </div>
              
              <div className="relative h-4 mb-3 bg-muted rounded-full overflow-hidden">
                <motion.div initial={{
                width: 0
              }} animate={{
                width: `${progress}%`
              }} transition={{
                duration: 0.5,
                ease: "easeOut"
              }} className={`absolute inset-y-0 left-0 rounded-full ${progress === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-primary to-purple-500'}`} />
                {/* Shimmer effect */}
                <motion.div animate={{
                x: [-100, 400]
              }} transition={{
                repeat: Infinity,
                duration: 2,
                ease: "linear"
              }} className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  {completedCount === totalCount ? <>
                      
                      All tasks completed!
                    </> : `${totalCount - completedCount} tasks remaining`}
                </span>
                <span className="text-primary font-medium flex items-center gap-1">
                  
                  {totalRewards.toLocaleString()} VIRAL
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Reward Card - Shows when close to completion */}
        {completedCount > 0 && completedCount < totalCount && totalCount - completedCount <= 2 && <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="mb-4">
            <Card className="p-3 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-purple-500/30">
              <div className="flex items-center gap-3">
                <motion.div animate={{
              rotate: [0, 15, -15, 0]
            }} transition={{
              repeat: Infinity,
              duration: 2
            }}>
                  <Medal className="w-8 h-8 text-purple-500" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Almost there!</p>
                  <p className="text-xs text-muted-foreground">
                    Complete {totalCount - completedCount} more for bonus rewards
                  </p>
                </div>
                <Badge className="bg-purple-500">+500</Badge>
              </div>
            </Card>
          </motion.div>}

        {/* Tasks List - Enhanced */}
        {loading ? <div className="flex flex-col items-center justify-center py-12 gap-4">
            <motion.div animate={{
          rotate: 360
        }} transition={{
          repeat: Infinity,
          duration: 1,
          ease: "linear"
        }} className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div> : <div className="space-y-3">
            {tasks.map((task, index) => <motion.div key={task.id} initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          delay: index * 0.05
        }} whileHover={{
          scale: 1.02
        }} whileTap={{
          scale: 0.98
        }}>
                <Card className={`p-4 transition-all duration-300 ${task.is_completed ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30' : 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'}`}>
                  <div className="flex items-center gap-4">
                    {/* Icon with animation */}
                    <motion.div className={`w-12 h-12 rounded-xl flex items-center justify-center ${task.is_completed ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-primary/20 to-purple-500/20'}`} animate={task.is_completed ? {
                scale: [1, 1.1, 1]
              } : {}} transition={{
                repeat: task.is_completed ? Infinity : 0,
                duration: 2
              }}>
                      {task.is_completed ? <Check className="w-6 h-6 text-white" /> : <span className="text-primary">{iconMap[task.icon || 'star']}</span>}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${task.is_completed ? 'text-green-500' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </p>
                    </div>

                    {/* Reward with coin effect */}
                    <div className="text-right">
                      <motion.div animate={!task.is_completed ? {
                  y: [0, -2, 0]
                } : {}} transition={{
                  repeat: Infinity,
                  duration: 1.5
                }} className="flex items-center gap-1 justify-end">
                        <img src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" alt="VIRAL" className="w-4 h-4" />
                        <span className={`font-bold ${task.is_completed ? 'text-green-500' : 'text-primary'}`}>
                          +{task.reward_tokens}
                        </span>
                      </motion.div>
                      <p className="text-xs text-muted-foreground">VIRAL</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  {!task.is_completed && <Button onClick={() => handleCompleteTask(task.id, task.required_action)} className="w-full mt-3 bg-gradient-to-r from-primary to-purple-500 hover:opacity-90" size="sm">
                      <Zap className="w-4 h-4 mr-2" />
                      Complete Task
                    </Button>}

                  {task.is_completed && <motion.div initial={{
              opacity: 0
            }} animate={{
              opacity: 1
            }} className="flex items-center justify-center gap-2 mt-3 py-2 bg-green-500/10 rounded-lg">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">Completed</span>
                    </motion.div>}
                </Card>
              </motion.div>)}
          </div>}

        {/* Completion Bonus Card */}
        {completedCount === totalCount && totalCount > 0 && <motion.div initial={{
        opacity: 0,
        scale: 0.9
      }} animate={{
        opacity: 1,
        scale: 1
      }} className="mt-6">
            <Card className="p-6 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-500/30 text-center relative overflow-hidden">
              <FloatingParticles />
              <motion.div animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }} transition={{
            repeat: Infinity,
            duration: 3
          }} className="relative z-10">
                <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              </motion.div>
              <h3 className="text-xl font-bold text-foreground mb-2 relative z-10">Daily Champion!</h3>
              <p className="text-sm text-muted-foreground mb-4 relative z-10">
                You've completed all tasks! Come back tomorrow for more rewards.
              </p>
              <div className="flex items-center justify-center gap-2 relative z-10">
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  +500 Bonus VIRAL
                </Badge>
              </div>
            </Card>
          </motion.div>}

        {/* Quick Tips - Enhanced */}
        <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} transition={{
        delay: 0.6
      }} className="mt-6">
          <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-foreground">Pro Tips</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Tasks reset daily at midnight UTC
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Complete all tasks for +500 bonus VIRAL
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Keep your streak for up to +50% bonus
              </li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </main>;
};
export default DailyTasks;