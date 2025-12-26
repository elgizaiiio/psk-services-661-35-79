import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltTasks } from '@/hooks/useBoltTasks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Users, 
  Flame, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Trophy,
  Zap,
  Gift,
  Crown,
  Star,
  Rocket,
  TrendingUp,
  Lock,
  Timer
} from 'lucide-react';
import { SecretCodeDialog } from '@/components/SecretCodeDialog';
import { toast } from 'sonner';

// Floating particles component
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-primary/40 rounded-full"
        initial={{ 
          x: Math.random() * 400,
          y: Math.random() * 600,
          opacity: 0 
        }}
        animate={{ 
          y: [null, -50],
          opacity: [0, 0.8, 0],
        }}
        transition={{ 
          duration: 4 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 3
        }}
      />
    ))}
  </div>
);

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
  const [activeTab, setActiveTab] = useState('partners');
  const [celebrateTask, setCelebrateTask] = useState<string | null>(null);

  const getAvailableTasks = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const isTaskCompleted = (taskId: string) => {
    return completedTasks.some(ct => ct.task_id === taskId);
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = completedTasks.length;
    const totalPoints = tasks.reduce((sum, t) => sum + t.points, 0);
    const earnedPoints = completedTasks.reduce((sum, ct) => sum + ct.points_earned, 0);
    return { totalTasks, completed, totalPoints, earnedPoints };
  }, [tasks, completedTasks]);

  const handleTaskComplete = async (taskId: string, taskUrl: string) => {
    if (taskUrl) {
      hapticFeedback.impact('medium');
      window.open(taskUrl, '_blank');
      
      setTimeout(async () => {
        try {
          await completeTask(taskId);
          setCelebrateTask(taskId);
          setTimeout(() => setCelebrateTask(null), 2000);
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

  const progress = stats.totalTasks > 0 ? (stats.completed / stats.totalTasks) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center mx-auto"
          >
            <Target className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-muted-foreground text-sm">Loading amazing tasks...</p>
        </motion.div>
      </div>
    );
  }

  const TaskItem = ({ task, onComplete, completed, index }: { task: any; onComplete: () => void; completed?: boolean; index: number }) => (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onComplete}
      disabled={completed}
      className={`w-full p-4 rounded-2xl transition-all duration-300 flex items-center gap-4 text-left relative overflow-hidden ${
        completed 
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30' 
          : 'bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
      }`}
    >
      {/* Celebration effect */}
      <AnimatePresence>
        {celebrateTask === task.id && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/30 rounded-full"
          />
        )}
      </AnimatePresence>

      <motion.div 
        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
          completed 
            ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
            : 'bg-gradient-to-br from-primary/20 to-purple-500/20'
        }`}
        animate={completed ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: completed ? Infinity : 0, duration: 2 }}
      >
        {completed ? (
          <Check className="w-6 h-6 text-white" />
        ) : (
          <Target className="w-5 h-5 text-primary" />
        )}
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm truncate ${completed ? 'text-green-500' : 'text-foreground'}`}>
          {task.title}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <img 
            src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
            alt="BOLT" 
            className="w-4 h-4"
          />
          <span className={`text-xs font-bold ${completed ? 'text-green-500' : 'text-primary'}`}>
            +{task.points} BOLT
          </span>
        </div>
      </div>
      
      {!completed && (
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ExternalLink className="w-5 h-5 text-primary" />
        </motion.div>
      )}

      {completed && (
        <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
          Done
        </Badge>
      )}
    </motion.button>
  );

  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Check back later for new tasks</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24 relative">
      <FloatingParticles />
      
      <div className="max-w-md mx-auto px-4 py-6 relative z-10">
        <Helmet>
          <title>Tasks | Complete and Earn</title>
          <meta name="description" content="Complete daily tasks and partner tasks to earn BOLT points" />
          <link rel="canonical" href={`${window.location.origin}/tasks`} />
        </Helmet>

        {/* Header with gradient */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Tasks
              </h1>
              <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1">
                <Rocket className="w-4 h-4" /> Complete & Earn BOLT
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-xl font-bold text-foreground">{stats.completed}/{stats.totalTasks}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Earned</p>
                  <p className="text-xl font-bold text-green-500">{stats.earnedPoints.toLocaleString()}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 mb-6 relative overflow-hidden">
            {progress === 100 && (
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-green-500/20 to-yellow-500/20"
              />
            )}
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">Overall Progress</span>
                </div>
                {progress === 100 && (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                    <Crown className="w-3 h-3 mr-1" /> Champion
                  </Badge>
                )}
              </div>
              
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-full ${
                    progress === 100 
                      ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-primary to-purple-500'
                  }`}
                />
                <motion.div
                  animate={{ x: [-100, 400] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                {progress === 100 
                  ? '🎉 All tasks completed! Amazing work!' 
                  : `${stats.totalTasks - stats.completed} tasks remaining for max rewards`
                }
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Bonus Alert - Shows when close to completion */}
        {stats.completed > 0 && stats.completed < stats.totalTasks && stats.totalTasks - stats.completed <= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            <Card className="p-3 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 border-orange-500/30">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Flame className="w-8 h-8 text-orange-500" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Almost there! 🔥</p>
                  <p className="text-xs text-muted-foreground">
                    Complete {stats.totalTasks - stats.completed} more for bonus rewards!
                  </p>
                </div>
                <Badge className="bg-orange-500 text-white">+1000</Badge>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Tasks Tabs - Enhanced */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14 bg-muted/50 backdrop-blur-sm rounded-2xl p-1.5 mb-6">
            <TabsTrigger 
              value="main" 
              className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Target className="w-4 h-4 mr-1.5" />
              Main
            </TabsTrigger>
            <TabsTrigger 
              value="partners" 
              className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Users className="w-4 h-4 mr-1.5" />
              Partners
            </TabsTrigger>
            <TabsTrigger 
              value="viral" 
              className="rounded-xl text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              Daily
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main" className="space-y-3 mt-0">
            {mainTasks.length > 0 ? (
              mainTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
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
              partnerTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                  completed={isTaskCompleted(task.id)}
                />
              ))
            ) : (
              <EmptyState icon={Users} message="No partner tasks available" />
            )}
          </TabsContent>

          <TabsContent value="viral" className="space-y-3 mt-0">
            {/* Daily Secret Task - Enhanced */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSecretTaskClick}
              disabled={hasDailyCodeCompleted()}
              className={`w-full p-5 rounded-2xl transition-all duration-300 flex items-center gap-4 text-left relative overflow-hidden ${
                hasDailyCodeCompleted()
                  ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border border-green-500/30'
                  : 'bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/30 hover:border-yellow-500/60'
              }`}
            >
              {/* Animated background */}
              {!hasDailyCodeCompleted() && (
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-transparent to-yellow-500/10"
                />
              )}

              <motion.div 
                className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10 ${
                  hasDailyCodeCompleted() 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                }`}
                animate={!hasDailyCodeCompleted() ? { rotate: [0, 5, -5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {hasDailyCodeCompleted() ? (
                  <Check className="w-7 h-7 text-white" />
                ) : (
                  <Lock className="w-7 h-7 text-white" />
                )}
              </motion.div>
              
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-base ${hasDailyCodeCompleted() ? 'text-green-500' : 'text-foreground'}`}>
                    Daily Secret Code
                  </h3>
                  {!hasDailyCodeCompleted() && (
                    <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                      <Star className="w-3 h-3 mr-1" /> Special
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasDailyCodeCompleted() ? 'Completed today!' : 'Enter the secret code to earn'}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  <img 
                    src="/lovable-uploads/bb2ce9b7-afd0-4e2c-8447-351c0ae1f27d.png" 
                    alt="BOLT" 
                    className="w-5 h-5"
                  />
                  <span className={`font-bold ${hasDailyCodeCompleted() ? 'text-green-500' : 'text-yellow-500'}`}>
                    +500 BOLT
                  </span>
                </div>
              </div>

              {hasDailyCodeCompleted() && (
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30 relative z-10">
                  <Check className="w-3 h-3 mr-1" /> Done
                </Badge>
              )}
            </motion.button>

            {/* Timer indicator */}
            {!hasDailyCodeCompleted() && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground"
              >
                <Timer className="w-3 h-3" />
                <span>Resets at midnight UTC</span>
              </motion.div>
            )}
            
            {viralTasks.length > 0 && viralTasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index + 1}
                onComplete={() => handleTaskComplete(task.id, task.task_url || '')}
                completed={isTaskCompleted(task.id)}
              />
            ))}
            
            {viralTasks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <p className="text-muted-foreground text-xs">Check back for more daily tasks</p>
              </motion.div>
            )}
          </TabsContent>
        </Tabs>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6"
        >
          <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-foreground">Pro Tips</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                Complete all tasks for bonus 1000 BOLT
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                Daily secret codes are shared on our channels
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                Partner tasks give extra rewards
              </li>
            </ul>
          </Card>
        </motion.div>

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
