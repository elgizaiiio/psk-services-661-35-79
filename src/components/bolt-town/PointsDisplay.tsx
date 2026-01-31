import React from 'react';
import { motion } from 'framer-motion';
import { BoltTownPoints } from '@/hooks/useBoltTown';

interface PointsDisplayProps {
  points: BoltTownPoints | null;
  rank: number | null;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ points, rank }) => {
  const totalPoints = points?.total_points || 0;

  const pointItems = [
    { label: 'Referrals', value: (points?.referral_points || 0) + (points?.referral_bonus_points || 0) },
    { label: 'Tasks', value: points?.task_points || 0 },
    { label: 'Special Task', value: points?.special_task_points || 0 },
    { label: 'Ads', value: points?.ad_points || 0 },
    { label: 'Activity', value: (points?.activity_points || 0) + (points?.streak_bonus || 0) },
  ];

  return (
    <div className="space-y-4">
      {/* Total Points & Rank */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Your Points Today</p>
            <p className="text-4xl font-bold text-primary">{totalPoints}</p>
          </div>
          {rank && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Rank</p>
              <p className="text-3xl font-bold">#{rank}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-5 gap-2">
        {pointItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="p-2 rounded-xl bg-muted/50 text-center"
          >
            <p className="text-lg font-bold">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
