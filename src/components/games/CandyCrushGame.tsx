import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Heart, Zap, RotateCcw, Home, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import CandyGrid from './CandyGrid';
import { useCandyCrush } from '@/hooks/useCandyCrush';
import { cn } from '@/lib/utils';

interface CandyCrushGameProps {
  onBack: () => void;
}

const CandyCrushGame: React.FC<CandyCrushGameProps> = ({ onBack }) => {
  const {
    level,
    gameState,
    progress,
    gameStatus,
    selectedCell,
    startLevel,
    handleCellClick,
    resetLevel,
    exitGame,
    calculateLives,
    getTimeToNextLife,
    maxLives,
    candyLevels,
  } = useCandyCrush();

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const currentLives = calculateLives();
  const timeToNextLife = getTimeToNextLife();

  // Level Selection Screen
  if (gameStatus === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-4">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold text-white">Candy Crush</h1>
        </div>

        {/* Lives Display */}
        <Card className="bg-black/30 backdrop-blur-sm border-white/20 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {Array.from({ length: maxLives }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn(
                    "w-6 h-6 transition-colors",
                    i < currentLives 
                      ? "fill-red-500 text-red-500" 
                      : "text-gray-500"
                  )}
                />
              ))}
            </div>
            {currentLives < maxLives && (
              <div className="text-sm text-white/70">
                Next life: {formatTime(timeToNextLife)}
              </div>
            )}
          </div>
        </Card>

        {/* Stats */}
        <Card className="bg-black/30 backdrop-blur-sm border-white/20 p-4 mb-6">
          <div className="flex items-center justify-between text-white">
            <div className="text-center">
              <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
              <div className="text-lg font-bold">{progress.totalScore.toLocaleString()}</div>
              <div className="text-xs text-white/60">Total Score</div>
            </div>
            <div className="text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
              <div className="text-lg font-bold">
                {Object.values(progress.stars).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-xs text-white/60">Total Stars</div>
            </div>
            <div className="text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
              <div className="text-lg font-bold">{progress.highestLevel}</div>
              <div className="text-xs text-white/60">Highest Level</div>
            </div>
          </div>
        </Card>

        {/* Level Grid */}
        <div className="grid grid-cols-5 gap-2">
          {candyLevels.map((lvl) => {
            const isLocked = lvl.id > progress.highestLevel;
            const stars = progress.stars[lvl.id] || 0;
            const isCompleted = stars > 0;
            
            return (
              <motion.button
                key={lvl.id}
                onClick={() => !isLocked && startLevel(lvl.id)}
                className={cn(
                  "relative aspect-square rounded-xl flex flex-col items-center justify-center",
                  "transition-all duration-200",
                  isLocked 
                    ? "bg-gray-800/50 cursor-not-allowed" 
                    : isCompleted
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 hover:scale-105"
                    : "bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-105"
                )}
                whileTap={!isLocked ? { scale: 0.95 } : undefined}
                disabled={isLocked}
              >
                {isLocked ? (
                  <span className="text-xl text-gray-500">🔒</span>
                ) : (
                  <>
                    <span className="text-xl font-bold text-white">{lvl.id}</span>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "w-3 h-3",
                            s <= stars 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-white/30"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Game Screen
  if (gameStatus === 'playing' && gameState && level) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={exitGame} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <div className="text-sm text-white/70">Level {level.id}</div>
            <div className="text-xl font-bold text-white">{gameState.score.toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full">
            <Target className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{gameState.moves}</span>
          </div>
        </div>

        {/* Goals */}
        <Card className="bg-black/30 backdrop-blur-sm border-white/20 p-3 mb-4">
          <div className="flex items-center justify-around">
            {level.goals.map((goal, index) => {
              const collected = gameState.collectedCandies[goal.candy] || 0;
              const progress = Math.min(100, (collected / goal.count) * 100);
              const isComplete = collected >= goal.count;
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <span className="text-2xl">{goal.candy}</span>
                  <div className="text-xs text-white mt-1">
                    <span className={cn(isComplete && "text-green-400 font-bold")}>
                      {collected}
                    </span>
                    /{goal.count}
                  </div>
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mt-1 overflow-hidden">
                    <motion.div 
                      className={cn(
                        "h-full rounded-full",
                        isComplete ? "bg-green-400" : "bg-yellow-400"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Combo Display */}
        <AnimatePresence>
          {gameState.combo > 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="text-center mb-2"
            >
              <span className="text-2xl font-bold text-yellow-400 drop-shadow-lg">
                Combo x{gameState.combo}! 🔥
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Grid */}
        <div className="flex-1 flex items-center justify-center">
          <CandyGrid
            grid={gameState.grid}
            selectedCell={selectedCell}
            onCellClick={handleCellClick}
            isAnimating={gameState.isAnimating}
          />
        </div>

        {/* Score Target */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-white/70 mb-1">
            <span>Score Progress</span>
            <span>{gameState.score.toLocaleString()} / {level.targetScore.toLocaleString()}</span>
          </div>
          <Progress 
            value={Math.min(100, (gameState.score / level.targetScore) * 100)} 
            className="h-3 bg-white/20"
          />
        </div>
      </div>
    );
  }

  // Win/Lose Screen
  if ((gameStatus === 'won' || gameStatus === 'lost') && level) {
    const stars = gameStatus === 'won' 
      ? (gameState?.score || 0) >= level.targetScore * 1.5 ? 3 
        : (gameState?.score || 0) >= level.targetScore * 1.2 ? 2 
        : 1
      : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-sm"
        >
          <Card className="bg-black/50 backdrop-blur-md border-white/20 p-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-6xl mb-4"
            >
              {gameStatus === 'won' ? '🎉' : '😢'}
            </motion.div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {gameStatus === 'won' ? 'Level Complete!' : 'Level Failed'}
            </h2>
            
            {gameStatus === 'won' && (
              <>
                <div className="flex justify-center gap-2 my-4">
                  {[1, 2, 3].map((s) => (
                    <motion.div
                      key={s}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3 + s * 0.15, type: 'spring' }}
                    >
                      <Star
                        className={cn(
                          "w-10 h-10",
                          s <= stars
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-600"
                        )}
                      />
                    </motion.div>
                  ))}
                </div>
                
                <div className="text-xl font-bold text-yellow-400 mb-2">
                  +{level.reward * stars} BOLT
                </div>
              </>
            )}
            
            <div className="text-white/70 mb-6">
              Score: {gameState?.score.toLocaleString() || 0}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 border-white/30 text-white hover:bg-white/10"
                onClick={exitGame}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              
              {gameStatus === 'won' && level.id < candyLevels.length ? (
                <Button
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={() => startLevel(level.id + 1)}
                >
                  Next Level
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={resetLevel}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return null;
};

export default CandyCrushGame;
