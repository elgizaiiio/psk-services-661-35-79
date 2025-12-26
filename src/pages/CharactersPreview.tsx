import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Zap, Clock, Coins, Target, Crown, Sparkles, ArrowLeft, RotateCcw, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Character3DViewer } from "@/components/mining/Character3DViewer";
import { HeroCharacterDisplay } from "@/components/mining/HeroCharacterDisplay";

// Anime 3D Character images
import shadowRunnerImg from '@/assets/characters/shadow-runner-3d.png';
import boltStarterImg from '@/assets/characters/bolt-starter-3d.png';
import thunderDragonImg from '@/assets/characters/thunder-dragon-3d.png';
import infinityPhoenixImg from '@/assets/characters/infinity-phoenix-3d.png';
import diamondEmperorImg from '@/assets/characters/diamond-emperor-3d.png';
import cyberNinjaImg from '@/assets/characters/cyber-ninja-3d.png';
import crystalMageImg from '@/assets/characters/crystal-mage-3d.png';

// Map characters to available 3D models
const character3DModels: Record<string, string> = {
  'Bolt Starter': '/models/characters/fox.glb',
  'Shadow Runner': '/models/characters/cesium-man.glb',
  'Crystal Mage': '/models/characters/crystal.glb',
  'Cyber Ninja': '/models/characters/cyber.glb',
  'Thunder Dragon': '/models/characters/brainstem.glb',
  'Infinity Phoenix': '/models/characters/fox.glb',
  'Diamond Emperor': '/models/characters/cesium-man.glb',
};

const characters = [
  {
    name: 'Bolt Starter',
    nameAr: 'بولت المبتدئ',
    tier: 'beginner',
    image: boltStarterImg,
    speed: 1.0,
    boost: 10,
    boostDuration: 10,
    extraCoins: 0,
    jackpotBonus: 0,
    priceTon: 0,
    priceTokens: 0,
    isFree: true,
  },
  {
    name: 'Shadow Runner',
    nameAr: 'عداء الظل',
    tier: 'professional',
    image: shadowRunnerImg,
    speed: 1.5,
    boost: 20,
    boostDuration: 15,
    extraCoins: 50,
    jackpotBonus: 5,
    priceTon: 0.5,
    priceTokens: 1000,
    isFree: false,
  },
  {
    name: 'Crystal Mage',
    nameAr: 'ساحرة الكريستال',
    tier: 'professional',
    image: crystalMageImg,
    speed: 1.8,
    boost: 25,
    boostDuration: 20,
    extraCoins: 100,
    jackpotBonus: 8,
    priceTon: 1.0,
    priceTokens: 2000,
    isFree: false,
  },
  {
    name: 'Cyber Ninja',
    nameAr: 'النينجا السايبر',
    tier: 'expert',
    image: cyberNinjaImg,
    speed: 2.0,
    boost: 30,
    boostDuration: 25,
    extraCoins: 150,
    jackpotBonus: 10,
    priceTon: 1.5,
    priceTokens: 3000,
    isFree: false,
  },
  {
    name: 'Thunder Dragon',
    nameAr: 'تنين الرعد',
    tier: 'master',
    image: thunderDragonImg,
    speed: 2.5,
    boost: 40,
    boostDuration: 30,
    extraCoins: 200,
    jackpotBonus: 15,
    priceTon: 2.5,
    priceTokens: 5000,
    isFree: false,
  },
  {
    name: 'Infinity Phoenix',
    nameAr: 'طائر الفينيكس',
    tier: 'master',
    image: infinityPhoenixImg,
    speed: 3.0,
    boost: 50,
    boostDuration: 35,
    extraCoins: 300,
    jackpotBonus: 20,
    priceTon: 3.5,
    priceTokens: 7000,
    isFree: false,
  },
  {
    name: 'Diamond Emperor',
    nameAr: 'إمبراطور الألماس',
    tier: 'legendary',
    image: diamondEmperorImg,
    speed: 4.0,
    boost: 75,
    boostDuration: 45,
    extraCoins: 500,
    jackpotBonus: 30,
    priceTon: 5.0,
    priceTokens: 10000,
    isFree: false,
  },
];

const tierColors: Record<string, string> = {
  beginner: 'bg-slate-500',
  professional: 'bg-blue-500',
  expert: 'bg-purple-500',
  master: 'bg-orange-500',
  legendary: 'bg-yellow-500',
};

const tierGradients: Record<string, string> = {
  beginner: 'from-slate-500/20 to-slate-600/20',
  professional: 'from-blue-500/20 to-blue-600/20',
  expert: 'from-purple-500/20 to-purple-600/20',
  master: 'from-orange-500/20 to-orange-600/20',
  legendary: 'from-yellow-500/20 via-amber-400/20 to-yellow-600/20',
};

