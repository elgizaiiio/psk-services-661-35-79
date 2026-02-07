import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { BoltUser, BoltMiningSession, BoltTask, BoltCompletedTask } from '@/types/bolt';

// Types for dashboard data
interface DashboardData {
  user: BoltUser | null;
  miningSession: BoltMiningSession | null;
  completedTaskIds: string[];
  streakData: {
    currentStreak: number;
    canClaim: boolean;
    lastClaimDate: string | null;
  } | null;
  completedSession?: {
    totalReward: number;
  } | null;
}

interface UserContextValue {
  // User data
  user: BoltUser | null;
  userId: string | null;
  telegramId: number | null;
  
  // Mining data
  miningSession: BoltMiningSession | null;
  
  // Tasks data
  completedTaskIds: string[];
  
  // Streak data
  streakData: DashboardData['streakData'];
  
  // Loading states
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  refreshAll: () => void;
  refreshUser: () => void;
  invalidateTasks: () => void;
  invalidateMining: () => void;
  
  // Optimistic updates
  updateUserBalance: (newBalance: number) => void;
  addCompletedTaskId: (taskId: string) => void;
  setMiningSession: (session: BoltMiningSession | null) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

// Cache keys
export const USER_DASHBOARD_KEY = 'user-dashboard';
export const TASKS_KEY = 'bolt-tasks';

// Stale times (in milliseconds)
const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 30 * 60 * 1000; // 30 minutes

export function UserProvider({ children }: { children: ReactNode }) {
  const { user: telegramUser, isLoading: isTelegramLoading } = useTelegramAuth();
  const queryClient = useQueryClient();

  // Main dashboard query - fetches all user data in one call
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error,
    refetch: refetchDashboard,
  } = useQuery<DashboardData>({
    queryKey: [USER_DASHBOARD_KEY, telegramUser?.id],
    queryFn: async () => {
      if (!telegramUser?.id) {
        return {
          user: null,
          miningSession: null,
          completedTaskIds: [],
          streakData: null,
        };
      }

      const initData = window.Telegram?.WebApp?.initData || '';

      // Call unified edge function
      const { data, error } = await supabase.functions.invoke('get-user-dashboard', {
        body: { telegramUser },
        headers: {
          'x-telegram-init-data': initData,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        user: data.user as BoltUser | null,
        miningSession: data.miningSession as BoltMiningSession | null,
        completedTaskIds: data.completedTaskIds || [],
        streakData: data.streakData || null,
        completedSession: data.completedSession || null,
      };
    },
    enabled: !!telegramUser?.id && !isTelegramLoading,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Actions
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: [USER_DASHBOARD_KEY] });
  };

  const refreshUser = () => {
    refetchDashboard();
  };

  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: [TASKS_KEY] });
    refetchDashboard();
  };

  const invalidateMining = () => {
    refetchDashboard();
  };

  // Optimistic updates
  const updateUserBalance = (newBalance: number) => {
    queryClient.setQueryData<DashboardData>(
      [USER_DASHBOARD_KEY, telegramUser?.id],
      (old) => {
        if (!old?.user) return old;
        return {
          ...old,
          user: { ...old.user, token_balance: newBalance },
        };
      }
    );
  };

  const addCompletedTaskId = (taskId: string) => {
    queryClient.setQueryData<DashboardData>(
      [USER_DASHBOARD_KEY, telegramUser?.id],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          completedTaskIds: [...old.completedTaskIds, taskId],
        };
      }
    );
  };

  const setMiningSession = (session: BoltMiningSession | null) => {
    queryClient.setQueryData<DashboardData>(
      [USER_DASHBOARD_KEY, telegramUser?.id],
      (old) => {
        if (!old) return old;
        return {
          ...old,
          miningSession: session,
        };
      }
    );
  };

  const value: UserContextValue = {
    user: dashboardData?.user || null,
    userId: dashboardData?.user?.id || null,
    telegramId: telegramUser?.id || null,
    miningSession: dashboardData?.miningSession || null,
    completedTaskIds: dashboardData?.completedTaskIds || [],
    streakData: dashboardData?.streakData || null,
    isLoading: isTelegramLoading || isDashboardLoading,
    error: error as Error | null,
    refreshAll,
    refreshUser,
    invalidateTasks,
    invalidateMining,
    updateUserBalance,
    addCompletedTaskId,
    setMiningSession,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}

// Optional hook that doesn't throw if used outside provider
export function useOptionalUserContext() {
  return useContext(UserContext);
}
