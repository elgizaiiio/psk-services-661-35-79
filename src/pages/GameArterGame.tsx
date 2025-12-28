import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Maximize2, Minimize2, X, Loader2, Zap, Clock, Gift, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gameArterGames } from '@/data/gameArterGames';
import { useGameData } from '@/hooks/useGameData';
import { toast } from 'sonner';

const GameArterGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { player, submitScore } = useGameData();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [playTime, setPlayTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const game = gameArterGames.find(g => g.id === gameId);

  // Track play time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && playStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - playStartTime) / 1000);
        setPlayTime(elapsed);
        
        // Claim reward after 3 minutes (180 seconds)
        if (elapsed >= 180 && !rewardClaimed && game) {
          claimReward();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playStartTime, rewardClaimed, game]);

  const claimReward = async () => {
    if (!game || rewardClaimed) return;
    
    try {
      await submitScore(game.reward);
      setRewardClaimed(true);
      toast.success(`🎉 حصلت على ${game.reward} BOLT!`, {
        description: 'استمر في اللعب للحصول على المزيد من المكافآت'
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const handleStartPlaying = () => {
    setIsPlaying(true);
    setPlayStartTime(Date.now());
  };

  const handleClose = () => {
    setIsPlaying(false);
    setIsFullscreen(false);
    navigate('/gamearter');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Gamepad2 className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">اللعبة غير موجودة</h2>
        <Button onClick={() => navigate('/gamearter')}>
          العودة للألعاب
        </Button>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div 
        ref={containerRef}
        className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-background`}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-12 h-12 text-primary" />
            </motion.div>
            <p className="mt-4 text-muted-foreground">جاري تحميل اللعبة...</p>
          </div>
        )}

        {/* Controls bar */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium text-foreground">{game.titleAr}</span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Play time */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {formatTime(playTime)}
            </div>
            
            {/* Reward status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              rewardClaimed 
                ? 'bg-green-500/20 text-green-500' 
                : playTime >= 120 
                  ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' 
                  : 'bg-secondary text-muted-foreground'
            }`}>
              {rewardClaimed ? (
                <>
                  <Gift className="w-3 h-3" />
                  تم الحصول على المكافأة
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  {Math.max(0, 180 - playTime)}s للمكافأة
                </>
              )}
            </div>

            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Game iframe */}
        <iframe
          src={game.embedUrl}
          title={game.title}
          className="w-full h-full border-0 pt-12"
          style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 48px)' }}
          allowFullScreen
          allow="autoplay; fullscreen; gamepad"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/gamearter')}
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">{game.titleAr}</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Game preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 via-secondary to-primary/10 border border-border"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Gamepad2 className="w-20 h-20 text-primary/40" />
          </div>
          
          {/* Play button overlay */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <Button
              size="lg"
              onClick={handleStartPlaying}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl"
            >
              <Gamepad2 className="w-6 h-6 ml-2" />
              ابدأ اللعب
            </Button>
          </motion.div>
        </motion.div>

        {/* Game info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Title and description */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{game.titleAr}</h2>
            <p className="text-muted-foreground mt-1">{game.descriptionAr}</p>
          </div>

          {/* Reward card */}
          <div className="p-4 rounded-xl bg-gradient-to-l from-yellow-500/20 via-yellow-500/10 to-transparent border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مكافأة اللعب</p>
                  <p className="text-xl font-bold text-foreground flex items-center gap-1">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    {game.reward} BOLT
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground">العب لمدة</p>
                <p className="text-lg font-bold text-primary">3 دقائق</p>
              </div>
            </div>
          </div>

          {/* Current balance */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">رصيدك الحالي</span>
              <span className="text-xl font-bold text-foreground flex items-center gap-1">
                <Zap className="w-5 h-5 text-yellow-500" />
                {player?.coins?.toLocaleString() || 0} BOLT
              </span>
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <h3 className="font-semibold text-foreground mb-3">كيف تعمل المكافآت؟</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">1</div>
                ابدأ اللعب بالضغط على زر "ابدأ اللعب"
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">2</div>
                العب لمدة 3 دقائق على الأقل
              </li>
              <li className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary">3</div>
                احصل على مكافأتك تلقائياً!
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GameArterGame;
