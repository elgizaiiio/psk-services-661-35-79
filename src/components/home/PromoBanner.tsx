import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string | null;
  link_url: string | null;
  internal_route: string | null;
}

const PromoBanner: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('promo_banners')
        .select('id, image_url, link_url, internal_route')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (banner: Banner) => {
    // Priority: internal_route > link_url
    if (banner.internal_route) {
      navigate(banner.internal_route);
    } else if (banner.link_url) {
      window.open(banner.link_url, '_blank');
    }
  };

  const goToPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="w-full aspect-[16/7] rounded-2xl bg-muted animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return (
      <motion.div 
        className="w-full aspect-[16/7] rounded-2xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border flex items-center justify-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Sparkles className="w-5 h-5 text-primary" />
        <p className="text-foreground text-sm font-medium">Special offers coming soon</p>
      </motion.div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <motion.div 
      className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => handleClick(currentBanner)}
        >
          {currentBanner.image_url ? (
            <img
              src={currentBanner.image_url}
              alt="Promo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-card to-accent/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-foreground/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PromoBanner;