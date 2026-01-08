import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { CoinFlipGame } from "@/components/games/CoinFlipGame";
import { useGameData } from "@/hooks/useGameData";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";

const CoinFlip: React.FC = () => {
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
        <title>Coin Flip | Bolt</title>
        <meta name="description" content="Choose heads or tails and double your balance" />
      </Helmet>

      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <BackButton />
          <h1 className="text-xl font-bold text-foreground">Coin Flip</h1>
        </div>
        <p className="text-sm text-muted-foreground">Pick the right side and double your coins!</p>
      </div>

      {/* Game */}
      <div className="px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <CoinFlipGame
            coins={player?.coins || 0}
            onWin={handleWin}
            onSpend={handleSpend}
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="px-4">
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
          <h3 className="font-bold text-foreground mb-2">💡 How to Play</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Choose Heads 👑 or Tails ⭐</li>
            <li>• Select your bet amount</li>
            <li>• Win = Double your bet!</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;
