import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTasks } from '@/hooks/useTasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Coins, Users, ExternalLink, ArrowLeft, ListChecks, UserCheck, Flame } from 'lucide-react';
import { TaskCard } from '@/components/TaskCard';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import CandleAnimation from '@/components/animations/CandleAnimation';
import { toast } from 'sonner';


const Tasks = () => {
  const { user: telegramUser, hapticFeedback } = useTelegramAuth();
  const { 
    tasks, 
    completedTasks, 
    loading, 
    completeTask, 
    dailyCodes,
    checkDailyCode,
    hasDailyCodeCompleted 
  } = useTasks();
  
  const [showSecretDialog, setShowSecretDialog] = useState(false);

  const getAvailableTasks = (category: string) => {
    return tasks.filter(task => 
      task.category === category && 
      !completedTasks.some(completed => completed.task_id === task.id)
    );
  };

  const handleTaskComplete = async (taskId: string, taskUrl: string) => {
    if (taskUrl) {
      hapticFeedback.impact('medium');
      window.open(taskUrl, '_blank');
      
      // Wait a bit then complete the task
      setTimeout(async () => {
        await completeTask(taskId);
        toast.success('Task completed successfully! 🎉');
      }, 3000);
    }
  };

  const handleSecretTaskClick = () => {
    if (hasDailyCodeCompleted()) {
      toast.info("You have already completed the daily task!");
      return;
    }
    hapticFeedback.impact('light');
    setShowSecretDialog(true);
  };

  const handleSecretCodeSubmit = async (codes: string[]) => {
    try {
      await checkDailyCode(codes);
      setShowSecretDialog(false);
      toast.success("Codes entered successfully! You got 500 points! 🎉");
    } catch (error) {
      toast.error("Invalid codes. Please try again.");
    }
  };

  const mainTasks = getAvailableTasks('main');
  const partnerTasks = getAvailableTasks('partners');
  const viralTasks = getAvailableTasks('viral');

  const totalCompleted = completedTasks.length;
  const totalPoints = completedTasks.reduce((sum, t) => sum + (t.points_earned || 0), 0);
  const pendingCount = Math.max(0, tasks.length - totalCompleted);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-area pb-20">
      <div className="max-w-md mx-auto p-4">
        <Helmet>
          <title>Tasks | Complete and Earn</title>
          <meta name="description" content="Complete daily tasks and partner tasks to earn VIRAL points" />
          <link rel="canonical" href={`${window.location.origin}/tasks`} />
        </Helmet>

        {/* Candle Animation */}
        <CandleAnimation />


        {/* Tasks Tabs */}
        <Tabs defaultValue="partners" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30 rounded-lg p-1 h-12">
            <TabsTrigger 
              value="main" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 hover:text-primary/80"
            >
              <Users className="w-4 h-4" />
              Main Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 hover:text-primary/80"
            >
              <UserCheck className="w-4 h-4" />
              Partner Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="viral" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-white rounded-md transition-all duration-200 hover:text-primary/80"
            >
              <ListChecks className="w-4 h-4" />
              Daily Tasks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-3 animate-fade-in">
            {mainTasks.length > 0 ? (
              <div className="space-y-3">
                {mainTasks.map((task, index) => (
                  <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TaskCard
                      task={task}
                      onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-muted-foreground/30">
                <ListChecks className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-white mb-1">No main tasks available</h3>
                <p className="text-xs text-white/70">Check back later for new tasks</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-3 animate-fade-in">
            {partnerTasks.length > 0 ? (
              <div className="space-y-3">
                {partnerTasks.map((task, index) => (
                  <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <TaskCard
                      task={task}
                      onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-muted-foreground/30">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-white mb-1">No partner tasks available</h3>
                <p className="text-xs text-white/70">Check back later for new partner tasks</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-3 animate-fade-in">
            {/* Secret Task - Always show */}
            <div className="animate-fade-in">
              <TaskCard
                task={{
                  id: 'secret-daily-task',
                  title: 'Daily Secret Task',
                  points: 500,
                  category: 'viral',
                  task_url: null
                }}
                onComplete={handleSecretTaskClick}
                isCompleted={hasDailyCodeCompleted()}
              />
            </div>
            
            {viralTasks.length > 0 && (
              <div className="space-y-3">
                {viralTasks.map((task, index) => (
                  <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${(index + 1) * 0.1}s` }}>
                    <TaskCard
                      task={task}
                      onComplete={() => {
                        if (task.title.toLowerCase().includes("secret") || task.title.toLowerCase().includes("daily")) {
                          handleSecretTaskClick();
                        } else {
                          handleTaskComplete(task.id, task.task_url || "");
                        }
                      }}
                      isCompleted={(task.title.toLowerCase().includes("secret") || task.title.toLowerCase().includes("daily")) && hasDailyCodeCompleted()}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {viralTasks.length === 0 && (
              <Card className="p-8 text-center border-dashed border-muted-foreground/30">
                <Flame className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-white mb-1">No additional tasks available</h3>
                <p className="text-xs text-white/70">Check back later for new tasks</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Secret Code Dialog */}
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