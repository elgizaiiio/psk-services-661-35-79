import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  Users, 
  Sparkles, 
  Check, 
  ExternalLink,
  Lock
} from 'lucide-react';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import { toast } from 'sonner';

const Tasks = () => {
  const { hapticFeedback } = useTelegramAuth();
  const { 
    tasks, 
    completedTasks, 
    loading, 
    completeTask, 
    checkDailyCode,
    hasDailyCodeCompleted 
  } = useBoltTasks();
  
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('partners');

  const getAvailableTasks = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const isTaskCompleted = (taskId: string) => {
    return completedTasks.some(ct => ct.task_id === taskId);
  };

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
        try {
          await completeTask(taskId);
          toast.success('Task completed!');
        } catch (err) {
          toast.error('Error completing task');
        }
      }, 3000);
    }
  };

  const handleSecretTaskClick = () => {
    if (hasDailyCodeCompleted()) {
      toast.info("Already completed today");
      return;
    }
    hapticFeedback.impact('light');
    setShowSecretDialog(true);
  };

  const handleSecretCodeSubmit = async (codes: string[]) => {
    try {
      await checkDailyCode(codes);
      setShowSecretDialog(false);
      toast.success("500 BOLT earned!");
    } catch (error) {
      toast.error("Invalid codes");
    }
  };

  const mainTasks = getAvailableTasks('main');
  const partnerTasks = getAvailableTasks('partners');
  const viralTasks = getAvailableTasks('viral');

  const progress = stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="simple-loader" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-5 pt-8">
        <Helmet>
          <title>Tasks</title>
          <meta name="description" content="Complete tasks to earn BOLT" />
        </Helmet>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground">Complete tasks to earn BOLT</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Completed</p>
            <p className="text-2xl font-bold text-foreground">{stats.completed}/{stats.totalTasks}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">Earned</p>
            <p className="text-2xl font-bold text-primary">{stats.earnedPoints.toLocaleString()}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="p-4 rounded-xl bg-card border border-border mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-card border border-border rounded-xl p-1 mb-6">
            <TabsTrigger 
              value="main" 
              className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Main
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Partners
            </TabsTrigger>
            <TabsTrigger 
              value="viral" 
              className="rounded-lg text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              Daily
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-2 mt-0">
            {mainTasks.length > 0 ? (
              mainTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                  completed={isTaskCompleted(task.id)}
                />
              ))
            ) : (
              <EmptyState message="No main tasks available" />
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-2 mt-0">
            {partnerTasks.length > 0 ? (
              partnerTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                  completed={isTaskCompleted(task.id)}
                />
              ))
            ) : (
              <EmptyState message="No partner tasks available" />
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-2 mt-0">
            {/* Daily Code Task */}
            <button
              onClick={handleSecretTaskClick}
              disabled={hasDailyCodeCompleted()}
              className={`w-full p-4 rounded-xl border text-left transition-colors ${
                hasDailyCodeCompleted()
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  hasDailyCodeCompleted() ? 'bg-primary/20' : 'bg-muted'
                }`}>
                  {hasDailyCodeCompleted() ? (
                    <Check className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${hasDailyCodeCompleted() ? 'text-primary' : 'text-foreground'}`}>
                    Daily Secret Code
                  </p>
                  <p className="text-xs text-muted-foreground">Enter today's code</p>
                </div>
                <span className={`text-sm font-bold ${hasDailyCodeCompleted() ? 'text-primary' : 'text-foreground'}`}>
                  +500
                </span>
              </div>
            </button>

            {viralTasks.length > 0 && viralTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                completed={isTaskCompleted(task.id)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      <SecretCodeDialog 
        open={showSecretDialog}
        onClose={() => setShowSecretDialog(false)}
        onSubmit={handleSecretCodeSubmit}
        dailyCodes={null}
      />
    </div>
  );
};

const TaskItem = ({ task, onComplete, completed }: { task: any; onComplete: () => void; completed: boolean }) => (
  <button
    onClick={onComplete}
    disabled={completed}
    className={`w-full p-4 rounded-xl border text-left transition-colors ${
      completed
        ? 'bg-primary/5 border-primary/20'
        : 'bg-card border-border hover:border-primary/30'
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        completed ? 'bg-primary/20' : 'bg-muted'
      }`}>
        {completed ? (
          <Check className="w-5 h-5 text-primary" />
        ) : (
          <Target className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${completed ? 'text-primary' : 'text-foreground'}`}>
          {task.title}
        </p>
        <p className="text-xs text-muted-foreground">+{task.points} BOLT</p>
      </div>
      {!completed && <ExternalLink className="w-4 h-4 text-muted-foreground" />}
    </div>
  </button>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12">
    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
      <Target className="w-6 h-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export default Tasks;
