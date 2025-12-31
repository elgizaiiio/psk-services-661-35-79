import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useChannelSubscription } from '@/hooks/useChannelSubscription';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Check, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress } from '@/components/ui/motion-wrapper';

const extractTelegramUsername = (urlOrUsername: string) => {
  const raw = (urlOrUsername || '').trim();
  if (!raw) return '';
  const m = raw.match(/t\.me\/(.+)$/i);
  const value = (m?.[1] || raw).replace(/^@/, '').trim();
  return value.split('?')[0].split('/')[0].trim();
};

const isJoinTask = (taskTitle: string, taskUrl?: string | null) => {
  const title = (taskTitle || '').toLowerCase();
  const url = (taskUrl || '').toLowerCase();
  return (
    title.includes('join') ||
    title.includes('community') ||
    title.includes('channel') ||
    title.includes('group') ||
    url.includes('t.me/')
  );
};

const Tasks = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { allTasks, completedTasks, loading, completeTask, revokeTaskCompletion, refreshTasks } = useBoltTasks();
  const { checkSubscription, isChecking } = useChannelSubscription('boltcomm');
  const [activeTab, setActiveTab] = useState('social');
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  const didRecheckRef = useRef(false);
  useTelegramBackButton();

  const isTaskCompleted = (taskId: string) => completedTasks.some(ct => ct.task_id === taskId);

  const availableTasks = useMemo(() => {
    const completed = new Set(completedTasks.map((c) => c.task_id));
    return allTasks.filter((t) => !completed.has(t.id));
  }, [allTasks, completedTasks]);

  const getTasksByCategory = (category: string) => availableTasks.filter(task => task.category === category);

  const categories = useMemo(() => {
    const cats = [...new Set(availableTasks.map(t => t.category))];
    return cats.length > 0 ? cats : ['social', 'mining', 'referral'];
  }, [availableTasks]);

  const stats = useMemo(() => {
    const totalTasks = allTasks.length;
    const completed = completedTasks.length;
    const earnedPoints = completedTasks.reduce((sum, ct) => sum + ct.points_earned, 0);
    return { totalTasks, completed, earnedPoints };
  }, [allTasks, completedTasks]);

  // Re-check subscription for already-completed join tasks; if user left, revoke points + show task again.
  useEffect(() => {
    if (didRecheckRef.current) return;
    if (!tgUser?.id) return;
    if (loading) return;
    if (!allTasks.length) return;

    // Build a set of completed task IDs for this check
    const completedIds = new Set(completedTasks.map(c => c.task_id));
    if (completedIds.size === 0) return;

    didRecheckRef.current = true;

    const run = async () => {
      try {
        for (const task of allTasks) {
          if (!completedIds.has(task.id)) continue;
          if (!isJoinTask(task.title, task.task_url)) continue;

          const username = extractTelegramUsername(task.task_url || '');
          if (!username) continue;

          try {
            const subscribed = await checkSubscription(tgUser.id, username);
            if (!subscribed) {
              const ok = await revokeTaskCompletion(task.id, task.points);
              if (ok) {
                toast.warning(`You left ${username}. ${task.points} BOLT deducted and task restored.`);
              }
            }
          } catch (e) {
            console.error('Error checking subscription for task:', task.id, e);
          }
        }
      } catch (e) {
        console.error('Error in subscription recheck:', e);
      }
    };

    run();
  }, [allTasks, completedTasks, tgUser?.id, loading, checkSubscription, revokeTaskCompletion]);

  const handleTaskComplete = async (taskId: string, taskUrl: string, taskTitle: string) => {
    if (isTaskCompleted(taskId)) {
      toast.info('Task already completed');
      return;
    }

    hapticFeedback?.impact?.('medium');
    setProcessingTask(taskId);

    const joinTask = isJoinTask(taskTitle, taskUrl);

    if (joinTask && tgUser?.id) {
      if (taskUrl) window.open(taskUrl, '_blank');

      setTimeout(async () => {
        const username = extractTelegramUsername(taskUrl);
        const subscribed = username ? await checkSubscription(tgUser.id, username) : false;

        if (subscribed) {
          try {
            await completeTask(taskId);
            // Force immediate refetch to update UI
            await refreshTasks();
            toast.success('Task completed! Points added');
          } catch {
            toast.error('Failed to complete task');
          }
        } else {
          toast.error('Please subscribe first and try again');
        }
        setProcessingTask(null);
      }, 3000);
      return;
    }

    // Regular task flow
    if (taskUrl) {
      if (taskUrl.startsWith('/')) window.location.href = taskUrl;
      else window.open(taskUrl, '_blank');

      setTimeout(async () => {
        try {
          await completeTask(taskId);
          // Force immediate refetch to update UI
          await refreshTasks();
          toast.success('Task completed! Points added');
        } catch {
          toast.error('Failed to complete task');
        }
        setProcessingTask(null);
      }, 3000);
    } else {
      setProcessingTask(null);
    }
  };

  const progress = stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    social: 'Social',
    mining: 'Mining',
    referral: 'Referral',
    general: 'General',
  };

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <Helmet><title>Tasks</title></Helmet>
        <StaggerContainer className="space-y-6">
          <FadeUp>
            <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Complete tasks to earn BOLT</p>
          </FadeUp>

          <div className="grid grid-cols-2 gap-4">
            <FadeUp>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  <AnimatedNumber value={stats.completed} duration={0.6} />/{stats.totalTasks}
                </p>
              </div>
            </FadeUp>
            <FadeUp>
              <div className="p-4 rounded-xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">Earned</p>
                <p className="text-2xl font-bold text-primary">
                  <AnimatedNumber value={stats.earnedPoints} duration={0.6} />
                </p>
              </div>
            </FadeUp>
          </div>

          <FadeUp>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{Math.round(progress)}%</span>
              </div>
              <AnimatedProgress value={progress} />
            </div>
          </FadeUp>

          <FadeUp>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid h-12 bg-card border border-border rounded-xl p-1 mb-6" style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, 1fr)` }}>
                {categories.slice(0, 4).map(cat => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {categoryLabels[cat] || cat}
                  </TabsTrigger>
                ))}
              </TabsList>

              <AnimatePresence mode="wait">
                {categories.map(cat => (
                  <TabsContent key={cat} value={cat} className="space-y-3 mt-0">
                    {getTasksByCategory(cat).map((task, i) => {
                      const isProcessing = processingTask === task.id || isChecking;
                      return (
                        <motion.button
                          key={task.id}
                          onClick={() => handleTaskComplete(task.id, task.task_url || '', task.title)}
                          disabled={isProcessing}
                          className="w-full p-4 rounded-xl border text-left transition-all bg-card border-border hover:border-primary/30"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-muted">
                              {task.icon ? (
                                <img
                                  src={task.icon}
                                  alt={task.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <Target className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-foreground">{task.title}</p>
                              <p className="text-xs text-muted-foreground">+{task.points} BOLT</p>
                            </div>

                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : (
                              <ExternalLink className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </motion.button>
                      );
                    })}

                    {getTasksByCategory(cat).length === 0 && (
                      <div className="text-center py-12">
                        <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">No tasks available</p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </AnimatePresence>
            </Tabs>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Tasks;
