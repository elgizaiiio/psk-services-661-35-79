import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const hideNavigationPaths = ['/runner-game', '/chat-ai', '/krunker'];
  
  if (hideNavigationPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="bg-card border border-border rounded-2xl max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = item.path === location.pathname;
            const Icon = item.icon;
            
            return (
              <button
                key={item.label}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
