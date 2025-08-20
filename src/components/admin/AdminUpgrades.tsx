import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { TrendingUp } from "lucide-react";

type Upgrade = {
  id: string;
  user_id: string;
  upgrade_type: string;
  upgrade_level: number;
  cost_ton: number;
  transaction_hash?: string;
  created_at: string;
};

interface AdminUpgradesProps {
  upgrades: Upgrade[];
}

const AdminUpgrades: React.FC<AdminUpgradesProps> = ({ upgrades }) => {
  const powerUpgrades = upgrades.filter(u => u.upgrade_type === 'power');
  const durationUpgrades = upgrades.filter(u => u.upgrade_type === 'duration');

  const getUpgradeTypeColor = (type: string) => {
    switch (type) {
      case 'power':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'duration':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <div className="font-semibold">Upgrade History</div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
              {powerUpgrades.length} Power
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              {durationUpgrades.length} Duration
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {upgrades.map(upgrade => (
              <div key={upgrade.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-sm capitalize">{upgrade.upgrade_type} Upgrade</div>
                    <Badge className={getUpgradeTypeColor(upgrade.upgrade_type)}>
                      Level {upgrade.upgrade_level}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    User: {upgrade.user_id.slice(0, 8)} • Cost: {upgrade.cost_ton} TON
                  </div>
                  {upgrade.transaction_hash && (
                    <div className="text-xs text-muted-foreground font-mono">
                      Hash: {upgrade.transaction_hash.slice(0, 16)}...
                    </div>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{formatDistanceToNow(new Date(upgrade.created_at), { addSuffix: true })}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdminUpgrades;