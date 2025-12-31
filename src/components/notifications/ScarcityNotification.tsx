import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp } from 'lucide-react';

interface ScarcityNotificationProps {
  isVisible: boolean;
  onDismiss: () => void;
}

const MESSAGES = [
  { icon: Users, text: 'viewing this offer right now', count: () => Math.floor(Math.random() * 10) + 8 },
  { icon: TrendingUp, text: 'people subscribed in the last hour', count: () => Math.floor(Math.random() * 15) + 5 },
];

const ScarcityNotification: React.FC<ScarcityNotificationProps> = ({ isVisible, onDismiss }) => {
  const [message, setMessage] = useState(MESSAGES[0]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const randomMessage = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setMessage(randomMessage);
      setCount(randomMessage.count());

      // Auto dismiss after 5 seconds
      const timeout = setTimeout(() => {
        onDismiss();
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isVisible, onDismiss]);

  const Icon = message.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%]"
        >
          <div className="bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-foreground">
              <span className="font-bold text-primary">{count}</span>{' '}
              <span className="text-muted-foreground">{message.text}</span>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScarcityNotification;
