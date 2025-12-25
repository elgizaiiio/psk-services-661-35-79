import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DailyTasks = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const fetchUserId = async () => {
      if (!telegramUser) return;
      const { data } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();
      if (data) {
        setUserId(data.id);
      }
    };
    fetchUserId();
  }, [telegramUser]);

  const {
    tasks,
    loading,
    completedCount,
    totalCount,
    todayEarned,
    completeTask,
  } = useDailyTasks(userId);

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
      setTimeUntilReset(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCompleteTask = async (taskId: string, requiredAction: string | null) => {
    const navigationTasks: Record<string, string> = {
      visit_achievements: '/achievements',
      view_leaderboard: '/leaderboard',
      start_mining: '/',
      invite_friend: '/invite',
      lucky_spin: '/slots',
    };
    if (requiredAction && navigationTasks[requiredAction]) {
      navigate(navigationTasks[requiredAction]);
    }
    const result = await completeTask(taskId);
    if (result.success) {
      toast.success(`+${result.reward} VIRAL`);
    } else {
      toast.error(result.error || 'Failed to complete task');
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Daily Tasks | VIRAL</title>
        <meta name="description" content="Complete daily tasks and earn rewards" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full border border-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Daily Tasks</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center border-primary/30">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-lg font-bold text-primary">
              {completedCount}/{totalCount}
            </p>
          </Card>
          <Card className="p-3 text-center border-primary/30">
            <p className="text-xs text-muted-foreground">Earned</p>
            <p className="text-lg font-bold text-primary">{todayEarned}</p>
          </Card>
          <Card className="p-3 text-center border-primary/30">
            <p className="text-xs text-muted-foreground">Reset</p>
            <p className="text-lg font-bold text-primary font-mono">{timeUntilReset}</p>
          </Card>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 border ${
                    task.is_completed ? 'border-green-500/50 bg-green-500/5' : 'border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium ${
                          task.is_completed ? 'text-green-500' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{task.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`font-bold ${task.is_completed ? 'text-green-500' : 'text-primary'}`}>
                        +{task.reward_tokens}
                      </p>
                    </div>
                  </div>

                  {task.is_completed ? (
                    <div className="flex items-center justify-center gap-2 mt-3 py-2 bg-green-500/10 rounded">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-500">Completed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleCompleteTask(task.id, task.required_action)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      Complete
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default DailyTasks;
