import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <div className="w-full h-[120px] rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse" />
    );
  }

  if (banners.length === 0) {
    return (
      <div className="w-full h-[120px] rounded-xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Special offers coming soon</p>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[120px] rounded-xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
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
            <div className="w-full h-full bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 flex items-center justify-center">
              <p className="text-foreground font-semibold text-center px-4">
                {currentBanner.title}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {banners.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-primary/30'
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