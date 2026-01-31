import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PointsGuideProps {
  className?: string;
}

const pointRules = [
  { action: 'Buy a Mining Server', points: '+100' },
  { action: 'Invite a friend', points: '+10' },
  { action: 'Friend completes a task', points: '+5' },
  { action: 'Complete a task', points: '+5' },
  { action: 'Special Task (0.5 TON)', points: '+10' },
  { action: 'Watch an ad', points: '+2', note: 'No limit' },
  { action: 'Daily mining check-in', points: '+1' },
  { action: '3-day activity streak', points: '+5' },
];

export const PointsGuide: React.FC<PointsGuideProps> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('p-5 rounded-2xl bg-card border border-border', className)}
    >
      <h3 className="font-bold text-lg mb-4">How to Earn Points</h3>

      <div className="space-y-3">
        {pointRules.map((rule, index) => (
          <motion.div
            key={rule.action}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-foreground">{rule.action}</span>
              {rule.note && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
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
