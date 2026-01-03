import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ListTodo, Wallet, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticFeedback } = useTelegramAuth();

  const leftNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ListTodo, label: 'Tasks', path: '/tasks' },
  ];

  const rightNavItems = [
    { icon: Users, label: 'Invite', path: '/invite' },
    { icon: Wallet, label: 'Wallet', path: '/wallet' },
  ];

  const handleNavigation = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };

  const hideNavigationPaths = ['/runner-game', '/chat-ai'];
  
  if (hideNavigationPaths.includes(location.pathname)) {
    return null;
  }

  const allNavItems = [...leftNavItems, ...rightNavItems];
  const activeIndex = allNavItems.findIndex(item => item.path === location.pathname);
  const isSpinActive = location.pathname === '/spin';

  const renderNavItem = (item: typeof leftNavItems[0], index: number) => {
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
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="bg-card border border-border rounded-2xl max-w-md mx-auto relative">
        <div className="flex items-center justify-around py-2">
          {/* Left nav items */}
          {leftNavItems.map((item, index) => renderNavItem(item, index))}
          
          {/* Center Spin Button */}
          <motion.button
            onClick={() => handleNavigation('/spin')}
            className={cn(
              "relative -mt-8 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all",
              isSpinActive 
                ? "bg-primary text-primary-foreground shadow-primary/40" 
                : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/40"
            )}
            whileTap={{ scale: 0.9, rotate: 180 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <motion.div
              animate={isSpinActive ? { rotate: 360 } : { rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <svg 
                className="w-7 h-7" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 0 20" />
                <path d="M12 6v6l4 2" />
              </svg>
            </motion.div>
            {/* Glow effect */}
            <div className={cn(
              "absolute inset-0 rounded-full blur-lg opacity-50 -z-10",
              isSpinActive 
                ? "bg-primary" 
                : "bg-gradient-to-br from-amber-500 to-orange-600"
            )} />
          </motion.button>
          
          {/* Right nav items */}
          {rightNavItems.map((item, index) => renderNavItem(item, index + 2))}
        </div>
        
        {/* Spin label below the button */}
        <motion.span 
          className={cn(
            "absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] font-semibold",
            isSpinActive ? "text-primary" : "text-amber-500"
          )}
        >
          Spin
        </motion.span>
      </div>
    </motion.div>
  );
};

export default BottomNavigation;