const tierGlowColors: Record<string, string> = {
  beginner: 'rgba(100, 116, 139, 0.3)',
  professional: 'rgba(59, 130, 246, 0.4)',
  expert: 'rgba(168, 85, 247, 0.4)',
  master: 'rgba(249, 115, 22, 0.5)',
  legendary: 'rgba(234, 179, 8, 0.6)',
};

const CharactersPreview = () => {
  const navigate = useNavigate();
  const [selected3DCharacter, setSelected3DCharacter] = useState<typeof characters[0] | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mining Characters</h1>
          <p className="text-xs text-muted-foreground">Anime 3D Collection</p>
        </div>
      </div>

      {/* Hero 3D Character Display - Shows immediately like Free Fire/PUBG */}
      <div className="px-4 mb-4">
        <HeroCharacterDisplay compact={false} />
      </div>

      {/* Section Title */}
      <div className="px-4 mb-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          All Characters
        </h2>
      </div>

      {/* Characters Grid - Compact cards */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {characters.map((character, index) => (
          <motion.div
            key={character.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`p-3 bg-gradient-to-br ${tierGradients[character.tier]} border border-border/50 relative overflow-hidden cursor-pointer`}
              style={{
                boxShadow: `0 0 20px ${tierGlowColors[character.tier]}`,
              }}
              onClick={() => setSelected3DCharacter(character)}
            >
              {/* Legendary crown */}
              {character.tier === 'legendary' && (
                <Crown className="absolute top-1 right-1 w-4 h-4 text-yellow-500" />
              )}

              {/* Character Image */}
              <div className="text-center">
                <img
                  src={character.image}
                  alt={character.name}
                  className="w-16 h-16 mx-auto rounded-xl object-cover border border-primary/30"
                />
                <h3 className="font-bold text-sm text-foreground mt-2 truncate">
                  {character.name}
                </h3>
                <Badge className={`${tierColors[character.tier]} text-white text-[10px] mt-1`}>
                  {character.tier.toUpperCase()}
                </Badge>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-center gap-3 mt-2 text-[10px]">
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Zap className="w-3 h-3" />
                  {character.speed}x
                </span>
                <span className="flex items-center gap-0.5 text-muted-foreground">
                  <Sparkles className="w-3 h-3" />
                  +{character.boost}%
                </span>
              </div>

              {/* Price */}
              <div className="text-center mt-2">
                {character.isFree ? (
                  <span className="text-[10px] font-bold text-green-400">FREE</span>
                ) : (
                  <span className="text-[10px] font-medium text-primary">{character.priceTon} TON</span>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        className="mt-6 text-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          className="w-full bg-gradient-to-r from-primary to-cyan-500"
          onClick={() => navigate('/')}
        >
          Start Mining Now
        </Button>
      </motion.div>

      {/* 3D Character Viewer Modal */}
      <AnimatePresence>
        {selected3DCharacter && (
          <Dialog open={!!selected3DCharacter} onOpenChange={() => setSelected3DCharacter(null)}>
            <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-gradient-to-br from-background via-background to-primary/10 border-2 border-primary/30">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {selected3DCharacter.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selected3DCharacter.nameAr}</p>
                  </div>
                  <Badge className={`${tierColors[selected3DCharacter.tier]} text-white`}>
                    {selected3DCharacter.tier.toUpperCase()}
                  </Badge>
                </div>

                {/* 3D Viewer */}
                <div className="relative rounded-xl overflow-hidden border border-primary/20">
                  <Character3DViewer
                    modelPath={character3DModels[selected3DCharacter.name]}
                    height={350}
                    autoRotate={true}
                    interactive={true}
                    glowColor={tierGlowColors[selected3DCharacter.tier]}
                  />
                </div>

                {/* Stats in Modal */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                    <Zap className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Speed</p>
                      <p className="font-bold text-foreground">{selected3DCharacter.speed}x</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Boost</p>
                      <p className="font-bold text-foreground">+{selected3DCharacter.boost}%</p>
                    </div>
                  </div>
                  {selected3DCharacter.extraCoins > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                      <Coins className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Extra Coins</p>
                        <p className="font-bold text-foreground">+{selected3DCharacter.extraCoins}</p>
                      </div>
                    </div>
                  )}
                  {selected3DCharacter.jackpotBonus > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
                      <Target className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Jackpot</p>
                        <p className="font-bold text-foreground">+{selected3DCharacter.jackpotBonus}%</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interaction Hint */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                  👆 اسحب لتدوير النموذج ثلاثي الأبعاد
                </p>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CharactersPreview;
