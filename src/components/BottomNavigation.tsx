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
    { icon: Trophy, label: 'Rank', path: '/leaderboard' },
    { icon: Users, label: 'Invite', path: '/invite' },
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent -top-4 pointer-events-none" />
      
      <div className="relative bg-card/80 backdrop-blur-xl border-t border-border/30 mx-3 mb-3 rounded-2xl shadow-2xl shadow-black/20">
        <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
          {navItems.map((item, index) => {
            const isActive = item.path === location.pathname;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-300",
                  "min-w-[52px] outline-none",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-primary/15 rounded-xl border border-primary/20"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                  />
                )}
                
                <div className="relative z-10">
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "drop-shadow-[0_0_10px_hsl(var(--primary))]"
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary"
                    />
                  )}
                </div>
                
                <span className={cn(
                  "text-[10px] font-medium relative z-10 transition-all duration-300",
                  isActive && "font-bold"
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
