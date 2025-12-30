import React from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Calendar, 
  Zap, 
  Clock, 
  Coins,
  Trophy,
  Target,
  TrendingUp,
  Users,
  Gift,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTasks } from "@/hooks/useTasks";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { formatDistanceToNow } from "date-fns";


const Profile: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: vmUser, activeMiningSession, loading: miningLoading } = useViralMining(tgUser);
  const { completedTasks, loading: tasksLoading } = useTasks();
  const navigate = useNavigate();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  useTelegramBackButton();

  const totalTasksCompleted = completedTasks.length;
  const totalPointsFromTasks = completedTasks.reduce((sum, task) => sum + task.points_earned, 0);

  const stats = [
    {
      label: "Current Balance",
      value: `${vmUser?.token_balance?.toFixed(4) || '0.0000'} BOLT`,
      icon: Coins,
      color: "text-primary"
    },
    {
      label: "Mining Power",
      value: `×${vmUser?.mining_power || 1}`,
      icon: Zap,
      color: "text-yellow-500"
    },
    {
      label: "Mining Duration",
      value: `${vmUser?.mining_duration_hours || 4} hours`,
      icon: Clock,
      color: "text-blue-500"
    },
    {
      label: "Servers",
      value: '-',
      icon: Trophy,
      color: "text-purple-500"
    },
    {
      label: "Tasks Completed",
      value: totalTasksCompleted.toString(),
      icon: Target,
      color: "text-green-500"
    },
    {
      label: "Points from Tasks",
      value: totalPointsFromTasks.toString(),
      icon: Gift,
      color: "text-orange-500"
    }
  ];

  const miningStats = activeMiningSession ? [
    {
      label: "Session Started",
      value: formatDistanceToNow(new Date(activeMiningSession.start_time), { addSuffix: true }),
    },
    {
      label: "Session Ends",
      value: formatDistanceToNow(new Date(activeMiningSession.end_time), { addSuffix: true }),
    },
    {
      label: "Tokens per Hour",
      value: `${activeMiningSession.tokens_per_hour} BOLT`,
    },
    {
      label: "Total Expected",
      value: `${(activeMiningSession.tokens_per_hour * (activeMiningSession as any).mining_power * vmUser?.mining_duration_hours || 0).toFixed(4)} BOLT`,
    }
  ] : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Profile",
    description: "View your BOLT mining profile, stats, and achievements.",
    url: currentUrl,
  };

  if (miningLoading || tasksLoading) {
    return (
        <div className="safe-area">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile | Your BOLT Mining Stats</title>
        <meta name="description" content="View your BOLT mining profile, stats, and achievements." />
        <meta property="og:title" content="Profile | Your BOLT Mining Stats" />
        <meta property="og:description" content="View your BOLT mining profile, stats, and achievements." />
        <meta property="og:url" content={currentUrl} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <main className="safe-area pb-24">
        <div className="max-w-md mx-auto px-4 pt-16 pb-6 space-y-6">
          
          {/* Settings Button */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              className="rounded-full"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* User Profile Header */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 ring-4 ring-primary/20">
                  <AvatarImage src={tgUser?.photo_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {tgUser?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h1 className="text-xl font-bold">
                    {tgUser?.first_name} {tgUser?.last_name}
                  </h1>
                  {tgUser?.username && (
                    <p className="text-muted-foreground">@{tgUser.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      ID: {tgUser?.id}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Joined {vmUser ? formatDistanceToNow(new Date(vmUser.created_at), { addSuffix: true }) : 'recently'}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <TrendingUp className="w-5 h-5 mr-2" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted/20 border border-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                    <p className="font-bold text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Mining Session */}
          {activeMiningSession && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Zap className="w-5 h-5 mr-2 text-primary" />
                  Active Mining Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {miningStats.map((stat, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="font-medium text-sm">{stat.value}</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Mining Status</span>
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your mining session is currently running and generating BOLT tokens.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <User className="w-5 h-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Telegram ID</span>
                  <span className="font-medium text-sm">{tgUser?.id}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <span className="font-medium text-sm">{tgUser?.language_code || 'en'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Active</span>
                  <span className="font-medium text-sm">
                    {vmUser?.updated_at ? 
                      formatDistanceToNow(new Date(vmUser.updated_at), { addSuffix: true }) :
                      'Just now'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Created</span>
                  <span className="font-medium text-sm">
                    {vmUser ? 
                      formatDistanceToNow(new Date(vmUser.created_at), { addSuffix: true }) : 
                      'Recently'
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
};

export default Profile;