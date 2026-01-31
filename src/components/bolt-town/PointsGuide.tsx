import React from 'react';
import { motion } from 'framer-motion';
import { Users, CheckSquare, Star, Play, Flame, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PointsGuideProps {
  className?: string;
}

const pointRules = [
  {
    icon: <Users className="w-4 h-4" />,
    action: 'Invite a friend',
    points: '+10',
    color: 'text-blue-400 bg-blue-500/20',
  },
  {
    icon: <Users className="w-4 h-4" />,
    action: 'Friend completes a task',
    points: '+5',
    color: 'text-blue-400 bg-blue-500/20',
  },
  {
    icon: <CheckSquare className="w-4 h-4" />,
    action: 'Complete a task',
    points: '+5',
    color: 'text-green-400 bg-green-500/20',
  },
  {
    icon: <Star className="w-4 h-4" />,
    action: 'Special Task (0.5 TON)',
    points: '+10',
    color: 'text-yellow-400 bg-yellow-500/20',
  },
  {
    icon: <Play className="w-4 h-4" />,
    action: 'Watch an ad',
    points: '+2',
    color: 'text-purple-400 bg-purple-500/20',
    note: 'No limit!',
  },
  {
    icon: <Flame className="w-4 h-4" />,
    action: 'Daily mining check-in',
    points: '+1',
    color: 'text-orange-400 bg-orange-500/20',
  },
  {
    icon: <Flame className="w-4 h-4" />,
    action: '3-day activity streak',
    points: '+5',
    color: 'text-orange-400 bg-orange-500/20',
  },
];

export const PointsGuide: React.FC<PointsGuideProps> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-4 rounded-xl bg-muted/50 border border-border', className)}
    >
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm">How to Earn Points</h3>
      </div>

      <div className="space-y-2">
        {pointRules.map((rule, index) => (
          <motion.div
            key={rule.action}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', rule.color)}>
                {rule.icon}
              </div>
              <span className="text-muted-foreground">{rule.action}</span>
              {rule.note && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                  {rule.note}
                </span>
              )}
            </div>
            <span className="font-semibold text-primary">{rule.points}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
