import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpinWheelGame } from "@/components/games/SpinWheelGame";
import { useGameData } from "@/hooks/useGameData";

const SpinWheel: React.FC = () => {
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
        <title>عجلة الحظ | Bolt</title>
        <meta name="description" content="جرب حظك مع عجلة الحظ واربح عملات" />
      </Helmet>

      {/* Header */}
      <div className="px-4 py-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/mini-games")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">عجلة الحظ</h1>
          <p className="text-sm text-muted-foreground">دوّر واربح جوائز رائعة!</p>
        </div>
      </div>

      {/* Game */}
      <div className="px-4 py-8">
        <div className="bg-card border border-border rounded-2xl p-6">
          <SpinWheelGame
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
            <li>• كل دورة تكلف 20 عملة</li>
            <li>• يمكنك ربح حتى 1000 عملة!</li>
            <li>• حظ أوفر في المرة القادمة إذا حصلت على 0</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
