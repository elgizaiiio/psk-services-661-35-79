import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Gift, Zap } from 'lucide-react';

interface SocialProofToastProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const NAMES = [
  'Alex', 'Sam', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 
  'Jamie', 'Drew', 'Quinn', 'Avery', 'Blake', 'Charlie', 'Dakota'
];

const ACTIONS = [
  { type: 'vip', message: 'just bought Gold VIP', icon: Crown, color: 'text-amber-500' },
  { type: 'spin', message: 'won 500 BOLT in Lucky Spin', icon: Gift, color: 'text-primary' },
  { type: 'vip', message: 'upgraded to Platinum VIP', icon: Crown, color: 'text-purple-400' },
  { type: 'mining', message: 'started mining with 2x boost', icon: Zap, color: 'text-primary' },
  { type: 'spin', message: 'won 1000 BOLT in Lucky Spin', icon: Gift, color: 'text-primary' },
  { type: 'vip', message: 'just subscribed to Silver VIP', icon: Crown, color: 'text-gray-400' },
];

const SocialProofToast: React.FC<SocialProofToastProps> = ({ isVisible, onDismiss }) => {
  const [notification, setNotification] = useState({ name: '', action: ACTIONS[0] });

  useEffect(() => {
    if (isVisible) {
      // Generate random notification
      const randomName = NAMES[Math.floor(Math.random() * NAMES.length)];
      const randomAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      setNotification({ name: randomName, action: randomAction });

      // Auto dismiss after 4 seconds
      const timeout = setTimeout(() => {
        onDismiss();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, onDismiss]);

  const Icon = notification.action.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%' }}
          className="fixed bottom-28 left-1/2 z-50 max-w-sm w-[90%]"
        >
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-3 shadow-lg flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${notification.action.color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">
                <span className="font-medium">{notification.name}</span>{' '}
                <span className="text-muted-foreground">{notification.action.message}</span>
              </p>
              <p className="text-xs text-muted-foreground">just now</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofToast;
