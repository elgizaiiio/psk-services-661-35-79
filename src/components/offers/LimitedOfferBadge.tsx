import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/integrations/supabase/client';
import LimitedOfferModal from './LimitedOfferModal';

interface LimitedOfferBadgeProps {
  variant?: 'floating' | 'inline';
  className?: string;
}

export const LimitedOfferBadge: React.FC<LimitedOfferBadgeProps> = ({ 
  variant = 'inline',
  className = '' 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [hasOffers, setHasOffers] = useState(false);

  useEffect(() => {
    const fetchOfferStats = async () => {
      try {
        const { data } = await supabase
          .from('limited_server_offers')
          .select('max_purchases, current_purchases')
          .eq('is_active', true);

        if (data && data.length > 0) {
          const remaining = data.reduce((sum, offer) => 
            sum + Math.max(0, offer.max_purchases - offer.current_purchases), 0
          );
          setTotalRemaining(remaining);
          setHasOffers(remaining > 0);
        }
      } catch (error) {
        console.error('Error fetching offer stats:', error);
      }
    };

    fetchOfferStats();
  }, []);

  if (!hasOffers) return null;

  if (variant === 'floating') {
    return (
      <>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className={`fixed right-4 top-20 z-40 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-lg ${className}`}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
            </span>
            {totalRemaining} left
          </span>
        </motion.button>
        
        <LimitedOfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className={`w-full p-3 rounded-xl bg-gradient-to-r from-primary/15 to-primary/5 border border-primary/30 flex items-center justify-between ${className}`}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="font-medium text-foreground text-sm">Limited Offer</span>
        </div>
        <span className="text-xs text-primary font-semibold">{totalRemaining} slots left</span>
      </motion.button>
      
      <LimitedOfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default LimitedOfferBadge;
