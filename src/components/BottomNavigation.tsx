import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid2X2, ListChecks, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Grid2X2, label: 'AI', path: '/apps' },
    { icon: ListChecks, label: 'Tasks', path: '/tasks' },
    { icon: Trophy, label: 'Board', path: '/leaderboard' },
    { icon: Users, label: 'Friends', path: '/invite' },
  ];

  const handleNavigation = (item: typeof navItems[0]) => {
    hapticFeedback.impact('light');
    if (item.path) {
      navigate(item.path);
    }
  };

  const hideNavigationPaths = ['/runner-game', '/chat-ai'];
  
  if (hideNavigationPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.label}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item)}
              className={cn(
                "flex flex-col items-center gap-0.5 p-2 h-auto min-h-12 rounded-lg",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
                {item.label}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
