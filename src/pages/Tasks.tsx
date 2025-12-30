import React, { useState, useMemo } from 'react';
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

const Tasks = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { allTasks, completedTasks, loading, completeTask } = useBoltTasks();
  const { checkSubscription, isChecking } = useChannelSubscription('boltcomm');
  const [activeTab, setActiveTab] = useState('social');
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  useTelegramBackButton();

  const getTasksByCategory = (category: string) => allTasks.filter(task => task.category === category);
  const isTaskCompleted = (taskId: string) => completedTasks.some(ct => ct.task_id === taskId);

  const categories = useMemo(() => {
    const cats = [...new Set(allTasks.map(t => t.category))];
    return cats.length > 0 ? cats : ['social', 'mining', 'referral'];
  }, [allTasks]);

  const stats = useMemo(() => {
    const totalTasks = allTasks.length;
    const completed = completedTasks.length;
    const earnedPoints = completedTasks.reduce((sum, ct) => sum + ct.points_earned, 0);
    return { totalTasks, completed, earnedPoints };
  }, [allTasks, completedTasks]);

  const handleTaskComplete = async (taskId: string, taskUrl: string, taskTitle: string) => {
    if (isTaskCompleted(taskId)) {
      toast.info('Task already completed!');
      return;
    }
    
    hapticFeedback?.impact?.('medium');
    setProcessingTask(taskId);

    // Check if this is a community/channel join task
    const isCommunityTask = taskTitle.toLowerCase().includes('community') || 
                            taskTitle.toLowerCase().includes('channel') ||
                            taskUrl?.includes('t.me/boltcomm');

    if (isCommunityTask && tgUser?.id) {
      // Open the channel first
      if (taskUrl) {
        window.open(taskUrl, '_blank');
      }
      
      // Wait a moment then check subscription
      setTimeout(async () => {
        const isSubscribed = await checkSubscription(tgUser.id);
        
        if (isSubscribed) {
          try {
            await completeTask(taskId);
            toast.success('Task completed! Points added.');
          } catch (err) {
            toast.error('Could not complete task');
          }
        } else {
          toast.error('Please join the channel first, then try again');
        }
        setProcessingTask(null);
      }, 3000);
    } else {
      // Regular task flow
      if (taskUrl) {
        if (taskUrl.startsWith('/')) {
          window.location.href = taskUrl;
        } else {
          window.open(taskUrl, '_blank');
        }
        
        setTimeout(async () => {
          try {
            await completeTask(taskId);
            toast.success('Task completed! Points added.');
          } catch (err) {
            toast.error('Could not complete task');
          }
          setProcessingTask(null);
        }, 3000);
      }
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
                          disabled={isTaskCompleted(task.id) || isProcessing}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${
                            isTaskCompleted(task.id) 
                              ? 'bg-primary/5 border-primary/20' 
                              : 'bg-card border-border hover:border-primary/30'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${
                              isTaskCompleted(task.id) ? 'bg-primary/20' : 'bg-muted'
                            }`}>
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
                              ) : isTaskCompleted(task.id) ? (
                                <Check className="w-6 h-6 text-primary" />
                              ) : (
                                <Target className="w-6 h-6 text-muted-foreground" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${
                                isTaskCompleted(task.id) ? 'text-primary' : 'text-foreground'
                              }`}>
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">+{task.points} BOLT</p>
                            </div>

                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                            ) : isTaskCompleted(task.id) ? (
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary" />
                              </div>
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