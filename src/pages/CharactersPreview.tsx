import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Zap, Clock, Coins, Target, Crown, Sparkles, ArrowLeft, RotateCcw, X, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Character3DViewer } from "@/components/mining/Character3DViewer";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Mining Characters
          </h1>
          <p className="text-sm text-muted-foreground">
            Anime 3D Characters Collection
          </p>
        </div>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {characters.map((character, index) => (
          <motion.div
            key={character.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <Card
              className={`p-4 bg-gradient-to-br ${tierGradients[character.tier]} border-2 border-border/50 relative overflow-hidden`}
              style={{
                boxShadow: `0 0 30px ${tierGlowColors[character.tier]}`,
              }}
            >
              {/* Legendary particles */}
              {character.tier === 'legendary' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                      initial={{
                        x: Math.random() * 100 + '%',
                        y: '100%',
                        opacity: 0,
                      }}
                      animate={{
                        y: '-20%',
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: 'easeOut',
                      }}
                    />
                  ))}
                </div>
              )}

              {character.tier === 'legendary' && (
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Crown className="absolute top-2 right-2 w-6 h-6 text-yellow-500" />
                </motion.div>
              )}

              {/* Character Image */}
              <div className="text-center mb-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotateY: 10 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="relative inline-block cursor-pointer group"
                  onClick={() => setSelected3DCharacter(character)}
                >
                  <motion.div
                    className="absolute inset-0 rounded-2xl blur-xl"
                    style={{ background: tierGlowColors[character.tier] }}
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <img
                    src={character.image}
                    alt={character.name}
                    className="w-28 h-28 mx-auto rounded-2xl object-cover shadow-xl border-2 border-primary/30 relative z-10"
                  />
                  
                  {/* 3D View Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <div className="flex flex-col items-center text-white">
                      <Maximize2 className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">View 3D</span>
                    </div>
                  </div>
                </motion.div>

                <h3 className="font-bold text-lg text-foreground mt-3">
                  {character.name}
                </h3>
                <p className="text-sm text-muted-foreground">{character.nameAr}</p>
                <Badge className={`${tierColors[character.tier]} text-white mt-2`}>
                  {character.tier.toUpperCase()}
                </Badge>
                
                {/* Quick 3D View Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={() => setSelected3DCharacter(character)}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  عرض ثلاثي الأبعاد
                </Button>
              </div>

              {/* Stats */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    Speed
                  </span>
                  <span className="font-bold text-foreground">
                    {character.speed}x
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Boost
                  </span>
                  <span className="font-bold text-foreground">
                    +{character.boost}% / {character.boostDuration}min
                  </span>
                </div>

                {character.extraCoins > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Coins className="w-4 h-4" />
                      Extra Coins
                    </span>
                    <span className="font-bold text-foreground">
                      +{character.extraCoins}
                    </span>
                  </div>
                )}

                {character.jackpotBonus > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      Jackpot Bonus
                    </span>
                    <span className="font-bold text-foreground">
                      +{character.jackpotBonus}%
                    </span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-center">
                {character.isFree ? (
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1">
                    🎁 FREE
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="text-primary border-primary">
                      {character.priceTon} TON
                    </Badge>
                    <Badge variant="outline">
                      {character.priceTokens.toLocaleString()} BOLT
                    </Badge>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-muted-foreground mb-4">
          Join the Mining Platform to collect these characters!
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
          onClick={() => navigate('/')}
        >
          <Sparkles className="w-5 h-5 mr-2" />
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
