import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  Check,
  Clock,
  Gift,
  Zap,
  Flame,
  Users,
  Trophy,
  Sparkles,
  Send,
  BarChart,
  Star,
  RefreshCw
} from 'lucide-react';
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

const DailyTasks = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Get user ID from telegram user
  useEffect(() => {
    const fetchUserId = async () => {
      if (!telegramUser) return;
      
      const { data } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();
      
      if (data) setUserId(data.id);
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
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Daily Tasks | VIRAL</title>
        <meta name="description" content="Complete daily tasks and earn rewards" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daily Tasks</h1>
              <p className="text-sm text-muted-foreground">Renews daily</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshTasks}
            className="rounded-full"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Timer Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/30 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks reset in</p>
                <p className="text-xl font-bold text-primary font-mono">{timeUntilReset}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Earned today</p>
              <p className="text-xl font-bold text-foreground">{todayEarned.toLocaleString()} VIRAL</p>
            </div>
          </div>
        </motion.div>

        {/* Progress Card */}
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Today's Progress</span>
            </div>
            <Badge variant="outline">
              {completedCount}/{totalCount}
            </Badge>
          </div>
          
          <Progress value={progress} className="h-3 mb-3" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedCount === totalCount ? '🎉 All tasks completed!' : `${totalCount - completedCount} tasks remaining`}
            </span>
            <span className="text-primary font-medium">
              {totalRewards.toLocaleString()} VIRAL available
            </span>
          </div>
        </Card>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 ${task.is_completed ? 'bg-green-500/10 border-green-500/30' : ''}`}>
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      task.is_completed 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-primary/20 text-primary'
                    }`}>
                      {task.is_completed ? <Check className="w-6 h-6" /> : iconMap[task.icon || 'star']}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${task.is_completed ? 'text-green-500' : 'text-foreground'}`}>
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {task.description}
                      </p>
                    </div>

                    {/* Reward & Action */}
                    <div className="text-right">
                      <p className={`font-bold ${task.is_completed ? 'text-green-500' : 'text-primary'}`}>
                        +{task.reward_tokens}
                      </p>
                      <p className="text-xs text-muted-foreground">VIRAL</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  {!task.is_completed && (
                    <Button
                      onClick={() => handleCompleteTask(task.id, task.required_action)}
                      className="w-full mt-3 bg-primary hover:bg-primary/90"
                      size="sm"
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Complete Task
                    </Button>
                  )}

                  {task.is_completed && (
                    <div className="flex items-center justify-center gap-2 mt-3 py-2 bg-green-500/10 rounded-lg">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500 font-medium">Completed</span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bonus Card */}
        {completedCount === totalCount && totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl text-center"
          >
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-foreground mb-1">🎉 Amazing!</h3>
            <p className="text-sm text-muted-foreground">
              You completed all daily tasks! Come back tomorrow for more
            </p>
          </motion.div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-muted/30 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2">💡 Tips</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Tasks reset daily at midnight UTC</li>
            <li>• Complete all tasks for maximum rewards</li>
            <li>• Some tasks require specific actions</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default DailyTasks;
