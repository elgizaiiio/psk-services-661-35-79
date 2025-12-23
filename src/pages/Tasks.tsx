import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Users, Flame, Check, ExternalLink } from 'lucide-react';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import { toast } from 'sonner';

const Tasks = () => {
  const { hapticFeedback } = useTelegramAuth();
  const { 
    tasks, 
    completedTasks, 
    loading, 
    completeTask, 
    dailyCodes,
    checkDailyCode,
    hasDailyCodeCompleted 
  } = useBoltTasks();
  
  const [showSecretDialog, setShowSecretDialog] = useState(false);

  const getAvailableTasks = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const isTaskCompleted = (taskId: string) => {
    return completedTasks.some(ct => ct.task_id === taskId);
  };

  const handleTaskComplete = async (taskId: string, taskUrl: string) => {
    if (taskUrl) {
      hapticFeedback.impact('medium');
      window.open(taskUrl, '_blank');
      
      setTimeout(async () => {
        try {
          await completeTask(taskId);
          toast.success('Task completed! 🎉');
        } catch (err) {
          toast.error('Error completing task');
        }
      }, 3000);
    }
  };

  const handleSecretTaskClick = () => {
    if (hasDailyCodeCompleted()) {
      toast.info("Already completed today!");
      return;
    }
    hapticFeedback.impact('light');
    setShowSecretDialog(true);
  };

  const handleSecretCodeSubmit = async (codes: string[]) => {
    try {
      await checkDailyCode(codes);
      setShowSecretDialog(false);
      toast.success("500 BOLT earned! 🎉");
    } catch (error) {
      toast.error("Invalid codes");
    }
  };

  const mainTasks = getAvailableTasks('main');
  const partnerTasks = getAvailableTasks('partners');
  const viralTasks = getAvailableTasks('viral');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const TaskItem = ({ task, onComplete, completed }: { task: any; onComplete: () => void; completed?: boolean }) => (
    <button
      onClick={onComplete}
      disabled={completed}
      className="w-full p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 flex items-center gap-4 text-left disabled:opacity-60"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
        completed ? 'bg-primary' : 'bg-primary/10'
      }`}>
        {completed ? (
          <Check className="w-5 h-5 text-primary-foreground" />
        ) : (
          <Target className="w-5 h-5 text-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm truncate">{task.title}</h3>
        <p className="text-primary text-xs font-semibold">+{task.points} BOLT</p>
      </div>
      
      {!completed && (
        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-5 py-6">
        <Helmet>
          <title>Tasks | Complete and Earn</title>
          <meta name="description" content="Complete daily tasks and partner tasks to earn BOLT points" />
          <link rel="canonical" href={`${window.location.origin}/tasks`} />
        </Helmet>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete tasks to earn BOLT</p>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="partners" className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12 bg-muted rounded-2xl p-1 mb-6">
            <TabsTrigger 
              value="main" 
              className="rounded-xl text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Main
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="rounded-xl text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Partners
            </TabsTrigger>
            <TabsTrigger 
              value="viral" 
              className="rounded-xl text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              Daily
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-3 mt-0">
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
              <EmptyState icon={Target} message="No main tasks available" />
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-3 mt-0">
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
              <EmptyState icon={Users} message="No partner tasks available" />
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-3 mt-0">
            {/* Daily Secret Task */}
            <button
              onClick={handleSecretTaskClick}
              disabled={hasDailyCodeCompleted()}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all duration-300 flex items-center gap-4 text-left disabled:opacity-60"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                hasDailyCodeCompleted() ? 'bg-primary' : 'bg-primary/20'
              }`}>
                {hasDailyCodeCompleted() ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Flame className="w-5 h-5 text-primary" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">Daily Secret Code</h3>
                <p className="text-primary text-xs font-semibold">+500 BOLT</p>
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
            
            {viralTasks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground text-xs">Check back for more daily tasks</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SecretCodeDialog
          open={showSecretDialog}
          onClose={() => setShowSecretDialog(false)}
          onSubmit={handleSecretCodeSubmit}
          dailyCodes={dailyCodes}
        />
      </div>
    </div>
  );
};

export default Tasks;
