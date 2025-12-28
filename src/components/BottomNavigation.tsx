import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Gamepad2, ListTodo, Wallet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Gamepad2, label: 'Game', path: '/game' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
    { icon: Users, label: 'Invite', path: '/invite' },
  ];

  const handleNavigation = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };

  const hideNavigationPaths = ['/runner-game', '/chat-ai', '/krunker', '/game'];

  const activeIndex = navItems.findIndex(item => item.path === location.pathname);

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="bg-card border border-border rounded-2xl max-w-md mx-auto relative">
        {/* Active Indicator */}
        {activeIndex !== -1 && (
          <motion.div
            className="absolute top-0 h-0.5 bg-primary rounded-full"
            initial={false}
            animate={{
              left: `${(activeIndex / navItems.length) * 100 + 100 / navItems.length / 2 - 3}%`,
              width: '6%',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        )}

        <div className="flex items-center justify-around py-2">
          {navItems.map((item, index) => {
            const isActive = item.path === location.pathname;
            const Icon = item.icon;
            
            return (
              <motion.button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors relative",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                <motion.span 
                  className="text-[10px] font-medium"
                  animate={isActive ? { opacity: 1 } : { opacity: 0.7 }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNavigation;
