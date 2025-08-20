import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MiningAnimationProps {
  isActive: boolean;
  timeRemaining?: number;
  tokensMinedSoFar?: number;
  miningPowerMultiplier?: number;
}

const formatTime = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${remainingSeconds}s`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
};

const MiningAnimation: React.FC<MiningAnimationProps> = ({
  isActive,
  timeRemaining,
  tokensMinedSoFar,
  miningPowerMultiplier
}) => {
  if (isActive && timeRemaining !== undefined && tokensMinedSoFar !== undefined && miningPowerMultiplier !== undefined) {
    return (
      <div className="text-center space-y-6">
        {/* Mining Animation */}
        <div className="relative flex items-center justify-center">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center border-4 border-primary/40 relative overflow-hidden">
            {/* Animated circles */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-spin" style={{animationDuration: '3s'}} />
            <div className="absolute inset-2 rounded-full border-2 border-secondary/40 animate-spin" style={{animationDuration: '2s', animationDirection: 'reverse'}} />
            
            {/* Center icon */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse-glow relative z-10">
              <Play className="w-10 h-10 text-white" />
            </div>
            
            {/* Floating particles */}
            <div className="absolute top-4 left-8 w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{animationDelay: '0s'}} />
            <div className="absolute top-8 right-6 w-1 h-1 bg-secondary/80 rounded-full animate-bounce" style={{animationDelay: '0.5s'}} />
            <div className="absolute bottom-6 left-12 w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" style={{animationDelay: '1s'}} />
            <div className="absolute bottom-8 right-10 w-1 h-1 bg-secondary/60 rounded-full animate-bounce" style={{animationDelay: '1.5s'}} />
          </div>
          
          {/* Time remaining badge */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 px-4 py-2 text-sm font-bold">
              ⏱️ {formatTime(timeRemaining)}
            </Badge>
          </div>
        </div>

        {/* Mining stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
            <div className="text-2xl font-bold text-primary mb-1">
              {tokensMinedSoFar.toFixed(6)}
            </div>
            <div className="text-xs text-muted-foreground">VIRAL Mined</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-gradient-to-br from-secondary/15 to-secondary/5 border border-secondary/20">
            <div className="text-2xl font-bold text-secondary mb-1">
              ×{miningPowerMultiplier}
            </div>
            <div className="text-xs text-muted-foreground">Mining Power</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      {/* Idle Animation */}
      <div className="relative flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-muted/20 to-muted/10 flex items-center justify-center border-4 border-muted/30 relative">
          {/* Waiting pulse */}
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
          
          {/* Center icon */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-muted/30 to-muted/20 flex items-center justify-center relative z-10">
            <Pause className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">Ready to Mine</h3>
        <p className="text-sm text-muted-foreground">Click to start mining and earn VIRAL</p>
      </div>
    </div>
  );
};

export default MiningAnimation;