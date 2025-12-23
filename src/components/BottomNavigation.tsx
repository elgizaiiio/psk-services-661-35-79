import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, Sparkles, Target, Crown, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { motion } from 'framer-motion';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const navItems = [
    { icon: Zap, label: 'Home', path: '/' },
    { icon: Sparkles, label: 'AI', path: '/apps' },
    { icon: Target, label: 'Tasks', path: '/tasks' },
    { icon: Crown, label: 'Board', path: '/leaderboard' },
    { icon: UserPlus, label: 'Friends', path: '/invite' },
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
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient blur background */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-xl" />
      
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="relative flex items-center justify-around py-2 px-2 pb-safe">
        {navItems.map((item, index) => {
          const isActive = item.path === location.pathname;
          const Icon = item.icon;
          
          return (
            <motion.button
              key={item.label}
              onClick={() => handleNavigation(item)}
              className={cn(
                "relative flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300",
                "min-w-[60px] outline-none",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Active background glow */}
              {isActive && (
                <motion.div
                  layoutId="navActiveBackground"
                  className="absolute inset-0 rounded-2xl bg-primary/15 border border-primary/30"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
                />
              )}
              
              {/* Active top indicator */}
              {isActive && (
                <motion.div
                  layoutId="navActiveIndicator"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                />
              )}
              
              {/* Icon container */}
              <motion.div
                className={cn(
                  "relative z-10 p-1.5 rounded-xl transition-all duration-300",
                  isActive && "bg-primary/20"
                )}
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                
                {/* Icon glow for active state */}
                {isActive && (
                  <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md -z-10" />
                )}
              </motion.div>
              
              {/* Label */}
              <motion.span 
                className={cn(
                  "relative z-10 text-[10px] font-medium transition-all duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                animate={{
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {item.label}
              </motion.span>
              
              {/* Hover ripple effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.button>
          );
        })}
      </div>
      
      {/* Bottom safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </div>
  );
};

export default BottomNavigation;
