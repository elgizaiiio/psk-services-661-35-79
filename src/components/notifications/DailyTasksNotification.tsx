import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, Gift, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface DailyTasksNotificationProps {
  isVisible: boolean;
  availableTasks: number;
  totalRewards: number;
  onDismiss: () => void;
  onNavigate: () => void;
}

const DailyTasksNotification = ({
  isVisible,
  availableTasks,
  totalRewards,
  onDismiss,
  onNavigate
}: DailyTasksNotificationProps) => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    onNavigate();
    navigate('/daily-tasks');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Notification Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-sm mx-auto"
          >
            <div className="relative bg-gradient-to-br from-green-900/95 via-emerald-800/95 to-green-900/95 rounded-3xl p-6 border-2 border-green-500/50 shadow-2xl overflow-hidden">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-green-400/10 blur-xl" />
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="absolute top-2 right-2 text-green-300 hover:text-green-100 z-10"
              >
                <X className="w-5 h-5" />
              </Button>

              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg"
                >
                  <Calendar className="w-10 h-10 text-white" />
                </motion.div>

                {/* Title */}
                <div className="text-center mb-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-bold text-green-300 mb-1">
                      🌟 New Tasks!
                    </h2>
                    <p className="text-green-200/80 text-sm">
                      Daily tasks have been refreshed
                    </p>
                  </motion.div>
                </div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-2 gap-3 mb-5"
                >
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <Sparkles className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{availableTasks}</p>
                    <p className="text-xs text-green-300">Tasks Available</p>
                  </div>
                  <div className="bg-green-500/20 rounded-xl p-3 text-center">
                    <Gift className="w-5 h-5 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{totalRewards.toLocaleString()}</p>
                    <p className="text-xs text-green-300">BOLT to Earn</p>
                  </div>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Button
                    onClick={handleNavigate}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-3 rounded-xl"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    View Tasks
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button
                    onClick={onDismiss}
                    variant="ghost"
                    className="w-full text-green-300 hover:text-green-100 hover:bg-green-500/20"
                  >
                    Later
                  </Button>
                </motion.div>
              </div>

              {/* Floating Particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: [0, 1, 0],
                    y: -50,
                    x: Math.random() * 40 - 20
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.3,
                    repeat: Infinity
                  }}
                  className="absolute bottom-10 w-2 h-2 rounded-full bg-green-400"
                  style={{ left: `${20 + i * 12}%` }}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DailyTasksNotification;
