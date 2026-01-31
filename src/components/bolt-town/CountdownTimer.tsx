import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, RotateCcw } from 'lucide-react';

interface CountdownTimerProps {
  getTimeUntilReset: () => number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ getTimeUntilReset }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilReset());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilReset());
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeUntilReset]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-3 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resets in</p>
            <div className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3 text-orange-400 animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-xs text-orange-400">UTC Midnight</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 font-mono">
          <TimeBlock value={formatNumber(hours)} label="h" />
          <span className="text-lg font-bold text-foreground">:</span>
          <TimeBlock value={formatNumber(minutes)} label="m" />
          <span className="text-lg font-bold text-foreground">:</span>
          <TimeBlock value={formatNumber(seconds)} label="s" />
        </div>
      </div>
    </motion.div>
  );
};

const TimeBlock: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="text-center">
    <div className="text-xl font-bold text-foreground leading-none">{value}</div>
    <div className="text-[10px] text-muted-foreground">{label}</div>
  </div>
);
