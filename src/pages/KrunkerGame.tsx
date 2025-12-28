import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X, Maximize2, Gift, Clock, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";

const KrunkerGame = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const [showRotatePrompt, setShowRotatePrompt] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [rewardsClaimed, setRewardsClaimed] = useState({
    twoMin: false,
    fiveMin: false,
    tenMin: false,
  });
  const [playTime, setPlayTime] = useState(0);

  // Check orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      if (isLandscape && showRotatePrompt) {
        setShowRotatePrompt(false);
        setIsPlaying(true);
        setPlayStartTime(Date.now());
      }
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, [showRotatePrompt]);

  // Add tokens to user balance
  const addTokens = async (amount: number) => {
    if (!telegramUser) return;
    
    try {
      const { data: user } = await supabase
        .from('bolt_users')
        .select('id, token_balance')
        .eq('telegram_id', telegramUser.id)
        .single();
      
      if (user) {
        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (user.token_balance || 0) + amount,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Error adding tokens:', err);
    }
  };

  // Track play time and rewards
  useEffect(() => {
    if (!playStartTime || !isPlaying) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - playStartTime) / 1000);
      setPlayTime(elapsed);

      // 2 minutes = +15 BOLT
      if (elapsed >= 120 && !rewardsClaimed.twoMin) {
        addTokens(15);
        setRewardsClaimed((prev) => ({ ...prev, twoMin: true }));
        toast.success("🎮 +15 BOLT! لعبت دقيقتين");
      }

      // 5 minutes = +30 BOLT
      if (elapsed >= 300 && !rewardsClaimed.fiveMin) {
        addTokens(30);
        setRewardsClaimed((prev) => ({ ...prev, fiveMin: true }));
        toast.success("🔥 +30 BOLT! لعبت 5 دقائق");
      }

      // 10 minutes = +50 BOLT
      if (elapsed >= 600 && !rewardsClaimed.tenMin) {
        addTokens(50);
        setRewardsClaimed((prev) => ({ ...prev, tenMin: true }));
        toast.success("🏆 +50 BOLT! لعبت 10 دقائق");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [playStartTime, isPlaying, rewardsClaimed, telegramUser]);

  const handleStartPlaying = () => {
    setShowRotatePrompt(false);
    setIsPlaying(true);
    setPlayStartTime(Date.now());
  };

  const handleClose = () => {
    navigate("/");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Rotate prompt screen
  if (showRotatePrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-900 via-orange-900 to-yellow-900 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          {/* Rotating phone animation */}
          <motion.div
            animate={{ rotate: [0, 90, 90, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            className="mb-8"
          >
            <div className="w-20 h-32 border-4 border-white rounded-2xl mx-auto relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/50 rounded-full" />
              <Gamepad2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-3">
            اقلب هاتفك للعب! 📱
          </h1>
          <p className="text-white/70 mb-6 text-sm">
            Krunker.io يعمل بشكل أفضل في الوضع الأفقي
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <RotateCcw className="w-5 h-5 text-yellow-400 animate-spin" />
            <span className="text-yellow-400 font-medium">انتظار القلب...</span>
          </div>

          {/* Rewards info */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-6 max-w-xs mx-auto">
            <h3 className="text-white font-bold mb-3 flex items-center justify-center gap-2">
              <Gift className="w-5 h-5 text-yellow-400" />
              مكافآت اللعب
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/80">
                <span>دقيقتين</span>
                <span className="text-yellow-400 font-bold">+15 BOLT</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>5 دقائق</span>
                <span className="text-yellow-400 font-bold">+30 BOLT</span>
              </div>
              <div className="flex justify-between text-white/80">
                <span>10 دقائق</span>
                <span className="text-yellow-400 font-bold">+50 BOLT</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleStartPlaying}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold"
            >
              العب الآن على أي حال
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-white/30 text-white hover:bg-white/10"
            >
              رجوع
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game playing screen
  return (
    <div className={`fixed inset-0 z-50 bg-black ${isFullscreen ? "" : ""}`}>
      {/* Controls overlay */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-2">
        {/* Play time */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-mono text-sm">{formatTime(playTime)}</span>
        </div>

        {/* Rewards progress */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1">
          <Gift className="w-4 h-4 text-yellow-400" />
          <span className="text-white text-sm">
            {Object.values(rewardsClaimed).filter(Boolean).length}/3
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-black/70 text-white hover:bg-white/20 h-8 w-8"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="bg-black/70 text-white hover:bg-white/20 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Reward notifications */}
      <AnimatePresence>
        {playTime > 0 && playTime < 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm rounded-lg px-4 py-2"
          >
            <span className="text-white font-bold text-sm">
              🎮 العب للحصول على مكافآت BOLT!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game iframe */}
      <iframe
        src="https://krunker.io"
        className="w-full h-full"
        allow="fullscreen; autoplay; pointer-lock"
        allowFullScreen
      />
    </div>
  );
};

export default KrunkerGame;
