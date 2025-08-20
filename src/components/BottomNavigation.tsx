
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
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: Users, label: 'Friends', path: '/invite' },
  ];

  const handleNavigation = (item: typeof navItems[0]) => {
    hapticFeedback.impact('light');
    if (item.path) {
      navigate(item.path);
    }
  };

  // Hide navigation on specific pages that have their own navigation
  const hideNavigationPaths = ['/runner-game', '/chat-ai'];
  
  if (hideNavigationPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border/50 z-50 shadow-lg">
      <div className="flex items-center justify-around py-1 px-1">
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
                "flex flex-col items-center gap-0.5 p-1 h-auto min-h-10 transition-all duration-300 rounded-xl",
                isActive 
                  ? "text-primary bg-primary/15 shadow-md scale-105 border border-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-102"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 transition-all duration-300", 
                isActive && "text-primary drop-shadow-sm"
              )} />
              <span className={cn(
                "text-[10px] transition-all duration-300", 
                isActive ? "text-primary font-medium" : "text-muted-foreground"
              )}>
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
