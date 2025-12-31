import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { MemoryGame as MemoryGameComponent } from "@/components/games/MemoryGame";
import { useGameData } from "@/hooks/useGameData";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const MemoryGame: React.FC = () => {
  const navigate = useNavigate();
  const { player, submitScore, useEnergy } = useGameData();
  useTelegramBackButton();

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
        <title>لعبة الذاكرة | Bolt</title>
        <meta name="description" content="اختبر ذاكرتك واربح مكافآت" />
      </Helmet>

      {/* Header */}
      <div className="px-4 pt-16 pb-4">
        <h1 className="text-xl font-bold text-foreground">لعبة الذاكرة</h1>
        <p className="text-sm text-muted-foreground">اعثر على الأزواج المتطابقة!</p>
      </div>

      {/* Game */}
      <div className="px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <MemoryGameComponent
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
            <li>• اقلب البطاقات واعثر على الأزواج</li>
            <li>• كل لعبة تكلف 25 عملة</li>
            <li>• المكافأة تزيد مع السرعة!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MemoryGame;
