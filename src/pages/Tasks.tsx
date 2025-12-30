import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Check, ExternalLink, Lock, Loader2 } from 'lucide-react';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import { toast } from 'sonner';
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber, AnimatedProgress } from '@/components/ui/motion-wrapper';

const Tasks = () => {
  const { hapticFeedback } = useTelegramAuth();
  const { tasks, completedTasks, loading, completeTask, checkDailyCode, hasDailyCodeCompleted } = useBoltTasks();
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('partners');
  useTelegramBackButton();

  const getAvailableTasks = (category: string) => tasks.filter(task => task.category === category);
  const isTaskCompleted = (taskId: string) => completedTasks.some(ct => ct.task_id === taskId);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = completedTasks.length;
    const earnedPoints = completedTasks.reduce((sum, ct) => sum + ct.points_earned, 0);
    return { totalTasks, completed, earnedPoints };
  }, [tasks, completedTasks]);

  const handleTaskComplete = async (taskId: string, taskUrl: string) => {
    if (taskUrl) {
      hapticFeedback.impact('medium');
      window.open(taskUrl, '_blank');
      setTimeout(async () => {
        try { await completeTask(taskId); toast.success('Task completed!'); } catch { toast.error('Error'); }
      }, 3000);
    }
  };

  const handleSecretTaskClick = () => {
    if (hasDailyCodeCompleted()) { toast.info("Already completed"); return; }
    hapticFeedback.impact('light');
    setShowSecretDialog(true);
  };

  const handleSecretCodeSubmit = async (codes: string[]) => {
    try { await checkDailyCode(codes); setShowSecretDialog(false); toast.success("500 BOLT earned!"); } catch { toast.error("Invalid codes"); }
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

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-16">
        <Helmet><title>Tasks</title></Helmet>
        <StaggerContainer className="space-y-6">
          <FadeUp>
            <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Complete tasks to earn BOLT</p>
          </FadeUp>

          <div className="grid grid-cols-2 gap-4">
            <FadeUp><div className="p-4 rounded-xl bg-card border border-border"><p className="text-xs text-muted-foreground mb-1">Completed</p><p className="text-2xl font-bold text-foreground"><AnimatedNumber value={stats.completed} duration={0.6} />/{stats.totalTasks}</p></div></FadeUp>
            <FadeUp><div className="p-4 rounded-xl bg-card border border-border"><p className="text-xs text-muted-foreground mb-1">Earned</p><p className="text-2xl font-bold text-primary"><AnimatedNumber value={stats.earnedPoints} duration={0.6} /></p></div></FadeUp>
          </div>

          <FadeUp>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex justify-between text-sm mb-2"><span className="text-muted-foreground">Progress</span><span className="font-medium text-foreground">{Math.round(progress)}%</span></div>
              <AnimatedProgress value={progress} />
            </div>
          </FadeUp>

          <FadeUp>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-12 bg-card border border-border rounded-xl p-1 mb-6">
                <TabsTrigger value="main" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Main</TabsTrigger>
                <TabsTrigger value="partners" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Partners</TabsTrigger>
                <TabsTrigger value="viral" className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Daily</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                {['main', 'partners', 'viral'].map(tab => (
                  <TabsContent key={tab} value={tab} className="space-y-2 mt-0">
                    {tab === 'viral' && (
                      <motion.button onClick={handleSecretTaskClick} disabled={hasDailyCodeCompleted()} className={`w-full p-4 rounded-xl border text-left ${hasDailyCodeCompleted() ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`} whileTap={{ scale: 0.98 }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasDailyCodeCompleted() ? 'bg-primary/20' : 'bg-muted'}`}>
                            {hasDailyCodeCompleted() ? <Check className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1"><p className={`font-medium ${hasDailyCodeCompleted() ? 'text-primary' : 'text-foreground'}`}>Daily Secret Code</p><p className="text-xs text-muted-foreground">Enter today's code</p></div>
                          <span className={`text-sm font-bold ${hasDailyCodeCompleted() ? 'text-primary' : 'text-foreground'}`}>+500</span>
                        </div>
                      </motion.button>
                    )}
                    {getAvailableTasks(tab).map((task, i) => (
                      <motion.button key={task.id} onClick={() => handleTaskComplete(task.id, task.task_url || '')} disabled={isTaskCompleted(task.id)} className={`w-full p-4 rounded-xl border text-left ${isTaskCompleted(task.id) ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileTap={{ scale: 0.98 }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isTaskCompleted(task.id) ? 'bg-primary/20' : 'bg-muted'}`}>
                            {isTaskCompleted(task.id) ? <Check className="w-5 h-5 text-primary" /> : <Target className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0"><p className={`font-medium truncate ${isTaskCompleted(task.id) ? 'text-primary' : 'text-foreground'}`}>{task.title}</p><p className="text-xs text-muted-foreground">+{task.points} BOLT</p></div>
                          {!isTaskCompleted(task.id) && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </motion.button>
                    ))}
                    {getAvailableTasks(tab).length === 0 && tab !== 'viral' && <div className="text-center py-12"><p className="text-sm text-muted-foreground">No tasks available</p></div>}
                  </TabsContent>
                ))}
              </AnimatePresence>
            </Tabs>
          </FadeUp>
        </StaggerContainer>
      </div>
      <SecretCodeDialog open={showSecretDialog} onClose={() => setShowSecretDialog(false)} onSubmit={handleSecretCodeSubmit} dailyCodes={null} />
    </PageWrapper>
  );
};

export default Tasks;