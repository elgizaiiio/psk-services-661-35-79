import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
}

const PromoBanner: React.FC = () => {
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
        .select('id, title, image_url, link_url')
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

  const handleClick = (linkUrl: string | null) => {
    if (linkUrl) {
      window.open(linkUrl, '_blank');
    }
  };

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % banners.length);
  };

  if (loading) {
    return (
      <div className="w-full h-24 rounded-xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full h-24 rounded-xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border flex items-center justify-center gap-3">
        <Sparkles className="w-5 h-5 text-primary" />
        <p className="text-foreground text-sm font-medium">Special offers coming soon</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-border">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 cursor-pointer"
          onClick={() => handleClick(currentBanner.link_url)}
        >
          {currentBanner.image_url ? (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 via-card to-accent/10 flex items-center justify-center">
              <p className="text-foreground font-semibold text-center px-4 text-sm">
                {currentBanner.title}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border/50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center border border-border/50"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary w-3' : 'bg-foreground/30'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PromoBanner;