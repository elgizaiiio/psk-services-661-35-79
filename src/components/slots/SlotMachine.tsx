import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlotReel } from "./SlotReel";
import { Symbol, SYMBOLS, getRandomSymbol, SlotSymbol } from "./SlotSymbol";
import { Zap, Sparkles, Gift, Clock, Volume2, VolumeX, Music, Music2 } from "lucide-react";
import { toast } from "sonner";
import { useSlotSounds } from "@/hooks/useSlotSounds";

const SOUND_ENABLED_KEY = 'slots_sound_enabled';
const MUSIC_ENABLED_KEY = 'slots_music_enabled';

interface SlotMachineProps {
  coins: number;
  onCoinsChange: (newCoins: number) => void;
  spinCost?: number;
  userId?: string;
}

// Get 3 different symbols (no matches = no win)
const getNoWinSymbols = (): Symbol[] => {
  const shuffled = [...SYMBOLS].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1], shuffled[2]];
};

const FREE_SPIN_KEY = 'slots_free_spin_time';
const FREE_SPIN_INTERVAL = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Calculate time remaining until next free spin
const getTimeUntilFreeSpin = (lastSpinTime: number | null) => {
  if (!lastSpinTime) return 0;
  const nextSpinTime = lastSpinTime + FREE_SPIN_INTERVAL;
  const remaining = nextSpinTime - Date.now();
  return remaining > 0 ? remaining : 0;
};

