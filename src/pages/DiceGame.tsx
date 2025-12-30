import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { DiceGame as DiceGameComponent } from "@/components/games/DiceGame";
import { useGameData } from "@/hooks/useGameData";

const DiceGame: React.FC = () => {
  const navigate = useNavigate();
  const { player, submitScore, useEnergy } = useGameData();

  const handleWin = async (amount: number) => {
    if (amount > 0) {
      await submitScore(amount);
    }
  };

  const handleSpend = (amount: number): boolean => {
    if (!player || player.coins < amount) return false;
    useEnergy(1);
    return true;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>لعبة النرد | Bolt</title>
        <meta name="description" content="خمّن الرقم واربح 5 أضعاف" />
      </Helmet>

      {/* Header */}
      <div className="px-4 py-4">
        <h1 className="text-xl font-bold text-foreground">لعبة النرد</h1>
        <p className="text-sm text-muted-foreground">خمّن الرقم واربح 5x!</p>
      </div>

      {/* Game */}
      <div className="px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <DiceGameComponent
            coins={player?.coins || 0}
            onWin={handleWin}
            onSpend={handleSpend}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4">
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <h3 className="font-bold text-foreground mb-2">💡 كيفية اللعب</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• اختر رقماً من 1 إلى 6</li>
            <li>• كل رمية تكلف 15 عملة</li>
            <li>• التخمين الصحيح = 5x المبلغ (75 عملة!)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiceGame;
