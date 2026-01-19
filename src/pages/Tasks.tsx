import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useChannelSubscription } from '@/hooks/useChannelSubscription';
import { useAdsGramRewarded } from '@/hooks/useAdsGramRewarded';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Check, ExternalLink, Loader2, AlertCircle, Home, Users, Calendar, Pickaxe, UserPlus, Play } from 'lucide-react';
import { toast } from 'sonner';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress } from '@/components/ui/motion-wrapper';
import { TonIcon, UsdtIcon, BoltIcon } from '@/components/ui/currency-icons';
import tasksHeaderImg from '@/assets/tasks-header.png';
import { BoltTask } from '@/types/bolt';
import { supabase } from '@/integrations/supabase/client';
import { WatchAdCard } from '@/components/ads/WatchAdCard';

const getRewardDisplay = (task: BoltTask) => {
  if (task.reward_ton && task.reward_ton > 0) {
    return { text: `+${task.reward_ton} TON`, icon: <TonIcon size={14} />, color: 'text-blue-400' };
  }
  if (task.reward_usdt && task.reward_usdt > 0) {
    return { text: `+${task.reward_usdt} USDT`, icon: <UsdtIcon size={14} />, color: 'text-emerald-400' };
  }
  return { text: `+${task.points} BOLT`, icon: <BoltIcon size={14} />, color: 'text-primary' };
};

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

// Check if task is our main channel task
const isOurChannelTask = (task: BoltTask) => {
  const url = (task.task_url || '').toLowerCase();
  const title = (task.title || '').toLowerCase();
  return url.includes('boltcomm') || url.includes('boltmining') || title.includes('bolt community') || title.includes('bolt channel');
};

// Helper to check referral requirements
const checkReferralRequirement = (title: string, totalReferrals: number): boolean => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('invite 1')) return totalReferrals >= 1;
  if (lowerTitle.includes('invite 3')) return totalReferrals >= 3;
  if (lowerTitle.includes('invite 5')) return totalReferrals >= 5;
  if (lowerTitle.includes('invite 10')) return totalReferrals >= 10;
  return false;
};

