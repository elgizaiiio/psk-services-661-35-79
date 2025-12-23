import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Zap, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface LossAversionCardProps {
  userId: string;
  currentMiningPower: number;
  miningDurationHours: number;
  tokenBalance: number;
  onUpgrade?: () => void;
}

export const LossAversionCard = ({ 
  userId, 
  currentMiningPower, 
  miningDurationHours,
  tokenBalance,
  onUpgrade 
}: LossAversionCardProps) => {
  const [lostEarnings, setLostEarnings] = useState({ daily: 0, weekly: 0, monthly: 0 });

  useEffect(() => {
    calculateLostEarnings();
  }, [currentMiningPower, miningDurationHours]);

  const calculateLostEarnings = () => {
    // Calculate potential earnings with max upgrades vs current
    const maxPower = 8; // Maximum mining power
    const maxDuration = 24; // Maximum duration hours
    
    const currentHourlyRate = currentMiningPower * 1;
    const maxHourlyRate = maxPower * 1;
    
    const currentDailyEarnings = currentHourlyRate * miningDurationHours;
    const maxDailyEarnings = maxHourlyRate * maxDuration;
    
    const dailyLoss = maxDailyEarnings - currentDailyEarnings;
    
    setLostEarnings({
      daily: Math.round(dailyLoss),
      weekly: Math.round(dailyLoss * 7),
      monthly: Math.round(dailyLoss * 30)
    });
  };

  const upgradeProgress = {
    power: (currentMiningPower / 8) * 100,
    duration: (miningDurationHours / 24) * 100
  };

  if (lostEarnings.daily <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30 relative overflow-hidden">
        {/* Warning pulse */}
        <div className="absolute top-2 right-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </motion.div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-lg text-red-400">You're Losing VIRAL!</h3>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Without upgrades, you're missing out on potential earnings every day!
          </p>

          {/* Loss visualization */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-red-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground">Daily Loss</p>
              <p className="text-lg font-bold text-red-400">-{lostEarnings.daily}</p>
              <p className="text-xs text-muted-foreground">VIRAL</p>
            </div>
            <div className="text-center p-2 bg-red-500/30 rounded-lg">
              <p className="text-xs text-muted-foreground">Weekly Loss</p>
              <p className="text-lg font-bold text-red-400">-{lostEarnings.weekly}</p>
              <p className="text-xs text-muted-foreground">VIRAL</p>
            </div>
            <div className="text-center p-2 bg-red-500/40 rounded-lg">
              <p className="text-xs text-muted-foreground">Monthly Loss</p>
              <p className="text-lg font-bold text-red-400">-{lostEarnings.monthly}</p>
              <p className="text-xs text-muted-foreground">VIRAL</p>
            </div>
          </div>

          {/* Current vs Potential comparison */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Mining Power:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400">{currentMiningPower}x</span>
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400">8x possible</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Duration:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-400">{miningDurationHours}h</span>
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400">24h possible</span>
              </div>
            </div>
          </div>

          {/* Upgrade progress */}
          <div className="space-y-2 mb-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Power Upgrade Progress</span>
                <span>{Math.round(upgradeProgress.power)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${upgradeProgress.power}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-green-500"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span>Duration Upgrade Progress</span>
                <span>{Math.round(upgradeProgress.duration)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${upgradeProgress.duration}%` }}
                  className="h-full bg-gradient-to-r from-red-500 to-green-500"
                />
              </div>
            </div>
          </div>

          {/* Call to action */}
          <Button 
            onClick={onUpgrade}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            <Zap className="w-4 h-4 mr-2" />
            Stop Losing - Upgrade Now!
          </Button>

          {/* Urgency badge */}
          <div className="flex justify-center mt-3">
            <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                ⚠️ Every hour without upgrade = lost VIRAL
              </motion.span>
            </Badge>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
