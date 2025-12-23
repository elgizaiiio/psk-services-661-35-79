import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashOffer {
  id: string;
  title: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percent: number;
  product_type: string;
  ends_at: string;
  max_claims: number;
  current_claims: number;
}

interface FlashOfferBannerProps {
  userId: string;
  onPurchase?: () => void;
}

export const FlashOfferBanner = ({ userId, onPurchase }: FlashOfferBannerProps) => {
  const [offers, setOffers] = useState<FlashOffer[]>([]);
  const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    loadOffers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (offers.length > 1) {
      const rotateInterval = setInterval(() => {
        setCurrentOfferIndex(prev => (prev + 1) % offers.length);
      }, 8000);
      return () => clearInterval(rotateInterval);
    }
  }, [offers.length]);

  const loadOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('bolt_flash_offers' as any)
        .select('*')
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('discount_percent', { ascending: false });

      if (data) {
        setOffers(data as unknown as FlashOffer[]);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTimers = () => {
    const newTimers: Record<string, string> = {};
    offers.forEach(offer => {
      const endTime = new Date(offer.ends_at).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        newTimers[offer.id] = 'EXPIRED';
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        newTimers[offer.id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    });
    setTimeRemaining(newTimers);
  };

  const purchaseOffer = async (offer: FlashOffer) => {
    setIsPurchasing(true);
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: 'UQBpGY0_bC3E8sVl91BXJvUUl56lPNOUW5V0hJJaJJCUhAqT',
          amount: (offer.discounted_price * 1e9).toString()
        }]
      };

      await tonConnectUI.sendTransaction(transaction);

      // Update offer claims
      await supabase
        .from('bolt_flash_offers' as any)
        .update({ current_claims: offer.current_claims + 1 })
        .eq('id', offer.id);

      // Record purchase
      await supabase.from('bolt_upgrade_purchases' as any).insert({
        user_id: userId,
        upgrade_type: offer.product_type,
        amount_paid: offer.discounted_price
      });

      // Add social notification
      await supabase.from('bolt_social_notifications' as any).insert({
        user_id: userId,
        username: 'Someone',
        action_type: 'flash_purchase',
        amount: offer.discounted_price,
        product_name: offer.title
      });

      toast.success(`🎉 ${offer.title} purchased! You saved ${offer.discount_percent}%!`);
      onPurchase?.();
      loadOffers();
    } catch (error) {
      console.error('Error purchasing offer:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading || offers.length === 0) return null;

  const currentOffer = offers[currentOfferIndex];
  const spotsLeft = currentOffer.max_claims - currentOffer.current_claims;
  const urgencyLevel = spotsLeft <= 5 ? 'critical' : spotsLeft <= 15 ? 'high' : 'normal';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentOffer.id}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-red-600/30 border-purple-500/50 relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-red-600/10 animate-pulse" />
          
          {/* Flash badge */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-500 text-white animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              FLASH SALE
            </Badge>
          </div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{currentOffer.title}</h3>
                <p className="text-sm text-muted-foreground">{currentOffer.description}</p>
              </div>
            </div>

            {/* Timer and scarcity */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4 text-red-400" />
                <span className="font-mono font-bold text-red-400">
                  {timeRemaining[currentOffer.id] || '...'}
                </span>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                urgencyLevel === 'critical' ? 'bg-red-500/30 text-red-300' :
                urgencyLevel === 'high' ? 'bg-orange-500/30 text-orange-300' :
                'bg-green-500/30 text-green-300'
              }`}>
                <Users className="w-4 h-4" />
                <span className="font-bold">{spotsLeft} left</span>
              </div>
            </div>

            {/* Price comparison */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground line-through text-lg">
                  {currentOffer.original_price} TON
                </span>
                <span className="text-2xl font-bold text-green-400">
                  {currentOffer.discounted_price} TON
                </span>
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  -{currentOffer.discount_percent}%
                </Badge>
              </div>
              
              <Button 
                onClick={() => purchaseOffer(currentOffer)}
                disabled={isPurchasing || spotsLeft <= 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isPurchasing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Grab Deal
                  </>
                )}
              </Button>
            </div>

            {/* Offer indicators */}
            {offers.length > 1 && (
              <div className="flex justify-center gap-1 mt-3">
                {offers.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentOfferIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentOfferIndex ? 'bg-white' : 'bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
