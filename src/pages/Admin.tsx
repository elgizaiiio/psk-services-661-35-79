import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Settings, Users, Activity, Target, Clock, TrendingUp, Shield, Plus, Star, Wallet, Megaphone, Image, LayoutGrid } from "lucide-react";
import AdminMetrics from "@/components/admin/AdminMetrics";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminTaskManagement from "@/components/admin/AdminTaskManagement";
import AdminDailyCodes from "@/components/admin/AdminDailyCodes";
import AdminMiningData from "@/components/admin/AdminMiningData";
import AdminUpgrades from "@/components/admin/AdminUpgrades";
import AdminStarsPayments from "@/components/admin/AdminStarsPayments";
import AdminTonPayments from "@/components/admin/AdminTonPayments";
import AdminMarketing from "@/components/admin/AdminMarketing";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminHomeSections from "@/components/admin/AdminHomeSections";
import { BoltUser, BoltTask, BoltMiningSession, BoltDailyCode } from "@/types/bolt";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { isAdmin, ADMIN_TELEGRAM_ID } from "@/lib/admin-constants";

type Upgrade = {
  id: string;
  user_id: string;
  upgrade_type: string;
  upgrade_level: number;
  cost_ton: number;
  transaction_hash?: string;
  created_at: string;
};

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading } = useTelegramAuth();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<BoltTask[]>([]);
  const [codes, setCodes] = useState<Partial<BoltDailyCode> | null>(null);
  const [metrics, setMetrics] = useState<{ users: number; active24h: number; codeAnswers24h: number; completedTasks24h: number; totalTokens: number; totalUpgrades: number } | null>(null);
  const [users, setUsers] = useState<BoltUser[]>([]);
  const [miningSessions, setMiningSessions] = useState<BoltMiningSession[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);

  // Check admin access using Telegram ID
  useEffect(() => {
    if (!authLoading && telegramUser) {
      const hasAccess = isAdmin(telegramUser.id);
      setIsAuthenticated(hasAccess);
      
      if (!hasAccess) {
        toast.error('Access denied. Admin only.');
        navigate('/');
      }
    }
  }, [telegramUser, authLoading, navigate]);

  const loadTasks = async () => {
    const { data } = await supabase.from("bolt_tasks" as any).select("*").order("created_at", { ascending: false });
    setTasks((data || []) as unknown as BoltTask[]);
  };

  const loadCodes = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("bolt_daily_codes" as any).select("*").eq("date", today).maybeSingle();
    if (data) {
      const codeData = data as unknown as BoltDailyCode;
      setCodes({ id: codeData.id, code1: codeData.code1, code2: codeData.code2, code3: codeData.code3, code4: codeData.code4, points_reward: codeData.points_reward });
    } else {
      setCodes({ code1: "", code2: "", code3: "", code4: "", points_reward: 100 });
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("bolt_users" as any).select("*").order("created_at", { ascending: false });
    setUsers((data || []) as unknown as BoltUser[]);
  };

  const loadMiningSessions = async () => {
    const { data } = await supabase.from("bolt_mining_sessions" as any).select("*").order("created_at", { ascending: false }).limit(50);
    setMiningSessions((data || []) as unknown as BoltMiningSession[]);
  };

  const loadUpgrades = async () => {
    setUpgrades([]);
  };

  const loadMetrics = async () => {
    const sinceIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [
      { count: usersCount }, 
      { data: activeUsers }, 
      { count: codeAnswers24h }, 
      { count: completedTasks24h },
      { data: totalTokensData },
    ] = await Promise.all([
      supabase.from("bolt_users" as any).select("*", { count: "exact", head: true }),
      supabase.from("bolt_users" as any).select("id,updated_at").gt("updated_at", sinceIso),
      supabase.from("bolt_daily_code_attempts" as any).select("*", { count: "exact", head: true }).gt("completed_at", sinceIso),
      supabase.from("bolt_completed_tasks" as any).select("*", { count: "exact", head: true }).gt("completed_at", sinceIso),
      supabase.from("bolt_users" as any).select("token_balance"),
    ]);
    
    const totalTokens = ((totalTokensData || []) as unknown as { token_balance: number }[]).reduce((sum, user) => sum + (Number(user.token_balance) || 0), 0);
    
    setMetrics({
      users: usersCount || 0,
      active24h: activeUsers?.length || 0,
      codeAnswers24h: codeAnswers24h || 0,
      completedTasks24h: completedTasks24h || 0,
      totalTokens: totalTokens,
      totalUpgrades: 0,
    });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTasks(), loadCodes(), loadMetrics(), loadUsers(), loadMiningSessions(), loadUpgrades()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <div className="text-2xl font-bold mb-4">Admin Panel</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading admin data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50">
      <Helmet>
        <title>Admin Panel | BOLT</title>
        <meta name="description" content="BOLT admin panel for managing users, tasks, and system settings" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage your BOLT platform</p>
            </div>
          </div>
          <Button onClick={loadAllData} variant="outline" size="sm">Refresh Data</Button>
        </div>

        <AdminMetrics metrics={metrics} />

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-10 mb-6">
            <TabsTrigger value="users"><Users className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="mining"><Activity className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="tasks"><Target className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="daily"><Clock className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="home"><LayoutGrid className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="marketing"><Megaphone className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="banners"><Image className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="stars"><Star className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="ton"><Wallet className="w-4 h-4" /></TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <AdminUserManagement users={users} onUsersUpdate={loadUsers} onMetricsUpdate={loadMetrics} />
          </TabsContent>

          <TabsContent value="mining">
            <AdminMiningData miningSessions={miningSessions as any} />
          </TabsContent>

          <TabsContent value="tasks">
            <AdminTaskManagement tasks={tasks as any} onTasksUpdate={loadTasks} />
          </TabsContent>

          <TabsContent value="daily">
            <AdminDailyCodes codes={codes} setCodes={setCodes} onCodesUpdate={loadCodes} />
          </TabsContent>

          <TabsContent value="home">
            <AdminHomeSections />
          </TabsContent>

          <TabsContent value="marketing">
            <AdminMarketing />
          </TabsContent>

          <TabsContent value="banners">
            <AdminBanners />
          </TabsContent>

          <TabsContent value="stars">
            <AdminStarsPayments />
          </TabsContent>

          <TabsContent value="ton">
            <AdminTonPayments />
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-4">System Status</h3>
              <Badge variant="default">Connected</Badge>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
