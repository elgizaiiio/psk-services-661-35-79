import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Zap, Clock, Gift, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BottomNavigation from '@/components/BottomNavigation';

const MiningNew = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { user, activeMiningSession, startMining } = useViralMining(telegramUser);
  
  const [miningImage, setMiningImage] = useState<string>('/lovable-uploads/8acfad30-aa90-4edd-b779-aafd43058584.png');
  const [progress, setProgress] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [tokensEarned, setTokensEarned] = useState(0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [canClaim, setCanClaim] = useState(false);

  // Fetch random mining image
  useEffect(() => {
    const fetchMiningImage = async () => {
      const { data } = await supabase
        .from('mining_images')
        .select('image_url')
        .eq('is_active', true);
      
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setMiningImage(data[randomIndex].image_url);
      }
    };
    fetchMiningImage();
  }, []);

  // Calculate mining progress
  useEffect(() => {
    if (!activeMiningSession) {
      setProgress(0);
      setTimeRemaining('');
      setTokensEarned(0);
      setCanClaim(false);
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const startTime = new Date(activeMiningSession.start_time);
      const endTime = new Date(activeMiningSession.end_time);
      
      const totalDuration = endTime.getTime() - startTime.getTime();
      const elapsed = now.getTime() - startTime.getTime();
      const progressPercent = Math.min((elapsed / totalDuration) * 100, 100);
      
      setProgress(progressPercent);

      // Calculate tokens earned
      const hoursElapsed = elapsed / (1000 * 60 * 60);
      const earned = hoursElapsed * (activeMiningSession.tokens_per_hour || 10);
      setTokensEarned(Math.floor(earned));

      // Calculate time remaining
      const remaining = endTime.getTime() - now.getTime();
      if (remaining <= 0) {
        setTimeRemaining('00:00:00');
        setCanClaim(true);
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        setCanClaim(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMiningSession]);

  const handleStartMining = async () => {
    try {
      await startMining();
      toast.success('Mining started successfully!');
    } catch (error) {
      toast.error('Failed to start mining');
    }
  };

  const handleClaim = async () => {
    if (!activeMiningSession || !user) return;
    
    setIsClaiming(true);
    try {
      const { error } = await supabase.functions.invoke('complete-mining-session', {
        body: { sessionId: activeMiningSession.id }
      });

      if (error) throw error;

      toast.success(`Claimed ${tokensEarned} BOLT!`);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  const userLevel = Math.floor((user?.token_balance || 0) / 10000) + 1;

  // Calculate multi-currency earnings
  const usdtEarned = tokensEarned * 0.001;
  const tonEarned = tokensEarned * 0.0001;

  return (
    <>
      <Helmet>
        <title>Mining - SUSPENDED</title>
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/95 pb-24 relative overflow-hidden">
        {/* Particle effects background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 400), 
                y: -10,
                opacity: 0.5 
              }}
              animate={{ 
                y: (typeof window !== 'undefined' ? window.innerHeight : 800) + 10,
                opacity: 0
              }}
              transition={{ 
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="p-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-primary">
              <AvatarImage src={telegramUser?.photo_url} />
              <AvatarFallback className="bg-primary/20">
                {telegramUser?.first_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">
                {telegramUser?.first_name || 'User'}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" />
                <span>LVL {userLevel}</span>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/wallet')}
            className="flex items-center gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
          >
            <Wallet className="w-4 h-4" />
            Wallet
          </Button>
        </div>

        {/* Main Mining Image */}
        <div className="px-4 mt-4 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <Card className="overflow-hidden bg-gradient-to-br from-card to-card/50 border-primary/20">
              <div className="relative aspect-square max-h-[300px] overflow-hidden">
                <img
                  src={miningImage}
                  alt="Mining"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                
                {/* Balance overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/30"
                  >
                    <Zap className="w-6 h-6 text-primary" />
                    <span className="text-2xl font-bold text-foreground">
                      {(user?.token_balance || 0).toLocaleString()}
                    </span>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Mining Progress Section */}
        <div className="px-4 mt-6 space-y-4 relative z-10">
          {activeMiningSession ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="mining-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Progress Card */}
                <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Time Remaining</span>
                    </div>
                    <span className="font-mono font-bold text-foreground">{timeRemaining || '24:00:00'}</span>
                  </div>
                  
                  <Progress value={progress} className="h-3 mb-3" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Earned</span>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="font-bold text-primary">+{tokensEarned.toLocaleString()} BOLT</span>
                    </div>
                  </div>
                </Card>

                {/* Multi-currency earnings */}
                <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-primary/20">
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Mined Currencies</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">BOLT</p>
                      <p className="font-bold text-primary">+{tokensEarned}</p>
                    </div>
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">USDT</p>
                      <p className="font-bold text-green-500">+{usdtEarned.toFixed(4)}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">TON</p>
                      <p className="font-bold text-blue-500">+{tonEarned.toFixed(5)}</p>
                    </div>
                  </div>
                </Card>

                {/* Claim Button */}
                <Button
                  onClick={handleClaim}
                  disabled={!canClaim || isClaiming}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isClaiming ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Zap className="w-6 h-6" />
                    </motion.div>
                  ) : canClaim ? (
                    <>
                      <Gift className="w-5 h-5 mr-2" />
                      Claim
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      Mining in progress...
                    </>
                  )}
                </Button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Button
                onClick={handleStartMining}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                <Zap className="w-5 h-5 mr-2" />
                Start Mining (24h)
              </Button>
            </motion.div>
          )}

          {/* Boost Button */}
          <Button
            variant="outline"
            onClick={() => navigate('/boost')}
            className="w-full h-12 border-primary/30 hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Boost Mining Power
          </Button>
        </div>
      </div>
      
      <BottomNavigation />
    </>
  );
};

export default MiningNew;
