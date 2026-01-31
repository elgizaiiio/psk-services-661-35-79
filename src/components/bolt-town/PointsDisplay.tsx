import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Users, CheckSquare, Play, Star, Flame } from 'lucide-react';
import { BoltTownPoints } from '@/hooks/useBoltTown';
import { cn } from '@/lib/utils';

interface PointsDisplayProps {
  points: BoltTownPoints | null;
  rank: number | null;
}

interface PointItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay: number;
}

const PointItem: React.FC<PointItemProps> = ({ icon, label, value, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className={cn(
      'flex items-center justify-between p-2 rounded-lg',
      'bg-muted/50 border border-border'
    )}
  >
    <div className="flex items-center gap-2">
      <div className={cn('w-6 h-6 rounded-md flex items-center justify-center', color)}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className="font-semibold text-sm">+{value}</span>
  </motion.div>
);

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ points, rank }) => {
  const totalPoints = points?.total_points || 0;

  const pointItems = [
    {
      icon: <Users className="w-3.5 h-3.5 text-blue-400" />,
      label: 'Referrals',
      value: (points?.referral_points || 0) + (points?.referral_bonus_points || 0),
      color: 'bg-blue-500/20',
    },
    {
      icon: <CheckSquare className="w-3.5 h-3.5 text-green-400" />,
      label: 'Tasks',
      value: points?.task_points || 0,
      color: 'bg-green-500/20',
    },
    {
      icon: <Star className="w-3.5 h-3.5 text-yellow-400" />,
      label: 'Special Task',
      value: points?.special_task_points || 0,
      color: 'bg-yellow-500/20',
    },
    {
      icon: <Play className="w-3.5 h-3.5 text-purple-400" />,
      label: 'Ads Watched',
      value: points?.ad_points || 0,
      color: 'bg-purple-500/20',
    },
    {
      icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
      label: 'Activity',
      value: (points?.activity_points || 0) + (points?.streak_bonus || 0),
      color: 'bg-orange-500/20',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Total Points & Rank */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Your Points Today</p>
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              <span className="text-3xl font-bold text-primary">{totalPoints}</span>
            </div>
          </div>
          {rank && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Rank</p>
              <span className="text-2xl font-bold text-foreground">#{rank}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Points Breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {pointItems.map((item, index) => (
          <PointItem
            key={item.label}
            {...item}
            delay={0.1 + index * 0.05}
          />
        ))}
      </div>
    </div>
  );
};
