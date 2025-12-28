import { useState, useEffect } from "react";
import { X, Clock, Gift } from "lucide-react";
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
  const [playStartTime, setPlayStartTime] = useState<number | null>(null);
  const [rewardsClaimed, setRewardsClaimed] = useState({
    twoMin: false,
    fiveMin: false,
    tenMin: false,
  });
  const [playTime, setPlayTime] = useState(0);

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

  useEffect(() => {
    if (!playStartTime || !isPlaying) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - playStartTime) / 1000);
      setPlayTime(elapsed);

      if (elapsed >= 120 && !rewardsClaimed.twoMin) {
        addTokens(15);
        setRewardsClaimed((prev) => ({ ...prev, twoMin: true }));
        toast.success("+15 BOLT (2 min)");
      }

      if (elapsed >= 300 && !rewardsClaimed.fiveMin) {
        addTokens(30);
        setRewardsClaimed((prev) => ({ ...prev, fiveMin: true }));
        toast.success("+30 BOLT (5 min)");
      }

      if (elapsed >= 600 && !rewardsClaimed.tenMin) {
        addTokens(50);
        setRewardsClaimed((prev) => ({ ...prev, tenMin: true }));
        toast.success("+50 BOLT (10 min)");
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

  if (showRotatePrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-24 border-2 border-border rounded-2xl mx-auto mb-6 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-muted rounded-full" />
          </div>

          <h1 className="text-xl font-semibold text-foreground mb-2">
            Rotate Your Phone
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This game works best in landscape mode
          </p>

          <div className="p-4 rounded-xl bg-card border border-border mb-6">
            <p className="text-sm font-medium text-foreground mb-3">Play Rewards</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">2 min</span>
                <span className="text-primary font-medium">+15 BOLT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">5 min</span>
                <span className="text-primary font-medium">+30 BOLT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">10 min</span>
                <span className="text-primary font-medium">+50 BOLT</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleStartPlaying} className="flex-1">
              Play Anyway
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-white font-mono text-sm">{formatTime(playTime)}</span>
        </div>

        <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm">
          <Gift className="w-4 h-4 text-primary" />
          <span className="text-white text-sm">
            {Object.values(rewardsClaimed).filter(Boolean).length}/3
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="bg-black/60 text-white hover:bg-white/20 h-8 w-8 rounded-lg"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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
