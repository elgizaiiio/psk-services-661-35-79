import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { toast } from 'sonner';
import { Loader2, X, Zap, Ticket } from 'lucide-react';
import { motion } from 'motion/react';
import { UnifiedPaymentModal } from '@/components/payment/UnifiedPaymentModal';
import { BoltIcon } from '@/components/ui/currency-icons';

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

// Bundle content details (removed viral)
const bundleContents: Record<number, { bolt: number; tickets: number }> = {
  1.5: { bolt: 5000, tickets: 10 },
  3: { bolt: 15000, tickets: 30 },
  5: { bolt: 50000, tickets: 100 },
  10: { bolt: 150000, tickets: 500 },
};

export const LimitedOfferModal: React.FC<LimitedOfferModalProps> = ({ isOpen, onClose }) => {
  const { user: telegramUser } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  const [offers, setOffers] = useState<LimitedOffer[]>([]);
  const [loading, setLoading] = useState(true);
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
      
      const { data: offersData, error: offersError } = await supabase
        .from('limited_server_offers')
        .select('*')
        .eq('is_active', true)
        .order('price_ton', { ascending: true });

      if (offersError) throw offersError;
      setOffers(offersData || []);
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
      const content = bundleContents[selectedOffer.price_ton] || bundleContents[1.5];
      
      // Update user balances (removed viral)
      const { data: userData } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (userData) {
        await supabase
          .from('bolt_users')
          .update({
            token_balance: (userData.token_balance || 0) + content.bolt,
          })
          .eq('id', user.id);
      }

      await supabase
        .from('limited_server_offers')
        .update({ current_purchases: selectedOffer.current_purchases + 1 })
        .eq('id', selectedOffer.id);

      await supabase.from('user_servers').insert({
        user_id: user.id,
        server_id: `bundle-${selectedOffer.id}`,
        server_name: selectedOffer.name,
        tier: 'Bundle',
        hash_rate: 'Premium',
        daily_bolt_yield: selectedOffer.daily_bolt_yield,
        daily_usdt_yield: selectedOffer.daily_usdt_yield,
        daily_ton_yield: selectedOffer.daily_ton_yield,
        is_active: true,
      });

      toast.success('Bundle purchased successfully!');
      fetchOffers();
    } catch (error) {
      console.error('Error recording purchase:', error);
    }
    
    setSelectedOffer(null);
  };

  const getRemainingSlots = (offer: LimitedOffer) => {
    return Math.max(0, offer.max_purchases - offer.current_purchases);
  };

  const isSoldOut = (offer: LimitedOffer) => getRemainingSlots(offer) === 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[95vw] w-full max-h-[55vh] p-0 gap-0 bg-background border-border overflow-hidden rounded-2xl">
          <DialogHeader className="p-3 pb-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Starter Bundles</DialogTitle>
                <p className="text-[10px] text-primary mt-0.5">
                  Special offer - 50% OFF
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="w-7 h-7 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-3 overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : offers.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No offers available</p>
            ) : (
              <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                {offers.map((offer, index) => {
                  const remaining = getRemainingSlots(offer);
                  const soldOut = isSoldOut(offer);
                  const content = bundleContents[offer.price_ton] || bundleContents[1.5];

                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex-shrink-0 w-[140px] p-3 rounded-xl border transition-all ${
                        soldOut
                          ? 'bg-muted/30 border-border opacity-60'
                          : 'bg-card border-border hover:border-primary/50'
                      }`}
                    >
                      {/* 50% OFF Badge */}
                      <div className="bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block">
                        50% OFF
                      </div>

                      {/* Name */}
                      <h3 className="font-semibold text-foreground text-xs mb-1">{offer.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(remaining / offer.max_purchases) * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">{remaining} left</span>
                      </div>

                      {/* Contents (removed viral) */}
                      <div className="space-y-1 mb-2 text-[10px]">
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-sky-500" />
                          <span className="text-muted-foreground">Server included</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BoltIcon size={12} />
                          <span className="text-yellow-500">{content.bolt.toLocaleString()} BOLT</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Ticket className="w-3 h-3 text-purple-500" />
                          <span className="text-purple-500">{content.tickets} Tickets</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-2 py-1.5 px-2 rounded bg-sky-500/10 text-center">
                        <span className="font-bold text-sky-500 text-sm">{offer.price_ton} TON</span>
                      </div>

                      {/* Button */}
                      <Button
                        onClick={() => handleBuyClick(offer)}
                        disabled={soldOut}
                        className="w-full h-7 text-[10px] font-semibold rounded-lg"
                        size="sm"
                      >
                        {soldOut ? 'Sold Out' : 'Buy Bundle'}
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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