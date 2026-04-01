import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';

import { useMonthlyWinnerModal } from '@/hooks/useMonthlyWinnerModal';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap } from 'lucide-react';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import DailyStreakModal from '@/components/DailyStreakModal';

import MonthlyWinnerModal from '@/components/MonthlyWinnerModal';
import WinnerPrizeModal from '@/components/WinnerPrizeModal';

const PRIZE_MODAL_KEY = 'winner_prize_shown_v1';

// Static home page banners – ordered by display priority
const STATIC_BANNERS = [
  {
    id: 'server',
    src: '/images/home/server-now.jpg',
    alt: 'Get Your Server Now',
    route: '/mining-servers',
    aspect: 'aspect-[16/9]',
  },
  {
    id: 'luck',
    src: '/images/home/try-luck.jpg',
    alt: 'Try Your Luck Now',
    route: '/spin',
    aspect: 'aspect-[16/9]',
  },
  {
    id: 'gifts',
    src: '/images/home/daily-gifts.jpg',
    alt: 'Daily Gifts Up To $1,000',
    route: '/daily-tasks',
    aspect: 'aspect-[16/9]',
  },
  {
    id: 'tasks',
    src: '/images/home/tasks.jpg',
    alt: 'Tasks',
    route: '/tasks',
    aspect: 'aspect-[16/9]',
  },
  {
    id: 'premium',
    src: '/images/home/premium.jpg',
    alt: 'Premium',
    route: '/premium-packages',
    aspect: 'aspect-square',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { loading, error, clearError } = useBoltMining(telegramUser);
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();

  const { shouldShowModal: showWinnerModal, markAsShown: closeWinnerModal } = useMonthlyWinnerModal();
  const [prizeModalOpen, setPrizeModalOpen] = useState(false);
  const [boltUserId, setBoltUserId] = useState<string | undefined>(undefined);
  useTelegramBackButton();

  // Show prize modal once per user (first visit only)
  useEffect(() => {
    if (!telegramUser?.id) return;
    const key = `${PRIZE_MODAL_KEY}_${telegramUser.id}`;
    if (localStorage.getItem(key)) return;

    const fetchBoltUser = async () => {
      const { data } = await supabase
        .from('bolt_users')
        .select('id')
        .eq('telegram_id', telegramUser.id)
        .maybeSingle();
      if (data?.id) setBoltUserId(data.id);
    };
    fetchBoltUser();

    const timer = setTimeout(() => {
      setPrizeModalOpen(true);
      localStorage.setItem(key, 'true');
    }, 1200);

    return () => clearTimeout(timer);
  }, [telegramUser?.id]);

  const handleNavigate = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </main>
    );
  }

  if (!telegramUser?.id) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground text-center">Open from Telegram</p>
        <a
          href="https://t.me/Boltminingbot"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm"
        >
          Open App
        </a>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <p className="text-destructive text-sm">{error}</p>
          <Button onClick={clearError} size="sm" variant="outline">Retry</Button>
        </div>
      </main>
    );
  }

  // Separate rectangle banners (first 4) from square ones (last 1)
  const rectBanners = STATIC_BANNERS.filter(b => b.aspect !== 'aspect-square');
  const squareBanners = STATIC_BANNERS.filter(b => b.aspect === 'aspect-square');

  return (
    <PageWrapper className="min-h-screen bg-background pb-20">
      <Helmet><title>Bolt Mining</title></Helmet>
      <DailyStreakModal />

      <MonthlyWinnerModal
        isOpen={showWinnerModal}
        onClose={closeWinnerModal}
        username={telegramUser?.username || telegramUser?.first_name || 'Winner'}
      />

      <WinnerPrizeModal
        isOpen={prizeModalOpen}
        onClose={() => setPrizeModalOpen(false)}
        userName={telegramUser?.first_name || telegramUser?.username}
        userId={boltUserId}
      />

      <div className="max-w-md mx-auto px-4 pt-14 space-y-3">

        {/* Rectangle Banners */}
        {rectBanners.map((banner, i) => (
          <FadeUp key={banner.id} delay={0.05 + i * 0.07}>
            <motion.button
              onClick={() => handleNavigate(banner.route)}
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.01 }}
              className="w-full overflow-hidden rounded-2xl"
            >
              <img
                src={banner.src}
                alt={banner.alt}
                className={`w-full h-auto ${banner.aspect} object-cover`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </motion.button>
          </FadeUp>
        ))}

        {/* Square Banners row */}
        {squareBanners.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {squareBanners.map((banner, i) => (
              <FadeUp key={banner.id} delay={0.05 + (rectBanners.length + i) * 0.07}>
                <motion.button
                  onClick={() => handleNavigate(banner.route)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  className="w-full overflow-hidden rounded-2xl"
                >
                  <img
                    src={banner.src}
                    alt={banner.alt}
                    className="w-full h-auto aspect-square object-cover"
                    loading="lazy"
                  />
                </motion.button>
              </FadeUp>
            ))}
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default Index;
