import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Crown, Gift, TrendingUp, Flame, Trophy } from 'lucide-react';
import { DailyStreakWidget } from './DailyStreakWidget';
import { FlashOfferBanner } from './FlashOfferBanner';
import { LevelProgressCard } from './LevelProgressCard';
import { SocialProofFeed } from './SocialProofFeed';
import { LuckySpinModal } from './LuckySpinModal';
import { LossAversionCard } from './LossAversionCard';
import { VIPStatusCard } from './VIPStatusCard';
import MiningUpgrades from '@/components/mining/MiningUpgrades';
import { motion } from 'framer-motion';
import { ViralUser, MiningSession } from '@/types/telegram';

interface PsychologyUpgradeCenterProps {
  userId: string;
  user: ViralUser | null;
  userData: {
    token_balance: number;
    mining_power: number;
    mining_duration_hours: number;
  };
  activeMiningSession: MiningSession | null;
  onUpgrade: () => void;
}

export const PsychologyUpgradeCenter = ({
  userId,
  user,
  userData,
  activeMiningSession,
  onUpgrade
}: PsychologyUpgradeCenterProps) => {
  const [activeTab, setActiveTab] = useState('upgrades');

  return (
    <div className="space-y-6">
      {/* Social Proof - Always visible at top */}
      <SocialProofFeed />

      {/* Flash Offers Banner */}
      <FlashOfferBanner userId={userId} onPurchase={onUpgrade} />

      {/* Main tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full bg-background/50 backdrop-blur-sm">
          <TabsTrigger value="upgrades" className="flex items-center gap-1 text-xs">
            <Zap className="w-3 h-3" />
            <span className="hidden sm:inline">Upgrades</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center gap-1 text-xs">
            <Gift className="w-3 h-3" />
            <span className="hidden sm:inline">Rewards</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-1 text-xs">
            <Trophy className="w-3 h-3" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="vip" className="flex items-center gap-1 text-xs">
            <Crown className="w-3 h-3" />
            <span className="hidden sm:inline">VIP</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upgrades" className="space-y-4 mt-4">
          {/* Loss Aversion Card */}
          <LossAversionCard
            userId={userId}
            currentMiningPower={userData?.mining_power || 2}
            miningDurationHours={userData?.mining_duration_hours || 4}
            tokenBalance={userData?.token_balance || 0}
            onUpgrade={() => {}}
          />

          {/* Mining Upgrades */}
          <MiningUpgrades
            user={user}
            activeMiningSession={activeMiningSession}
            onUpgrade={onUpgrade}
          />

          {/* Lucky Spin */}
          <LuckySpinModal userId={userId} onReward={onUpgrade} />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4 mt-4">
          {/* Daily Streak */}
          <DailyStreakWidget userId={userId} onStreakClaimed={onUpgrade} />

          {/* Lucky Boxes */}
          <Card className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              Daily Rewards
            </h3>
            <div className="space-y-3">
              <LuckySpinModal userId={userId} onReward={onUpgrade} />
              
              <div className="p-3 bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Come back every day to claim your streak bonus and free lucky spin!
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4 mt-4">
          {/* Level Progress */}
          <LevelProgressCard 
            userId={userId} 
            tokenBalance={userData?.token_balance || 0}
          />

          {/* Stats Card */}
          <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              Your Mining Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-black/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">
                  {userData?.token_balance?.toFixed(0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total VIRAL</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-lg">
                <p className="text-2xl font-bold text-green-400">
                  {userData?.mining_power || 2}x
                </p>
                <p className="text-xs text-muted-foreground">Mining Power</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">
                  {userData?.mining_duration_hours || 4}h
                </p>
                <p className="text-xs text-muted-foreground">Max Duration</p>
              </div>
              <div className="text-center p-3 bg-black/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-400">
                  {((userData?.mining_power || 2) * (userData?.mining_duration_hours || 4)).toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Daily Potential</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="vip" className="space-y-4 mt-4">
          {/* VIP Status */}
          <VIPStatusCard userId={userId} />

          {/* VIP Benefits Showcase */}
          <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Crown className="w-5 h-5 text-purple-400" />
              Why Go VIP?
            </h3>
            <div className="space-y-2">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">Up to +30% Mining Bonus</span>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"
              >
                <Gift className="w-4 h-4 text-green-400" />
                <span className="text-sm">Unlimited Daily Lucky Spins</span>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-sm">Exclusive Flash Deals</span>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 p-2 bg-black/20 rounded-lg"
              >
                <Trophy className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">Priority Support & VIP Chat</span>
              </motion.div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
