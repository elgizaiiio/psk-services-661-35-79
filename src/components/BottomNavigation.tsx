import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListTodo, Users, RotateCw, Pickaxe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
    { icon: Pickaxe, label: 'Mining', path: '/mining' },
    { icon: RotateCw, label: 'Spin', path: '/spin' },
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

  const renderNavItem = (item: typeof navItems[0], index: number) => {
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
  };

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,0px)] max-w-md mx-auto">
          {navItems.map((item, index) => renderNavItem(item, index))}
        </div>
      </div>
    </motion.div>
  );
};

export default BottomNavigation;
