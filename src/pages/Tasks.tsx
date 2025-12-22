import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ListChecks, UserCheck, Flame } from 'lucide-react';
import { TaskCard } from '@/components/TaskCard';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import { toast } from 'sonner';

const Tasks = () => {
  const { hapticFeedback } = useTelegramAuth();
  const { 
    tasks, 
    allTasks,
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

  const handleTaskComplete = async (taskId: string, taskUrl: string) => {
    if (taskUrl) {
      hapticFeedback.impact('medium');
      window.open(taskUrl, '_blank');
      
      setTimeout(async () => {
        try {
          await completeTask(taskId);
          toast.success('Task completed successfully! 🎉');
        } catch (err) {
          toast.error('Error completing task');
        }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="simple-loader mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="safe-area pb-20 bg-background">
      <div className="max-w-md mx-auto p-4">
        <Helmet>
          <title>Tasks | Complete and Earn</title>
          <meta name="description" content="Complete daily tasks and partner tasks to earn BOLT points" />
          <link rel="canonical" href={`${window.location.origin}/tasks`} />
        </Helmet>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Tasks</h1>
          <p className="text-muted-foreground text-sm">Complete tasks to earn BOLT</p>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="partners" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted rounded-lg p-1 h-12">
            <TabsTrigger 
              value="main" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              Main
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200"
            >
              <UserCheck className="w-4 h-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger 
              value="viral" 
              className="flex items-center gap-2 text-sm bg-transparent border-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200"
            >
              <ListChecks className="w-4 h-4" />
              Daily
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-3">
            {mainTasks.length > 0 ? (
              <div className="space-y-3">
                {mainTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-border">
                <ListChecks className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">No main tasks available</h3>
                <p className="text-xs text-muted-foreground">Check back later for new tasks</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="partners" className="space-y-3">
            {partnerTasks.length > 0 ? (
              <div className="space-y-3">
                {partnerTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-border">
                <UserCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">No partner tasks available</h3>
                <p className="text-xs text-muted-foreground">Check back later for new partner tasks</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-3">
            {/* Secret Task */}
            <TaskCard
              task={{
                id: 'secret-daily-task',
                title: 'Daily Secret Task',
                points: 500,
                category: 'viral',
                task_url: undefined
              }}
              onComplete={handleSecretTaskClick}
              isCompleted={hasDailyCodeCompleted()}
            />
            
            {viralTasks.length > 0 && (
              <div className="space-y-3">
                {viralTasks.map((task) => (
                  <TaskCard
                    key={task.id}
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
                ))}
              </div>
            )}
            
            {viralTasks.length === 0 && (
              <Card className="p-8 text-center border-dashed border-border">
                <Flame className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-1">No additional tasks available</h3>
                <p className="text-xs text-muted-foreground">Check back later for new tasks</p>
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
