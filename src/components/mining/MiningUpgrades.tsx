import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMiningUpgrades } from '@/hooks/useMiningUpgrades';
import { Zap, Clock, TrendingUp, Coins, Gem, Star } from 'lucide-react';
import { ViralUser, MiningSession } from '@/types/telegram';

interface MiningUpgradesProps {
  user: ViralUser | null;
  activeMiningSession: MiningSession | null;
  onUpgrade: () => void;
}

const MiningUpgrades: React.FC<MiningUpgradesProps> = ({ 
  user, 
  activeMiningSession, 
  onUpgrade 
}) => {
  const { createMiningUpgradePayment, isUpgrading } = useMiningUpgrades();

  const getNextPowerMultiplier = () => {
    if (!user) return 4;
    const current = user.mining_power || 2;
    if (current < 10) return current + 2;
    if (current < 50) return current + 10;
    if (current < 100) return current + 25;
    return Math.min(200, current + 50);
  };

  const getNextDurationHours = () => {
    if (!user) return 12;
    if (user.mining_duration_hours === 4) return 12;
    if (user.mining_duration_hours === 12) return 24;
    return 24;
  };

  const canUpgradeDuration = () => {
    return user && user.mining_duration_hours < 24;
  };

  const canUpgradePower = () => {
    return user && (user.mining_power || 2) < 200;
  };

  const handlePowerUpgrade = async () => {
    if (!user) return;
    
    const success = await createMiningUpgradePayment({
      upgradeType: 'power',
      currentValue: user.mining_power || 2,
      tonAmount: 0.5,
      userId: user.id
    });

    if (success) {
      onUpgrade();
    }
  };

  const handleDurationUpgrade = async () => {
    if (!user) return;
    
    const success = await createMiningUpgradePayment({
      upgradeType: 'duration',
      currentValue: user.mining_duration_hours,
      tonAmount: 0.5,
      userId: user.id
    });

    if (success) {
      onUpgrade();
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card via-card/95 to-card/90 border border-accent/20">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent via-secondary to-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Mining Upgrades</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Upgrade your mining device to increase profits
        </p>
      </div>

      <div className="space-y-4">
        {/* Mining Power Upgrade */}
        <UpgradeCard
          icon={<Zap className="w-6 h-6 text-primary" />}
          title="Mining Power"
          description="Increase mining rate"
          currentValue={`×${user?.mining_power || 2}`}
          nextValue={`×${getNextPowerMultiplier()}`}
          price="0.5 TON"
          onUpgrade={handlePowerUpgrade}
          canUpgrade={canUpgradePower()}
          isUpgrading={isUpgrading === 'power'}
          disabled={!!activeMiningSession}
          upgradeType="power"
        />

        {/* Mining Duration Upgrade */}
        <UpgradeCard
          icon={<Clock className="w-6 h-6 text-secondary" />}
          title="Mining Duration"
          description="Increase continuous operation time"
          currentValue={`${user?.mining_duration_hours || 4}h`}
          nextValue={`${getNextDurationHours()}h`}
          price="0.5 TON"
          onUpgrade={handleDurationUpgrade}
          canUpgrade={canUpgradeDuration()}
          isUpgrading={isUpgrading === 'duration'}
          disabled={!!activeMiningSession}
          upgradeType="duration"
        />
      </div>

      {activeMiningSession && (
        <div className="mt-6 p-4 bg-muted/10 rounded-lg border border-muted/20">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Gem className="w-4 h-4" />
            <span>Upgrades are disabled during active mining</span>
          </div>
        </div>
      )}

      {/* Upgrade Benefits */}
      <div className="mt-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10">
        <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          Upgrade Benefits
        </h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Coins className="w-3 h-3 text-primary" />
            <span>Higher profits from each mining session</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-secondary" />
            <span>Continuous operation for longer periods</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-accent" />
            <span>Continuous performance improvement</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

interface UpgradeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  currentValue: string;
  nextValue: string;
  price: string;
  onUpgrade: () => void;
  canUpgrade: boolean;
  isUpgrading: boolean;
  disabled: boolean;
  upgradeType: 'power' | 'duration';
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  icon,
  title,
  description,
  currentValue,
  nextValue,
  price,
  onUpgrade,
  canUpgrade,
  isUpgrading,
  disabled,
  upgradeType
}) => {
  const getGradientClass = () => {
    return upgradeType === 'power' 
      ? 'from-primary/10 to-primary/5 border-primary/20' 
      : 'from-secondary/10 to-secondary/5 border-secondary/20';
  };

  const getButtonClass = () => {
    return upgradeType === 'power'
      ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
      : 'bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70';
  };

  return (
    <div className={`p-4 rounded-lg border bg-gradient-to-br ${getGradientClass()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-background to-card/50 flex items-center justify-center border">
            {icon}
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-foreground">{currentValue}</span>
              <span className="text-xs text-muted-foreground">→</span>
              <span className="text-sm font-bold text-primary">{nextValue}</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <Badge variant="outline" className="mb-3 border-accent/30 text-accent">
            {price}
          </Badge>
          <div>
            <Button 
              size="sm"
              onClick={onUpgrade}
              disabled={!canUpgrade || disabled || isUpgrading}
              className={`${getButtonClass()} text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUpgrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"></div>
                  Upgrading...
                </div>
              ) : (
                "Upgrade"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningUpgrades;