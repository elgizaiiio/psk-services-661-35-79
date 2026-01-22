import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useBoltMining } from '@/hooks/useBoltMining';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useLimitedOfferModal } from '@/hooks/useLimitedOfferModal';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Wallet, Zap } from 'lucide-react';
import { PageWrapper, FadeUp } from '@/components/ui/motion-wrapper';
import DailyStreakModal from '@/components/DailyStreakModal';
import LimitedOfferModal from '@/components/offers/LimitedOfferModal';
import WelcomeModal from '@/components/WelcomeModal';
import MonthlyWinnerModal from '@/components/MonthlyWinnerModal';
import UserAvatar from '@/components/UserAvatar';
import PromoBanner from '@/components/home/PromoBanner';

interface HomeSection {
  id: string;
  image_url: string;
  internal_route: string;
  display_order: number;
  layout_type: 'rectangle' | 'square';
}

const Index = () => {
  const navigate = useNavigate();
  const { user: telegramUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { loading, error, clearError } = useBoltMining(telegramUser);
  const { isConnected, isConnecting, connectWallet } = useTelegramTonConnect();
  const { shouldShowModal: showLimitedOffer, markAsShown: closeLimitedOffer } = useLimitedOfferModal();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  
  useTelegramBackButton();

  // Check if first visit for welcome modal
  useEffect(() => {
    if (telegramUser?.id) {
      const welcomeKey = `welcome_shown_${telegramUser.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeKey);
      if (!hasSeenWelcome) {
        setShowWelcomeModal(true);
      }
    }
  }, [telegramUser?.id]);

  // Show winner modal after welcome modal closes or if already seen welcome
  useEffect(() => {
    if (telegramUser?.id && !showWelcomeModal) {
      const welcomeKey = `welcome_shown_${telegramUser.id}`;
      const hasSeenWelcome = localStorage.getItem(welcomeKey);
      if (hasSeenWelcome) {
        // Show winner modal after a short delay
        const timer = setTimeout(() => {
          setShowWinnerModal(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [telegramUser?.id, showWelcomeModal]);

  const handleWelcomeClose = () => {
    if (telegramUser?.id) {
      localStorage.setItem(`welcome_shown_${telegramUser.id}`, 'true');
    }
    setShowWelcomeModal(false);
    // Show winner modal after welcome
    setTimeout(() => setShowWinnerModal(true), 300);
  };

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('home_sections' as any)
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      setSections((data || []) as unknown as HomeSection[]);
      setSectionsLoading(false);
    };
    fetchSections();
  }, []);

  const handleNavigate = (path: string) => {
    hapticFeedback.impact('light');
    navigate(path);
  };

  if (authLoading || loading || sectionsLoading) {
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
        <a href="https://t.me/Boltminingbot" target="_blank" rel="noopener noreferrer"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium text-sm">
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

  // Group sections by layout for proper rendering
  const rectangleSections = sections.filter(s => s.layout_type === 'rectangle');
  const squareSections = sections.filter(s => s.layout_type === 'square');

  // Create rows: first rectangles, then pairs of squares, then triplets
  const renderSections = () => {
    const elements: JSX.Element[] = [];
    let delayIndex = 0;

    // Rectangle sections (full width)
    rectangleSections.forEach((section) => {
      elements.push(
        <FadeUp key={section.id} delay={0.1 + delayIndex * 0.05}>
          <motion.button
            onClick={() => handleNavigate(section.internal_route)}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            className="w-full overflow-hidden rounded-2xl"
          >
            <img
              src={section.image_url}
              alt=""
              className="w-full h-auto aspect-[2/1] object-cover"
              loading="lazy"
            />
          </motion.button>
        </FadeUp>
      );
      delayIndex++;
    });

    // Square sections in rows of 2 then 3
    let remaining = [...squareSections];
    
    // First row of 2
    if (remaining.length >= 2) {
      const row = remaining.splice(0, 2);
      elements.push(
        <div key="row-2" className="grid grid-cols-2 gap-3">
          {row.map((section, idx) => (
            <FadeUp key={section.id} delay={0.1 + (delayIndex + idx) * 0.05}>
              <motion.button
                onClick={() => handleNavigate(section.internal_route)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={section.image_url}
                  alt=""
                  className="w-full h-auto aspect-square object-cover"
                  loading="lazy"
                />
              </motion.button>
            </FadeUp>
          ))}
        </div>
      );
      delayIndex += 2;
    }

    // Remaining rows of 3
    while (remaining.length > 0) {
      const row = remaining.splice(0, 3);
      elements.push(
        <div key={`row-3-${delayIndex}`} className="grid grid-cols-3 gap-3">
          {row.map((section, idx) => (
            <FadeUp key={section.id} delay={0.1 + (delayIndex + idx) * 0.05}>
              <motion.button
                onClick={() => handleNavigate(section.internal_route)}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className="w-full overflow-hidden rounded-2xl"
              >
                <img
                  src={section.image_url}
                  alt=""
                  className="w-full h-auto aspect-square object-cover"
                  loading="lazy"
                />
              </motion.button>
            </FadeUp>
          ))}
        </div>
      );
      delayIndex += row.length;
    }

    return elements;
  };

  return (
    <PageWrapper className="min-h-screen bg-background pb-20">
      <Helmet><title>Bolt Mining</title></Helmet>
      <DailyStreakModal />
      <LimitedOfferModal isOpen={showLimitedOffer} onClose={closeLimitedOffer} />
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleWelcomeClose}
        userName={telegramUser?.first_name}
      />
      <MonthlyWinnerModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        userName={telegramUser?.username || telegramUser?.first_name}
      />

      <div className="max-w-md mx-auto px-4 pt-6 space-y-3">
        
        {/* Animated Promo Banner */}
        <FadeUp delay={0.1}>
          <PromoBanner />
        </FadeUp>

        {/* Image-based Sections */}
        {renderSections()}

      </div>
    </PageWrapper>
  );
};

export default Index;