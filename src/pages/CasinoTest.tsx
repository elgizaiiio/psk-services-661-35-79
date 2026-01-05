import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Dice1, CircleDot, Coins, Grid3X3, Cherry, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import CrashGame from "@/components/casino/CrashGame";
import SlotsGame from "@/components/casino/SlotsGame";
import PlinkoGame from "@/components/casino/PlinkoGame";
import DiceGame from "@/components/casino/DiceGame";
import RouletteGame from "@/components/casino/RouletteGame";
import CoinFlipGame from "@/components/casino/CoinFlipGame";

const CasinoTest = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(1000); // Test balance

  const handleWin = (amount: number) => {
    setBalance(prev => prev + amount);
  };

  const handleBet = (amount: number): boolean => {
    if (balance >= amount) {
      setBalance(prev => prev - amount);
      return true;
    }
    return false;
  };

  const games = [
    { id: "crash", label: "Crash", icon: Rocket },
    { id: "slots", label: "Slots", icon: Cherry },
    { id: "plinko", label: "Plinko", icon: Grid3X3 },
    { id: "dice", label: "Dice", icon: Dice1 },
    { id: "roulette", label: "Roulette", icon: CircleDot },
    { id: "coinflip", label: "Coin Flip", icon: Coins },
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Casino Test</h1>
        <div className="bg-primary/20 px-3 py-1.5 rounded-full">
          <span className="text-primary font-bold">{balance.toFixed(2)} TON</span>
        </div>
      </div>

      {/* Games Tabs */}
      <Tabs defaultValue="crash" className="w-full">
        <TabsList className="w-full grid grid-cols-6 mb-4 h-auto p-1">
          {games.map((game) => (
            <TabsTrigger 
              key={game.id} 
              value={game.id}
              className="flex flex-col items-center gap-1 py-2 px-1 text-xs"
            >
              <game.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{game.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="crash">
          <CrashGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>

        <TabsContent value="slots">
          <SlotsGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>

        <TabsContent value="plinko">
          <PlinkoGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>

        <TabsContent value="dice">
          <DiceGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>

        <TabsContent value="roulette">
          <RouletteGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>

        <TabsContent value="coinflip">
          <CoinFlipGame balance={balance} onWin={handleWin} onBet={handleBet} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CasinoTest;