// Helper to check mining requirements
const checkMiningRequirement = async (title: string, userId: string): Promise<boolean> => {
  const lowerTitle = title.toLowerCase();
  
  if (lowerTitle.includes('start mining')) {
    const { count } = await supabase
      .from('bolt_mining_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count || 0) >= 1;
  }
  
  if (lowerTitle.includes('mine for 1 hour') || lowerTitle.includes('1 hour')) {
    const { count } = await supabase
      .from('bolt_mining_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', false)
      .not('completed_at', 'is', null);
    return (count || 0) >= 1;
  }
  
  if (lowerTitle.includes('upgrade mining power') || lowerTitle.includes('upgrade')) {
    const { data } = await supabase
      .from('bolt_users')
      .select('mining_power')
      .eq('id', userId)
      .single();
    return (data?.mining_power || 1) > 1;
  }
  
  if (lowerTitle.includes('claim mining') || lowerTitle.includes('claim rewards')) {
    const { data } = await supabase
      .from('bolt_mining_sessions')
      .select('total_mined')
      .eq('user_id', userId)
      .eq('is_active', false)
      .not('completed_at', 'is', null)
      .gt('total_mined', 0)
      .limit(1);
    return (data?.length || 0) >= 1;
  }
  
  return false;
};

// Get task icon based on category
const getTaskIcon = (task: BoltTask) => {
  const category = (task.category || '').toLowerCase();
  const title = (task.title || '').toLowerCase();

  if (category === 'mining' || title.includes('mining') || title.includes('mine')) {
    return <Pickaxe className="w-6 h-6 text-amber-500" />;
  }
  if (category === 'referral' || title.includes('invite') || title.includes('referral')) {
    return <UserPlus className="w-6 h-6 text-purple-500" />;
  }
  if (task.icon) {
    return (
      <img
        src={task.icon}
        alt={task.title || 'Task icon'}
        className="w-full h-full object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
  }
  return <Target className="w-6 h-6 text-muted-foreground" />;
};

const Tasks = () => {
  const navigate = useNavigate();
  const { user: tgUser, hapticFeedback, isLoading: authLoading } = useTelegramAuth();
  const { 
    allTasks, 
    completedTasks, 
    loading: tasksLoading, 
    completeTask, 
    revokeTaskCompletion, 
    refreshTasks,
    user: boltUser,
    userLoading
  } = useBoltTasks();
  const loading = tasksLoading || userLoading;
  const { checkSubscription, isChecking } = useChannelSubscription('boltcomm');
  const { showAd: showTaskAd, isReady: taskAdReady, isLoading: taskAdLoading } = useAdsGramRewarded();
  const [activeTab, setActiveTab] = useState('main');
  const [processingTask, setProcessingTask] = useState<string | null>(null);
  const [showingTaskAd, setShowingTaskAd] = useState(false);
  const didRecheckRef = useRef(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  useTelegramBackButton();

  const isTaskCompleted = (taskId: string) => completedTasks.some(ct => ct.task_id === taskId);

  const availableTasks = useMemo(() => {
    const completed = new Set(completedTasks.map((c) => c.task_id));
    return allTasks.filter((t) => !completed.has(t.id));
  }, [allTasks, completedTasks]);

  // Categorize tasks into Main, Partners, Daily (excluding mining tasks)
  const isDailyTabTask = (task: BoltTask) => {
    const category = (task.category || '').toLowerCase();
    // Only daily and referral, NOT mining
    return category === 'daily' || category === 'referral';
  };

  // Check if task is a mining task (to exclude)
  const isMiningTask = (task: BoltTask) => {
    const category = (task.category || '').toLowerCase();
    const title = (task.title || '').toLowerCase();
    return category === 'mining' || title.includes('mining') || title.includes('mine');
  };

  const mainTasks = useMemo(() => {
    // Main tab should only contain our channel join task(s)
    return availableTasks.filter((task) => isOurChannelTask(task) && isJoinTask(task.title, task.task_url));
  }, [availableTasks]);

  const partnerTasks = useMemo(() => {
    // Partner tab: everything else (excluding our channel + Daily tab tasks + ads category + mining tasks)
    return availableTasks.filter(
      (task) => !isOurChannelTask(task) && !isDailyTabTask(task) && !isMiningTask(task) && (task.category || '').toLowerCase() !== 'ads'
    );
  }, [availableTasks]);

  const dailyTasks = useMemo(() => {
    // Daily tab includes daily + referral tasks (NOT mining)
    return availableTasks.filter((task) => isDailyTabTask(task) && !isMiningTask(task));
  }, [availableTasks]);

  const stats = useMemo(() => {
    const totalTasks = allTasks.length;
    const completed = completedTasks.length;
    const earnedPoints = completedTasks.reduce((sum, ct) => sum + ct.points_earned, 0);
    return { totalTasks, completed, earnedPoints };
  }, [allTasks, completedTasks]);

  // Re-check subscription ONLY for our channel tasks, not partner tasks
  useEffect(() => {
    if (didRecheckRef.current) return;
    if (!tgUser?.id) return;
    if (loading) return;
    if (!allTasks.length) return;

    const completedIds = new Set(completedTasks.map(c => c.task_id));
    if (completedIds.size === 0) return;

    didRecheckRef.current = true;

    const run = async () => {
      try {
        for (const task of allTasks) {
          if (!completedIds.has(task.id)) continue;
          if (!isJoinTask(task.title, task.task_url)) continue;
          
          // ONLY check our channel tasks, skip all partner tasks
          if (!isOurChannelTask(task)) continue;

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

  const handleTaskComplete = async (taskId: string, taskUrl: string, taskTitle: string, taskCategory: string) => {
    if (isTaskCompleted(taskId)) {
      toast.info('Task already completed');
      return;
    }

    if (!boltUser?.id) {
      toast.error('Please wait for your account to load');
      return;
    }

    hapticFeedback?.impact?.('medium');
    setProcessingTask(taskId);

    // Find the task to check if it's our channel or partner task
    const task = allTasks.find(t => t.id === taskId);
    const isOurChannel = task ? isOurChannelTask(task) : false;

    // Only verify subscription for OUR channel tasks, not partner tasks
    const joinTask = isJoinTask(taskTitle, taskUrl);
    if (joinTask && tgUser?.id && isOurChannel) {
      if (taskUrl) window.open(taskUrl, '_blank');

      setTimeout(async () => {
        const username = extractTelegramUsername(taskUrl);
        const subscribed = username ? await checkSubscription(tgUser.id, username) : false;

        if (subscribed) {
          try {
            await completeTask(taskId);
            toast.success('Task completed! Reward added');
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

    // Partner tasks - open URL and complete immediately
    if (!isOurChannel) {
      // Open the task URL first
      if (taskUrl) {
        window.open(taskUrl, '_blank');
      }
      
      // Give reward after short delay
      setTimeout(async () => {
        try {
          await completeTask(taskId);
          toast.success('Task completed! Reward added');
        } catch {
          toast.error('Failed to complete task');
        }
        setProcessingTask(null);
      }, 1500);
      return;
    }

    // Referral tasks - verify actual referral count
    if (taskCategory === 'referral') {
      const totalReferrals = boltUser.total_referrals || 0;
      const hasEnoughReferrals = checkReferralRequirement(taskTitle, totalReferrals);

      if (hasEnoughReferrals) {
        try {
          await completeTask(taskId);
          toast.success('Referral task completed! Reward added');
        } catch {
          toast.error('Failed to complete task');
        }
      } else {
        const match = taskTitle.match(/invite\s+(\d+)/i);
        const required = match ? parseInt(match[1], 10) : 1;
        toast.error(`You need ${required} referrals. You have ${totalReferrals}.`);
        
        if (taskUrl?.startsWith('/')) {
          navigate(taskUrl);
        }
      }
      setProcessingTask(null);
      return;
    }

    // Mining tasks - verify mining activity
    if (taskCategory === 'mining') {
      const miningVerified = await checkMiningRequirement(taskTitle, boltUser.id);

      if (miningVerified) {
        try {
          await completeTask(taskId);
          toast.success('Mining task completed! Reward added');
        } catch {
          toast.error('Failed to complete task');
        }
      } else {
        toast.error('Complete the required mining action first');
        
        if (taskUrl?.startsWith('/')) {
          navigate(taskUrl);
        }
      }
      setProcessingTask(null);
      return;
    }

    // Generic task flow (fallback)
    if (taskUrl) {
      if (taskUrl.startsWith('/')) navigate(taskUrl);
      else window.open(taskUrl, '_blank');
    }
    setProcessingTask(null);
  };

  // Handle task ad watch
  const handleWatchTaskAd = async () => {
    if (showingTaskAd || taskAdLoading) return;
    
    if (!taskAdReady) {
      toast.info('Loading ads... please try again in a moment');
      return;
    }
    
    setShowingTaskAd(true);
    try {
      const completed = await showTaskAd();
      if (completed) {
        toast.success('Ad task completed!');
        refreshTasks();
      } else {
        toast.info('Watch the full ad to complete task');
      }
    } catch (err) {
      console.error('Error showing task ad:', err);
      toast.error('Failed to load ad');
    } finally {
      setShowingTaskAd(false);
    }
  };

  const progress = stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0;

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="mt-3 text-sm text-muted-foreground">Loading your account...</p>
      </div>
    );
  }

  if (!tgUser?.id) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground text-center mb-4">
          Please open the app from Telegram
        </p>
        <a 
          href="https://t.me/Boltminingbot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          Open in Telegram
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
        <p className="mt-3 text-sm text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  // Render task item
  const renderTaskItem = (task: BoltTask, index: number) => {
    const isProcessing = processingTask === task.id;
    const reward = getRewardDisplay(task);
    
    return (
      <motion.button
        key={task.id}
        onClick={() => handleTaskComplete(task.id, task.task_url || '', task.title, task.category)}
        disabled={isProcessing}
        className="w-full p-4 rounded-xl border text-left transition-all bg-card border-border hover:border-primary/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-muted">
            {getTaskIcon(task)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-foreground">{task.title}</p>
            <p className={`text-xs flex items-center gap-1 ${reward.color}`}>
              {reward.icon}
              {reward.text}
            </p>
          </div>

          {isProcessing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <ExternalLink className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </motion.button>
    );
  };

  // Ad Task Card for Partners tab - same style as other tasks
  const renderAdTaskCard = () => (
    <motion.button
      onClick={handleWatchTaskAd}
      disabled={!taskAdReady || showingTaskAd || taskAdLoading}
      className="w-full p-4 rounded-xl border text-left transition-all bg-card border-border hover:border-primary/30"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted">
          <Play className="w-6 h-6 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">Watch Partner Ad</p>
          <p className="text-xs flex items-center gap-1 text-primary">
            <BoltIcon size={14} />
            +10 BOLT
          </p>
        </div>

        {showingTaskAd || taskAdLoading ? (
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        ) : (
          <ExternalLink className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
    </motion.button>
  );

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-6">
        <Helmet>
          <title>Tasks | Earn BOLT Rewards</title>
          <meta name="description" content="Complete social, mining, and referral tasks to earn BOLT rewards." />
          <link rel="canonical" href={`${origin}/tasks`} />
          <meta property="og:title" content="Tasks" />
          <meta property="og:description" content="Complete tasks to earn BOLT rewards." />
          <meta property="og:type" content="website" />
        </Helmet>
        <StaggerContainer className="space-y-6">
          <FadeUp>
            <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Complete tasks to earn BOLT</p>
          </FadeUp>

          <FadeUp>
            <div className="rounded-2xl overflow-hidden">
              <img 
                src={tasksHeaderImg} 
                alt="Tasks" 
                className="w-full h-auto object-cover"
              />
            </div>
          </FadeUp>

          <FadeUp>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-12 bg-card border border-border rounded-xl p-1 mb-6">
                <TabsTrigger
                  value="main"
                  className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                >
                  <Home className="w-4 h-4" />
                  Main
                </TabsTrigger>
                <TabsTrigger
                  value="partners"
                  className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" />
                  Partners
                </TabsTrigger>
                <TabsTrigger
                  value="daily"
                  className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  Daily
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {/* Main Tab - Our Channel Only */}
                <TabsContent value="main" className="space-y-3 mt-0">
                  {mainTasks.map((task, i) => renderTaskItem(task, i))}
                  
                  {mainTasks.length === 0 && (
                    <div className="text-center py-12">
                      <Check className="w-12 h-12 mx-auto text-emerald-500/50 mb-3" />
                      <p className="text-sm text-muted-foreground">All main tasks completed!</p>
                    </div>
                  )}
                </TabsContent>

                {/* Partners Tab - Partner tasks + Task Ads */}
                <TabsContent value="partners" className="space-y-3 mt-0">
                  {/* Task Ad Card */}
                  {renderAdTaskCard()}
                  
                  {/* Partner Tasks */}
                  {partnerTasks.map((task, i) => renderTaskItem(task, i + 1))}
                  
                  {partnerTasks.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">More partner tasks coming soon</p>
                    </div>
                  )}
                </TabsContent>

                {/* Daily Tab - Daily tasks + Rewarded Ads */}
                <TabsContent value="daily" className="space-y-3 mt-0">
                  {/* Rewarded Ads Card */}
                  <WatchAdCard 
                    userId={boltUser?.id} 
                    telegramId={tgUser?.id}
                    onRewardClaimed={refreshTasks}
                  />
                  
                  {/* Daily Tasks */}
                  {dailyTasks.map((task, i) => renderTaskItem(task, i))}
                  
                  {dailyTasks.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Check back for daily tasks</p>
                    </div>
                  )}
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Tasks;