const formatCountdown = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const SlotMachine = ({ coins, onCoinsChange, spinCost = 10, userId }: SlotMachineProps) => {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<Symbol[]>([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [winningIndexes, setWinningIndexes] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number>(0);
  const [completedReels, setCompletedReels] = useState(0);
  const [hasFreeSpin, setHasFreeSpin] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(SOUND_ENABLED_KEY);
    return stored !== 'false'; // Default to true
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const stored = localStorage.getItem(MUSIC_ENABLED_KEY);
    return stored !== 'false'; // Default to true
  });
  const spinSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { playSpinSound, playStopSound, playWinSound, playJackpotSound, playNoWinSound, playClickSound, unlockAudio, unlockAndStartMusic } = useSlotSounds(soundEnabled, musicEnabled);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
      if (newValue) {
        void unlockAudio();
      }
      return newValue;
    });
  }, [unlockAudio]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem(MUSIC_ENABLED_KEY, String(newValue));
      if (newValue) {
        void unlockAndStartMusic();
      }
      return newValue;
    });
  }, [unlockAndStartMusic]);

  // Check if user has free spin available on mount
  useEffect(() => {
    const storedTime = localStorage.getItem(`${FREE_SPIN_KEY}_${userId || 'guest'}`);
    if (storedTime) {
      const time = parseInt(storedTime, 10);
      setLastSpinTime(time);
      const remaining = getTimeUntilFreeSpin(time);
      if (remaining === 0) {
        setHasFreeSpin(true);
      } else {
        setCountdown(remaining);
      }
    } else {
      // First time user - give free spin
      setHasFreeSpin(true);
    }
  }, [userId]);

  // Countdown timer
  useEffect(() => {
    if (hasFreeSpin || !lastSpinTime) return;
    
    const timer = setInterval(() => {
      const remaining = getTimeUntilFreeSpin(lastSpinTime);
      setCountdown(remaining);
      
      if (remaining === 0) {
        setHasFreeSpin(true);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [hasFreeSpin, lastSpinTime]);

  const useFreeSpin = () => {
    const now = Date.now();
    localStorage.setItem(`${FREE_SPIN_KEY}_${userId || 'guest'}`, now.toString());
    setLastSpinTime(now);
    setHasFreeSpin(false);
    setCountdown(FREE_SPIN_INTERVAL);
  };

  const calculateWin = useCallback((symbols: Symbol[]): number => {
    const [s1, s2, s3] = symbols;
    
    if (s1.id === s2.id && s2.id === s3.id) {
      return s1.value * 10;
    }
    
    if (s1.id === s2.id || s2.id === s3.id || s1.id === s3.id) {
      const matchingSymbol = s1.id === s2.id ? s1 : (s2.id === s3.id ? s2 : s1);
      return matchingSymbol.value * 2;
    }
    
    return 0;
  }, []);

  const getWinningIndexes = useCallback((symbols: Symbol[]): number[] => {
    const [s1, s2, s3] = symbols;
    
    if (s1.id === s2.id && s2.id === s3.id) return [0, 1, 2];
    if (s1.id === s2.id) return [0, 1];
    if (s2.id === s3.id) return [1, 2];
    if (s1.id === s3.id) return [0, 2];
    
    return [];
  }, []);

  const handleFreeSpin = useCallback(async () => {
    if (spinning || !hasFreeSpin) return;

    // Unlock audio and start music if enabled
    if (soundEnabled || musicEnabled) {
      await unlockAndStartMusic();
    }

    playClickSound();
    useFreeSpin();
    toast.info("🎁 لفة مجانية!");

    setSpinning(true);
    setWinningIndexes([]);
    setLastWin(0);
    setCompletedReels(0);

    // Start spin sound loop
    if (soundEnabled) {
      spinSoundIntervalRef.current = setInterval(playSpinSound, 80);
    }

    // Always give non-matching symbols
    const newResults = getNoWinSymbols();
    setResults(newResults);
  }, [spinning, hasFreeSpin, soundEnabled, musicEnabled, unlockAndStartMusic, playClickSound, playSpinSound]);

  const handleSpin = useCallback(async () => {
    if (spinning) return;

    if (coins < spinCost) {
      toast.error(`تحتاج ${spinCost} عملة للدوران!`);
      return;
    }

    // Unlock audio and start music if enabled
    if (soundEnabled || musicEnabled) {
      await unlockAndStartMusic();
    }

    playClickSound();
    onCoinsChange(coins - spinCost);

    setSpinning(true);
    setWinningIndexes([]);
    setLastWin(0);
    setCompletedReels(0);

    // Start spin sound loop
    if (soundEnabled) {
      spinSoundIntervalRef.current = setInterval(playSpinSound, 80);
    }

    const newResults = [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()];
    setResults(newResults);
  }, [spinning, coins, spinCost, onCoinsChange, soundEnabled, musicEnabled, unlockAndStartMusic, playClickSound, playSpinSound]);

  const handleReelComplete = useCallback(() => {
    setCompletedReels(prev => {
      const newCount = prev + 1;
      
      // Play stop sound for each reel
      playStopSound();
      
      if (newCount === 3) {
        // Stop spin sound
        if (spinSoundIntervalRef.current) {
          clearInterval(spinSoundIntervalRef.current);
          spinSoundIntervalRef.current = null;
        }
        
        setSpinning(false);
        const winAmount = calculateWin(results);
        const indexes = getWinningIndexes(results);
        
        setWinningIndexes(indexes);
        setLastWin(winAmount);
        
        if (winAmount > 0) {
          onCoinsChange(coins - spinCost + winAmount);
          
          if (indexes.length === 3) {
            playJackpotSound();
            toast.success(`🎰 جاكبوت! +${winAmount}`, { duration: 3000 });
          } else {
            playWinSound();
            toast.success(`🎉 فوز! +${winAmount}`);
          }
        } else {
          playNoWinSound();
        }
      }
      
      return newCount;
    });
  }, [results, calculateWin, getWinningIndexes, onCoinsChange, coins, spinCost, playStopSound, playWinSound, playJackpotSound, playNoWinSound]);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Win display */}
      <AnimatePresence>
        {lastWin > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex items-center gap-3 px-6 py-3 rounded-full bg-primary/20 border border-primary/40"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">+{lastWin}</span>
            <Sparkles className="w-5 h-5 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Machine frame */}
      <div className="relative p-6 rounded-3xl bg-gradient-to-b from-card to-card/50 border border-border/50 shadow-2xl">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        {/* Reels */}
        <div className="flex gap-4 p-5 rounded-2xl bg-muted/30 border border-border/30">
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[0]} 
            delay={0}
            isWinning={winningIndexes.includes(0)}
            onSpinComplete={handleReelComplete}
          />
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[1]} 
            delay={200}
            isWinning={winningIndexes.includes(1)}
            onSpinComplete={handleReelComplete}
          />
          <SlotReel 
            spinning={spinning} 
            finalSymbol={results[2]} 
            delay={400}
            isWinning={winningIndexes.includes(2)}
            onSpinComplete={handleReelComplete}
          />
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>

      {/* Buttons row */}
      <div className="flex items-center justify-center gap-4 w-full">
        {/* Left side controls */}
        <div className="flex items-center gap-2">
          {/* Music toggle button */}
          <motion.button
            onClick={toggleMusic}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-border/30 ${
              musicEnabled 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {musicEnabled ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4 opacity-50" />}
          </motion.button>

          {/* Sound toggle button */}
          <motion.button
            onClick={toggleSound}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-border/30 ${
              soundEnabled 
                ? 'bg-primary/20 text-primary' 
                : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            whileTap={{ scale: 0.9 }}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>

        {/* Spin button - center */}
        <motion.button
          onClick={handleSpin}
          disabled={spinning || coins < spinCost}
          className={`
            relative w-20 h-20 rounded-full
            flex items-center justify-center
            font-bold text-lg
            transition-all duration-200
            ${spinning || coins < spinCost 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)]'
            }
          `}
          whileHover={!spinning && coins >= spinCost ? { scale: 1.05 } : {}}
          whileTap={!spinning && coins >= spinCost ? { scale: 0.95 } : {}}
          animate={!spinning && coins >= spinCost ? {
            boxShadow: ['0 0 20px hsl(var(--primary)/0.3)', '0 0 35px hsl(var(--primary)/0.5)', '0 0 20px hsl(var(--primary)/0.3)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {spinning ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-8 h-8" />
            </motion.div>
          ) : (
            <Zap className="w-8 h-8" />
          )}
        </motion.button>

        {/* Free spin button - far right */}
        {hasFreeSpin ? (
          <motion.button
            onClick={handleFreeSpin}
            disabled={spinning}
            className={`
              relative w-12 h-12 rounded-full
              flex items-center justify-center
              transition-all duration-200
              ${spinning 
                ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                : 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]'
              }
            `}
            whileHover={!spinning ? { scale: 1.05 } : {}}
            whileTap={!spinning ? { scale: 0.95 } : {}}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <Gift className="w-5 h-5" />
          </motion.button>
        ) : (
          <div className="w-12 h-12" /> 
        )}
      </div>

      {/* Spin cost & free spin info */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          تكلفة الدوران: <span className="text-primary font-medium">{spinCost}</span>
        </p>
        
        {hasFreeSpin ? (
          <motion.p 
            className="text-xs text-yellow-500 font-medium"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🎁 لديك لفة مجانية!
          </motion.p>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>اللفة المجانية القادمة:</span>
            <span className="font-mono text-primary font-medium">{formatCountdown(countdown)}</span>
          </div>
        )}
      </div>


      {/* Prize table */}
      <div className="w-full max-w-xs p-4 rounded-2xl bg-card/50 border border-border/30">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-4">الجوائز</h3>
        <div className="space-y-3">
          {SYMBOLS.slice().reverse().map((symbol) => (
            <div key={symbol.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlotSymbol symbol={symbol} size="sm" />
                <SlotSymbol symbol={symbol} size="sm" />
                <SlotSymbol symbol={symbol} size="sm" />
              </div>
              <span className="text-primary font-bold">×{symbol.value * 10}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground text-center">
            2 متطابقة = ×2
          </div>
        </div>
      </div>
    </div>
  );
};
