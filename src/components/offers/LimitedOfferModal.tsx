import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { BoltIcon, UsdtIcon, TonIcon } from '@/components/ui/currency-icons';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';

interface LimitedOffer {
  id: string;
  name: string;
  price_ton: number;
  daily_usdt_yield: number;
  daily_ton_yield: number;
  daily_bolt_yield: number;
  max_purchases: number;
  current_purchases: number;
}

interface LimitedOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimitedOfferModal: React.FC<LimitedOfferModalProps> = ({ isOpen, onClose }) => {
  const { user: telegramUser } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  const [offers, setOffers] = useState<LimitedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userClaims, setUserClaims] = useState<string[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<LimitedOffer | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOffers();
    }
  }, [isOpen, user?.id]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      
      // Fetch offers
      const { data: offersData, error: offersError } = await supabase
        .from('limited_server_offers')
        .select('*')
        .eq('is_active', true)
        .order('price_ton', { ascending: true });

      if (offersError) throw offersError;
      setOffers(offersData || []);

      // Fetch user claims
      if (user?.id) {
        const { data: claimsData } = await supabase
          .from('limited_server_offer_claims')
          .select('offer_id')
          .eq('user_id', user.id);
        
        setUserClaims(claimsData?.map(c => c.offer_id) || []);
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (offer: LimitedOffer) => {
    if (!user?.id) {
      toast.error('Please wait for data to load');
      return;
    }
    setSelectedOffer(offer);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedOffer || !user?.id) return;

    try {
      // Record the claim
      await supabase.from('limited_server_offer_claims').insert({
        user_id: user.id,
        offer_id: selectedOffer.id,
      });

      // Increment purchase count
      await supabase
        .from('limited_server_offers')
        .update({ current_purchases: selectedOffer.current_purchases + 1 })
        .eq('id', selectedOffer.id);

      // Add server to user
      await supabase.from('user_servers').insert({
        user_id: user.id,
        server_id: `limited-${selectedOffer.id}`,
        server_name: selectedOffer.name,
        tier: 'Limited',
        hash_rate: 'Special',
        daily_bolt_yield: selectedOffer.daily_bolt_yield,
        daily_usdt_yield: selectedOffer.daily_usdt_yield,
        daily_ton_yield: selectedOffer.daily_ton_yield,
        is_active: true,
      });

      toast.success('Server purchased successfully!');
      fetchOffers();
    } catch (error) {
      console.error('Error recording purchase:', error);
    }
    
    setSelectedOffer(null);
  };

  const getRemainingSlots = (offer: LimitedOffer) => {
    return Math.max(0, offer.max_purchases - offer.current_purchases);
  };

  const hasUserClaimed = (offerId: string) => userClaims.includes(offerId);
  const isSoldOut = (offer: LimitedOffer) => getRemainingSlots(offer) === 0;

  // Only show first 3 offers
  const displayOffers = offers.slice(0, 3);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md p-0 gap-0 bg-background border-border overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">Limited Offer</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Only 20 slots per server</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : displayOffers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No offers available</p>
            ) : (
              <div className="grid gap-3">
                {displayOffers.map((offer, index) => {
                  const remaining = getRemainingSlots(offer);
                  const claimed = hasUserClaimed(offer.id);
                  const soldOut = isSoldOut(offer);
                  const disabled = claimed || soldOut;

                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border transition-all ${
                        claimed
                          ? 'bg-primary/5 border-primary/30'
                          : soldOut
                          ? 'bg-muted/30 border-border opacity-60'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-foreground">{offer.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {remaining} of {offer.max_purchases} remaining
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10">
                          <TonIcon size={18} />
                          <span className="font-bold text-sky-500">{offer.price_ton}</span>
                        </div>
                      </div>

                      {/* Daily Yields */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="p-2.5 rounded-lg bg-background text-center">
                          <BoltIcon size={20} className="mx-auto mb-1" />
                          <p className="text-sm font-bold text-yellow-500">+{offer.daily_bolt_yield}</p>
                          <p className="text-[10px] text-muted-foreground">day</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-background text-center">
                          <UsdtIcon size={20} className="mx-auto mb-1" />
                          <p className="text-sm font-bold text-emerald-500">${offer.daily_usdt_yield.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">day</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-background text-center">
                          <TonIcon size={20} className="mx-auto mb-1" />
                          <p className="text-sm font-bold text-sky-500">+{offer.daily_ton_yield}</p>
                          <p className="text-[10px] text-muted-foreground">day</p>
                        </div>
                      </div>

                      {/* Button */}
                      <Button
                        onClick={() => handleBuyClick(offer)}
                        disabled={disabled}
                        className="w-full h-11 font-semibold rounded-xl"
                        variant={claimed ? 'outline' : 'default'}
                      >
                        {claimed ? 'Purchased' : soldOut ? 'Sold Out' : 'Buy Now'}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      {selectedOffer && (
        <UnifiedPaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setSelectedOffer(null);
          }}
          amount={selectedOffer.price_ton}
          description={selectedOffer.name}
          productType="server_hosting"
          productId={selectedOffer.id}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default LimitedOfferModal;
