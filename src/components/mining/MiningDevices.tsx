
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BatteryCharging, ShoppingBag } from "lucide-react";
import type { ViralUser, MiningSession } from "@/types/telegram";

interface MiningProgress {
  timeRemaining: number;
  progress: number;
  tokensMinedSoFar: number;
}

type Props = {
  user: ViralUser | null;
  activeMiningSession: MiningSession | null;
  miningProgress: MiningProgress | null;
  onStartMining: () => Promise<void> | void;
  onUpgradePower: () => Promise<void> | void;
  onUpgradeDuration: () => Promise<void> | void;
};

const devices: any[] = [];

const MiningDevices: React.FC<Props> = ({
  user,
  activeMiningSession,
  onUpgradePower,
  onUpgradeDuration,
}) => {
  return (
        <div className="space-y-4 p-4">
      {/* Mining Image */}
      <Card className="p-4 glassmorphism text-center">
        <img 
          src="/src/assets/mining-image.png" 
          alt="Mining" 
          className="w-full max-w-xs mx-auto rounded-lg shadow-lg"
        />
      </Card>

      {/* Compact Upgrades */}
      <Card className="p-4 glassmorphism">
        <h3 className="font-semibold mb-3 text-center text-professional">Quick Upgrades</h3>
        <div className="space-y-2">
          <Button 
            onClick={onUpgradePower}
            disabled={!!activeMiningSession}
            className="w-full justify-between button-blue"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <span>Power Upgrade</span>
            </div>
            <Badge variant="secondary">0.5 TON</Badge>
          </Button>
          
          <Button 
            onClick={onUpgradeDuration}
            disabled={!!activeMiningSession}
            className="w-full justify-between button-cyan"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <span>Duration Upgrade</span>
            </div>
            <Badge variant="secondary">0.5 TON</Badge>
          </Button>
        </div>
      </Card>

      {/* Device Store - Compact */}
      <Card className="p-4 glassmorphism">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-professional">Mining Devices</h4>
          <Button size="sm" variant="outline" className="hover-scale">
            <ShoppingBag className="w-4 h-4 ml-1" />
            Store
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="p-4 text-center text-muted-foreground">
            No mining devices available
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MiningDevices;
