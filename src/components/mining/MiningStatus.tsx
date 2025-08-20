import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ViralIcon from '@/components/ui/viral-icon';
import { Timer, Zap, Play, Pause } from 'lucide-react';
import { MiningSession, ViralUser } from '@/types/telegram';

interface MiningStatusProps {
  user: ViralUser | null;
  activeMiningSession: MiningSession | null;
  miningProgress: {
    progress: number;
    tokensMinedSoFar: number;
    timeRemaining: number;
    isComplete: boolean;
  } | null;
  onStartMining: () => void;
  formatTime: (milliseconds: number) => string;
}

const MiningStatus: React.FC<MiningStatusProps> = ({
  user,
  activeMiningSession,
  miningProgress,
  onStartMining,
  formatTime
}) => {
  const isActiveMining = activeMiningSession && miningProgress && !miningProgress.isComplete;

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card/95 to-card/90 border border-primary/20 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 animate-pulse opacity-30"></div>
      
      <div className="relative z-10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center animate-float">
              {isActiveMining ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Mining Device</h3>
              <p className="text-sm text-muted-foreground">
                {isActiveMining ? "Now Working" : "Ready to Start"}
              </p>
            </div>
          </div>

          {isActiveMining ? (
            <ActiveMiningDisplay 
              miningProgress={miningProgress}
              activeMiningSession={activeMiningSession}
              formatTime={formatTime}
            />
          ) : (
            <IdleMiningDisplay 
              user={user}
              onStartMining={onStartMining}
            />
          )}
        </div>
      </div>
    </Card>
  );
};

const ActiveMiningDisplay: React.FC<{
  miningProgress: any;
  activeMiningSession: MiningSession;
  formatTime: (ms: number) => string;
}> = ({ miningProgress, activeMiningSession, formatTime }) => {
  return (
    <div className="space-y-6">
      {/* Mining Device Visual */}
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-ping"></div>
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
          <ViralIcon size="xl" color="#ffffff" className="animate-glow" />
        </div>
        {/* Mining particles effect */}
        <div className="absolute -inset-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full animate-ping"
              style={{
                top: `${20 + i * 10}%`,
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.2}s`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Time Remaining */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Timer className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Time Remaining</span>
        </div>
        <div className="text-2xl font-bold text-primary text-center">
          {formatTime(miningProgress.timeRemaining)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Mining Progress</span>
          <span className="font-bold text-primary">
            {(miningProgress.progress * 100).toFixed(1)}%
          </span>
        </div>
        <Progress 
          value={miningProgress.progress * 100} 
          className="h-3 bg-muted/30 shadow-inner"
        />
      </div>

      {/* Mining Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-4 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground mb-1">Mined</p>
          <p className="font-bold text-primary text-lg">
            {miningProgress.tokensMinedSoFar.toFixed(4)}
          </p>
          <p className="text-xs text-muted-foreground">VIRAL</p>
        </div>
        <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-4 rounded-lg border border-secondary/20">
          <p className="text-xs text-muted-foreground mb-1">Mining Power</p>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4 text-secondary" />
            <p className="font-bold text-secondary text-lg">
              ×{activeMiningSession.mining_power_multiplier}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const IdleMiningDisplay: React.FC<{
  user: ViralUser | null;
  onStartMining: () => void;
}> = ({ user, onStartMining }) => {
  return (
    <div className="space-y-6">
      {/* Idle Device Visual */}
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-muted/20 to-muted/10 border-2 border-dashed border-primary/30"></div>
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
          <ViralIcon size="xl" color="#00bfff" className="opacity-60" />
        </div>
      </div>

      {/* Device Stats */}
      <div className="bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg p-4 border border-muted/20">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Mining Power</p>
            <p className="text-lg font-bold text-primary">×{user?.mining_power_multiplier || 2}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Mining Duration</p>
            <p className="text-lg font-bold text-secondary">{user?.mining_duration_hours || 4}h</p>
          </div>
        </div>
      </div>

      {/* Ready Status */}
      <div className="text-center">
        <div className="text-6xl font-bold text-muted-foreground/50 mb-6 tracking-wider">
          00:00
        </div>
        
        <Button 
          onClick={onStartMining}
          className="w-full text-lg py-6 bg-gradient-to-r from-primary via-secondary to-accent hover:from-primary/90 hover:via-secondary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          size="lg"
        >
          <Play className="w-6 h-6 mr-3" />
          Start Mining
        </Button>
      </div>
    </div>
  );
};

export default MiningStatus;