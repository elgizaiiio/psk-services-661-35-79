import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Trophy, Coins, Zap, Star, Crown } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";
import { toast } from 'sonner';
import RunnerGame from '@/components/runner/RunnerGame';
const RECEIVER_ADDRESS = "UQBJSGcoWTcjdkWFSxA4A6sLmnD5uFKoKHFEHc3LqGJvFWya";

const RunnerGameInner = () => {
  const { user: telegramUser, hapticFeedback } = useTelegramAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const wallet = useTonWallet();
  const [tcui] = useTonConnectUI();

  const powerUps = [
    {
      id: 'speed_boost',
      name: 'Speed Boost',
      description: 'Double your speed for 10 seconds',
      icon: Zap,
      price: 0.1,
      duration: '10s'
    },
    {
      id: 'shield',
      name: 'Shield',
      description: 'Protect yourself from obstacles',
      icon: Star,
      price: 0.2,
      duration: '15s'
    },
    {
      id: 'magnet',
      name: 'Coin Magnet',
      description: 'Attract all coins automatically',
      icon: Coins,
      price: 0.15,
      duration: '20s'
    },
    {
      id: 'super_jump',
      name: 'Super Jump',
      description: 'Jump higher and longer',
      icon: Crown,
      price: 0.25,
      duration: '30s'
    }
  ];

  const skins = [
    {
      id: 'ninja',
      name: 'Ninja Runner',
      description: 'Fast and stealthy',
      price: 0.5,
      unlocked: false
    },
    {
      id: 'robot',
      name: 'Cyber Runner',
      description: 'High-tech appearance',
      price: 0.8,
      unlocked: false
    },
    {
      id: 'golden',
      name: 'Golden Runner',
      description: 'Shining champion',
      price: 1.0,
      unlocked: false
    }
  ];

  const buyPowerUp = async (powerUpId: string, price: number) => {
    if (!wallet?.account) {
      toast.error("Please connect your TON wallet first");
      return;
    }

    try {
      hapticFeedback.impact('medium');
      const nanotons = Math.floor(price * 1e9).toString();
      
      await tcui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: nanotons
          }
        ]
      });

      toast.success(`Power-up purchased successfully! 🚀`);
    } catch (e: any) {
      console.error("Purchase failed:", e);
      if (e.message?.includes('User rejects')) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  const buySkin = async (skinId: string, price: number) => {
    if (!wallet?.account) {
      toast.error("Please connect your TON wallet first");
      return;
    }

    try {
      hapticFeedback.impact('medium');
      const nanotons = Math.floor(price * 1e9).toString();
      
      await tcui.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: RECEIVER_ADDRESS,
            amount: nanotons
          }
        ]
      });

      toast.success(`Skin purchased successfully! ✨`);
    } catch (e: any) {
      console.error("Purchase failed:", e);
      if (e.message?.includes('User rejects')) {
        toast.error("Transaction cancelled by user");
      } else {
        toast.error("Transaction failed");
      }
    }
  };

  if (gameStarted) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <RunnerGame />
        <Button 
          onClick={() => setGameStarted(false)}
          className="absolute top-4 right-4 z-10"
          variant="secondary"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <Helmet>
          <title>Runner Game | Endless Running Adventure</title>
          <meta name="description" content="Play the ultimate runner game with TON-powered upgrades and skins" />
        </Helmet>

        {/* Header */}
        <Card className="p-4 bg-gradient-to-r from-card/80 to-card/60 border-primary/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Runner Game</h1>
            <p className="text-muted-foreground">Endless running adventure</p>
          </div>
        </Card>

        {/* Start Game */}
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-bold mb-2">Ready to Run?</h2>
            <p className="text-muted-foreground mb-4">
              Jump, slide, and collect coins in this endless adventure
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary">High Score: {gameScore}</Badge>
              <Badge variant="outline">
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-primary to-secondary mr-1"></div>
                VIRAL Tokens
              </Badge>
            </div>
            <Button 
              onClick={() => setGameStarted(true)}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-secondary"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </CardContent>
        </Card>

        {/* Power-ups Store */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Power-ups Store
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {powerUps.map((powerUp) => (
              <div
                key={powerUp.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <powerUp.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{powerUp.name}</h4>
                    <p className="text-xs text-muted-foreground">{powerUp.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Duration: {powerUp.duration}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-xs font-bold text-white">
                      T
                    </div>
                    <span className="text-sm font-bold">{powerUp.price}</span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => buyPowerUp(powerUp.id, powerUp.price)}
                    disabled={!wallet?.account}
                  >
                    {wallet?.account ? 'Buy' : 'Connect Wallet'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Skins Store */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2" />
              Skins Store
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {skins.map((skin) => (
              <div
                key={skin.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Star className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{skin.name}</h4>
                    <p className="text-xs text-muted-foreground">{skin.description}</p>
                    {skin.unlocked && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center text-xs font-bold text-white">
                      T
                    </div>
                    <span className="text-sm font-bold">{skin.price}</span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => buySkin(skin.id, skin.price)}
                    disabled={!wallet?.account || skin.unlocked}
                    variant={skin.unlocked ? 'secondary' : 'default'}
                  >
                    {skin.unlocked ? 'Owned' : wallet?.account ? 'Buy' : 'Connect Wallet'}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              How to Play
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Tap to jump, swipe down to slide. Collect coins and avoid obstacles!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const RunnerGamePage: React.FC = () => {
  return (
    <RunnerGameInner />
  );
};

export default RunnerGamePage;