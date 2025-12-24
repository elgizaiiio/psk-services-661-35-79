import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AchievementNotification {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
}

interface AchievementUnlockNotificationProps {
  achievement: AchievementNotification | null;
  onClose: () => void;
}

const AchievementUnlockNotification = ({ achievement, onClose }: AchievementUnlockNotificationProps) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (achievement) {
      // Generate confetti particles
      const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD'][Math.floor(Math.random() * 6)]
      }));
      setConfetti(particles);

      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className="w-12 h-12 text-yellow-400" />;
      case 'star':
        return <Star className="w-12 h-12 text-yellow-400" />;
      default:
        return <Sparkles className="w-12 h-12 text-yellow-400" />;
    }
  };

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
        >
          {/* Confetti */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ 
                y: -20, 
                x: `${particle.x}vw`,
                opacity: 1,
                scale: 1
              }}
              animate={{ 
                y: '100vh',
                rotate: 360 * 3,
                opacity: 0
              }}
              transition={{ 
                duration: 3,
                delay: particle.delay,
                ease: 'linear'
              }}
              className="absolute top-0 w-3 h-3 rounded-full"
              style={{ 
                backgroundColor: particle.color,
                left: 0
              }}
            />
          ))}

          {/* Achievement Card */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 15
            }}
            className="relative bg-gradient-to-br from-yellow-900/90 via-amber-800/90 to-yellow-900/90 rounded-3xl p-8 max-w-sm w-full border-2 border-yellow-500/50 shadow-2xl"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-2 right-2 text-yellow-300 hover:text-yellow-100"
            >
              <X className="w-5 h-5" />
            </Button>

            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-3xl bg-yellow-400/20 blur-xl -z-10" />

            {/* Header */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-6"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="inline-block"
              >
                <Sparkles className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
              </motion.div>
              <h2 className="text-2xl font-bold text-yellow-300">🎉 إنجاز جديد!</h2>
            </motion.div>

            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="flex justify-center mb-6"
            >
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255, 215, 0, 0.5)',
                    '0 0 40px rgba(255, 215, 0, 0.8)',
                    '0 0 20px rgba(255, 215, 0, 0.5)'
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center"
              >
                {getIconComponent(achievement.icon)}
              </motion.div>
            </motion.div>

            {/* Achievement Name */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold text-white mb-2">{achievement.name}</h3>
              <p className="text-yellow-200/80 text-sm mb-4">{achievement.description}</p>
            </motion.div>

            {/* Reward */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="bg-yellow-500/20 rounded-xl p-4 text-center"
            >
              <p className="text-yellow-300 text-sm mb-1">المكافأة</p>
              <motion.p
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-2xl font-bold text-yellow-400"
              >
                +{achievement.reward.toLocaleString()} VIRAL
              </motion.p>
            </motion.div>

            {/* Collect Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold py-3 rounded-xl"
              >
                <Trophy className="w-5 h-5 mr-2" />
                استلام المكافأة
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementUnlockNotification;
