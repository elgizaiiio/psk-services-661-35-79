import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bot, ListTodo, Trophy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { motion } from 'framer-motion';

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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/30">
      <div className="flex items-center justify-around py-2 px-2 pb-safe max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname;
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200",
                "min-w-[56px] outline-none",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={cn("w-5 h-5 relative z-10", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium relative z-10", isActive && "font-semibold")}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
