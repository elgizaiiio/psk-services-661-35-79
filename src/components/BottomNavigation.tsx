import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, ListTodo, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Bot, label: 'AI', path: '/apps' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
    { icon: Trophy, label: 'Board', path: '/leaderboard' },
    { icon: Users, label: 'Friends', path: '/invite' },
  ];

  const handleNavigation = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };

  const hideNavigationPaths = ['/runner-game', '/chat-ai'];
  
  if (hideNavigationPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50">
      <div className="flex items-center justify-around py-1.5 px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname;
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 p-1.5 rounded-lg",
                "min-w-[50px] outline-none",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
