import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Zap, Battery, HardDrive, Thermometer, Shield, Gauge, Cpu, Target, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeMatrix = () => {
  const navigate = useNavigate();

  const upgrades = [
    { 
      name: 'Power Boost', 
      icon: Zap, 
      description: 'Increase hash rate by 25%', 
      progress: 75,
      level: 15,
      maxLevel: 20,
      cost: '250 VIRAL'
    },
    { 
      name: 'Battery Expansion', 
      icon: Battery, 
      description: 'Extended mining sessions', 
      progress: 60,
      level: 12,
      maxLevel: 20,
      cost: '300 VIRAL'
    },
    { 
      name: 'Storage Upgrade', 
      icon: HardDrive, 
      description: 'More blockchain data capacity', 
      progress: 45,
      level: 9,
      maxLevel: 20,
      cost: '400 VIRAL'
    },
    { 
      name: 'Cooling System', 
      icon: Thermometer, 
      description: 'Prevent overheating', 
      progress: 85,
      level: 17,
      maxLevel: 20,
      cost: '200 VIRAL'
    },
    { 
      name: 'Reliability', 
      icon: Shield, 
      description: 'Reduce downtime', 
      progress: 90,
      level: 18,
      maxLevel: 20,
      cost: '150 VIRAL'
    },
    { 
      name: 'Overclock', 
      icon: Gauge, 
      description: 'Push beyond limits', 
      progress: 30,
      level: 6,
      maxLevel: 20,
      cost: '500 VIRAL'
    },
    { 
      name: 'Neural Network', 
      icon: Cpu, 
      description: 'AI-powered optimization', 
      progress: 20,
      level: 4,
      maxLevel: 20,
      cost: '750 VIRAL'
    },
    { 
      name: 'Precision Mining', 
      icon: Target, 
      description: 'Higher quality extraction', 
      progress: 65,
      level: 13,
      maxLevel: 20,
      cost: '350 VIRAL'
    },
    { 
      name: 'Market Analytics', 
      icon: TrendingUp, 
      description: 'Predict best mining times', 
      progress: 40,
      level: 8,
      maxLevel: 20,
      cost: '450 VIRAL'
    }
  ];

  return (
    <div className="min-h-screen text-foreground font-rajdhani">
      <Helmet>
        <title>Upgrade Matrix | Push Beyond Limits</title>
        <meta name="description" content="Push your servers beyond their limits. Every upgrade brings exponential gains." />
      </Helmet>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-orbitron font-black bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
              UPGRADE MATRIX
            </h1>
            <p className="text-muted-foreground">Push your servers beyond their limits. Every upgrade brings exponential gains.</p>
          </div>
        </div>

        {/* Current Stats */}
        <Card className="mb-8 border border-neon-blue/20 bg-gradient-to-br from-neon-blue/5 to-background">
          <CardContent className="p-6">
            <h2 className="text-2xl font-orbitron font-bold mb-4 text-neon-blue">Current Mining Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-green">1,847</div>
                <div className="text-sm text-muted-foreground">VIRAL Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-blue">×23.5</div>
                <div className="text-sm text-muted-foreground">Mining Power</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-purple">89%</div>
                <div className="text-sm text-muted-foreground">Efficiency</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-orange">72h</div>
                <div className="text-sm text-muted-foreground">Max Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrades Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upgrades.map((upgrade, index) => (
            <Card 
              key={upgrade.name} 
              className="relative overflow-hidden border border-neon-blue/20 bg-gradient-to-br from-card/80 to-background group hover:border-neon-blue transition-all duration-500 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-neon-blue/10 flex items-center justify-center border border-neon-blue/30">
                    <upgrade.icon className="w-6 h-6 text-neon-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-orbitron font-bold text-lg">{upgrade.name}</h3>
                      <span className="text-sm text-neon-blue font-bold">Lv.{upgrade.level}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progress to Next Level</span>
                    <span className="text-neon-blue font-bold">{upgrade.progress}%</span>
                  </div>
                  <Progress 
                    value={upgrade.progress} 
                    className="h-3 bg-background border border-neon-blue/30"
                  />
                  
                  <div className="flex justify-between text-sm">
                    <span>Level Progress</span>
                    <span className="text-muted-foreground">{upgrade.level}/{upgrade.maxLevel}</span>
                  </div>
                  
                  <div className="text-center py-2">
                    <div className="text-lg font-orbitron font-bold text-neon-green">{upgrade.cost}</div>
                    <div className="text-xs text-muted-foreground">Upgrade Cost</div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 border-neon-blue/50 text-neon-blue hover:bg-neon-blue hover:text-background"
                  disabled={upgrade.level >= upgrade.maxLevel}
                >
                  {upgrade.level >= upgrade.maxLevel ? 'MAX LEVEL' : 'UPGRADE NOW'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeMatrix;