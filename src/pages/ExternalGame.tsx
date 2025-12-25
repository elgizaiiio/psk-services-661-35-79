import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ExternalGameEmbed from '@/components/games/ExternalGameEmbed';
import { externalGames } from '@/data/externalGames';
import { useGameData } from '@/hooks/useGameData';

const ExternalGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { player, submitScore } = useGameData();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const game = externalGames.find(g => g.id === gameId);

  useEffect(() => {
    // Track play time and give reward after 30 seconds
    if (isPlaying && playStartTime && !rewardClaimed) {
      const timer = setInterval(() => {
        const playTime = (Date.now() - playStartTime) / 1000;
        if (playTime >= 30) {
          claimReward();
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isPlaying, playStartTime, rewardClaimed]);

  const claimReward = async () => {
    if (!game || rewardClaimed) return;
    
    try {
      await submitScore(game.reward);
      setRewardClaimed(true);
      toast.success(`+${game.reward} BOLT مكافأة اللعب! ⚡`, {
        description: 'استمر باللعب لكسب المزيد'
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
    navigate('/arcade');
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">اللعبة غير موجودة</p>
          <Button onClick={() => navigate('/arcade')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للألعاب
          </Button>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <>
        <Helmet>
          <title>{game.title} - Bolt Arcade</title>
        </Helmet>
        <ExternalGameEmbed
          embedUrl={game.embedUrl}
          title={game.title}
          isFullscreen={isFullscreen}
          onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
          onClose={handleClose}
        />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{game.title} - Bolt Arcade</title>
        <meta name="description" content={game.description} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/arcade')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold truncate">{game.title}</h1>
          </div>
        </div>

        {/* Game preview */}
        <div className="p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden"
          >
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-full aspect-video object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={handleStartPlaying}
                  className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90"
                >
                  <Play className="w-10 h-10 fill-current" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Game info */}
        <div className="px-4 space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">
              {game.category}
            </Badge>
            <Badge className="bg-primary/20 text-primary border-0">
              <Zap className="w-3 h-3 mr-1" />
              +{game.reward} BOLT
            </Badge>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">{game.title}</h2>
            <p className="text-muted-foreground">{game.description}</p>
          </div>

          {/* Reward info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-xl p-4 border border-primary/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold">مكافأة اللعب</p>
                <p className="text-sm text-muted-foreground">
                  العب لمدة 30 ثانية واحصل على +{game.reward} BOLT
                </p>
              </div>
            </div>
          </motion.div>

          {/* Player coins */}
          {player && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">رصيدك الحالي</span>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="font-bold text-lg">{player.coins.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Play button */}
          <Button
            size="lg"
            onClick={handleStartPlaying}
            className="w-full h-14 text-lg"
          >
            <Play className="w-5 h-5 mr-2" />
            ابدأ اللعب
          </Button>
        </div>
      </div>
    </>
  );
};

export default ExternalGame;
