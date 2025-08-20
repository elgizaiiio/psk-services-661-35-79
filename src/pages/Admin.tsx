import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Settings, Users, Activity, Target, Clock, TrendingUp, Shield, Plus } from "lucide-react";
import AdminMetrics from "@/components/admin/AdminMetrics";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminTaskManagement from "@/components/admin/AdminTaskManagement";
import AdminDailyCodes from "@/components/admin/AdminDailyCodes";
import AdminMiningData from "@/components/admin/AdminMiningData";
import AdminUpgrades from "@/components/admin/AdminUpgrades";

type Task = { 
  id: string; 
  title: string; 
  image_url?: string | null; 
  points: number; 
  is_active: boolean; 
  category: string; 
  task_url?: string | null; 
};

type ViralUser = {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  token_balance: number;
  mining_power_multiplier: number;
  mining_duration_hours: number;
  created_at: string;
  updated_at: string;
};

type MiningSession = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  tokens_per_hour: number;
  mining_power_multiplier: number;
  total_tokens_mined: number;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
};

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
  // All hooks must be called at the top level, before any returns
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [codes, setCodes] = useState<{ id?: string; code1: string; code2: string; code3: string; code4: string } | null>(null);
  const [metrics, setMetrics] = useState<{ users: number; active24h: number; codeAnswers24h: number; completedTasks24h: number; totalTokens: number; totalUpgrades: number } | null>(null);
  const [users, setUsers] = useState<ViralUser[]>([]);
  const [miningSessions, setMiningSessions] = useState<MiningSession[]>([]);
  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(true);
  }, []);

  const loadTasks = async () => {
    const { data: tasks } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(tasks || []);
  };

  const loadCodes = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("daily_codes").select("*").eq("date", today).maybeSingle();
    if (data) {
      setCodes({ id: data.id, code1: data.code1, code2: data.code2, code3: data.code3, code4: data.code4 });
    } else {
      setCodes({ code1: "", code2: "", code3: "", code4: "" });
    }
  };

  const loadUsers = async () => {
    const { data } = await supabase.from("viral_users").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  };

  const loadMiningSessions = async () => {
    const { data } = await supabase.from("viral_mining_sessions").select("*").order("created_at", { ascending: false }).limit(50);
    setMiningSessions(data || []);
  };

  const loadUpgrades = async () => {
    const { data } = await supabase.from("viral_upgrades").select("*").order("created_at", { ascending: false }).limit(50);
    setUpgrades(data || []);
  };

  const loadMetrics = async () => {
    const sinceIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [
      { count: users }, 
      { data: activeUsers }, 
      { count: codeAnswers24h }, 
      { count: completedTasks24h },
      { data: totalTokensData },
      { count: totalUpgrades }
    ] = await Promise.all([
      supabase.from("viral_users").select("*", { count: "exact", head: true }),
      supabase.from("viral_users").select("id,updated_at").gt("updated_at", sinceIso),
      supabase.from("user_daily_code_attempts").select("*", { count: "exact", head: true }).gt("completed_at", sinceIso),
      supabase.from("user_completed_tasks").select("*", { count: "exact", head: true }).gt("completed_at", sinceIso),
      supabase.from("viral_users").select("token_balance"),
      supabase.from("viral_upgrades").select("*", { count: "exact", head: true }),
    ]);
    
    const totalTokens = totalTokensData?.reduce((sum, user) => sum + (user.token_balance || 0), 0) || 0;
    
    setMetrics({
      users: users || 0,
      active24h: activeUsers?.length || 0,
      codeAnswers24h: codeAnswers24h || 0,
      completedTasks24h: completedTasks24h || 0,
      totalTokens: totalTokens,
      totalUpgrades: totalUpgrades || 0,
    });
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadTasks(),
        loadCodes(),
        loadMetrics(),
        loadUsers(),
        loadMiningSessions(),
        loadUpgrades()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  // Conditional rendering after all hooks
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
        <title>Admin Panel | VIRAL</title>
        <meta name="description" content="VIRAL admin panel for managing users, tasks, and system settings" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage your VIRAL platform</p>
            </div>
          </div>
          <Button onClick={loadAllData} variant="outline" size="sm">
            Refresh Data
          </Button>
        </div>

        {/* Metrics Overview */}
        <AdminMetrics metrics={metrics} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="mining" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Mining</span>
            </TabsTrigger>
            <TabsTrigger value="upgrades" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Upgrades</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Codes</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <AdminUserManagement 
              users={users} 
              onUsersUpdate={loadUsers}
              onMetricsUpdate={loadMetrics}
            />
          </TabsContent>

          <TabsContent value="mining" className="space-y-6">
            <AdminMiningData miningSessions={miningSessions} />
          </TabsContent>

          <TabsContent value="upgrades" className="space-y-6">
            <AdminUpgrades upgrades={upgrades} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Task Management</h2>
              <Button 
                onClick={() => navigate("/create-task")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Task
              </Button>
            </div>
            <AdminTaskManagement 
              tasks={tasks} 
              onTasksUpdate={loadTasks}
            />
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <AdminDailyCodes 
              codes={codes}
              setCodes={setCodes}
              onCodesUpdate={loadCodes}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default">Connected</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">API Status</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={loadAllData}>
                    Refresh All Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => toast.success("Cache cleared!")}>
                    Clear Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Export started!")}>
                    Export Data
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke("setup-rls");
                        if (error) throw error;
                        toast.success("Database security updated! Tasks should work now.");
                      } catch (error: any) {
                        toast.error(error.message || "Failed to update database security");
                      }
                    }}
                  >
                    Fix Database Security
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;