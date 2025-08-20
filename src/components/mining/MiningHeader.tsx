import React from 'react';
import { Card } from '@/components/ui/card';
import UserAvatar from '@/components/UserAvatar';
import ViralIcon from '@/components/ui/viral-icon';
import { TelegramUser, ViralUser } from '@/types/telegram';

interface MiningHeaderProps {
  telegramUser: TelegramUser | null;
  user: ViralUser | null;
}

const MiningHeader: React.FC<MiningHeaderProps> = ({ telegramUser, user }) => {
  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <UserAvatar 
            user={telegramUser} 
            size="lg" 
            showName={true}
            className="flex-1"
          />
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Level</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {Math.floor((user?.mining_power_multiplier || 2) / 2)}
              </span>
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {Math.floor((user?.mining_power_multiplier || 2) / 2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Balance Display */}
      <Card className="p-6 bg-gradient-to-r from-card via-card/90 to-card border border-primary/20">
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center mr-3">
              <ViralIcon size="lg" color="#ffffff" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">VIRAL Balance</h2>
              <p className="text-sm text-muted-foreground">Mined Digital Currency</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4 border border-primary/10">
            <p className="text-3xl font-bold text-primary mb-1">
              {user?.token_balance?.toFixed(4) || '0.0000'}
            </p>
            <p className="text-sm text-muted-foreground">VIRAL</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MiningHeader;