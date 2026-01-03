import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Star, Gem, Zap, Gift, Shield, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface VIPStatusCardProps {
  userId: string;
  totalSpent?: number;
}

const VIP_TIERS = [
  { 
    tier: 'bronze', 
    name: 'Bronze VIP', 
    minSpent: 0, 
    icon: Star, 
    color: 'from-orange-500/30 to-amber-500/30',
    textColor: 'text-orange-400',
    benefits: ['+5% Mining Bonus', 'Daily Lucky Spin'],
    price: 0.5
  },
  { 
    tier: 'silver', 
    name: 'Silver VIP', 
    minSpent: 5, 
    icon: Crown, 
    color: 'from-gray-400/30 to-gray-300/30',
    textColor: 'text-gray-300',
    benefits: ['+10% Mining Bonus', '2x Daily Spins', 'Flash Sale Early Access'],
    price: 2
  },
  { 
    tier: 'gold', 
    name: 'Gold VIP', 
    minSpent: 20, 
    icon: Crown, 
    color: 'from-yellow-500/30 to-amber-400/30',
    textColor: 'text-yellow-400',
    benefits: ['+20% Mining Bonus', '3x Daily Spins', 'Exclusive Offers', 'Priority Support'],
    price: 5
  },
  { 
    tier: 'diamond', 
    name: 'Diamond VIP', 
    minSpent: 50, 
    icon: Gem, 
    color: 'from-cyan-400/30 to-blue-400/30',
    textColor: 'text-cyan-400',
    benefits: ['+30% Mining Bonus', 'Unlimited Spins', 'All Features', 'VIP Chat', 'Personal Manager'],
    price: 15
  }
];

export const VIPStatusCard = ({ userId, totalSpent = 0 }: VIPStatusCardProps) => {
  const [vipData, setVipData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    loadVIPStatus();
  }, [userId]);

  const loadVIPStatus = async () => {
    try {
      const { data } = await supabase
        .from('bolt_vip_tiers' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setVipData(data);
      }
    } catch (error) {
      console.error('Error loading VIP status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTier = () => {
    if (!vipData) return VIP_TIERS[0];
    return VIP_TIERS.find(t => t.tier === vipData.tier) || VIP_TIERS[0];
  };

  const getNextTier = () => {
    const currentIndex = VIP_TIERS.findIndex(t => t.tier === (vipData?.tier || 'bronze'));
    return VIP_TIERS[currentIndex + 1];
  };

  const purchaseVIP = async (tier: typeof VIP_TIERS[0]) => {
    setIsPurchasing(true);
    try {
      // Create payment record FIRST with pending status
      const { data: paymentData, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: userId,
          amount_ton: tier.price,
          description: `VIP Upgrade: ${tier.name}`,
          product_type: 'subscription',
          product_id: tier.tier,
          destination_address: TON_PAYMENT_ADDRESS,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) {
        toast.error('Failed to create payment record');
        return;
      }

      const transaction = {
        validUntil: getValidUntil(),
        messages: [{
          address: TON_PAYMENT_ADDRESS,
          amount: tonToNano(tier.price)
        }]
      };

      const result = await tonConnectUI.sendTransaction(transaction);

      if (result?.boc) {
        // Save tx_hash but keep as PENDING
        await supabase
          .from('ton_payments')
          .update({ 
            tx_hash: result.boc,
            status: 'pending'
          })
          .eq('id', paymentData.id);

        toast.info('Verifying transaction on blockchain...');

        // Wait for blockchain confirmation
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Call verify-ton-payment to confirm
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-ton-payment', {
          body: {
            paymentId: paymentData.id,
            txHash: result.boc,
          },
          headers: {
            'x-telegram-id': userId,
          }
        });

        if (verifyError || verifyData?.status !== 'confirmed') {
          toast.warning('Payment pending verification. VIP will be activated once confirmed.');
          return;
        }

        // Only update AFTER blockchain confirmation
        await supabase
          .from('ton_payments')
          .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
          .eq('id', paymentData.id);

        // Now activate VIP
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await supabase
          .from('bolt_vip_tiers' as any)
          .upsert({
            user_id: userId,
            tier: tier.tier,
            benefits: tier.benefits,
            total_spent: (vipData?.total_spent || 0) + tier.price,
            expires_at: expiresAt.toISOString()
          });

        await supabase.from('bolt_upgrade_purchases' as any).insert({
          user_id: userId,
          upgrade_type: `vip_${tier.tier}`,
          amount_paid: tier.price
        });

        await supabase.from('bolt_social_notifications' as any).insert({
          user_id: userId,
          username: 'Someone',
          action_type: 'vip_purchase',
          amount: tier.price,
          product_name: tier.name
        });

        toast.success(`👑 Welcome to ${tier.name}! Enjoy your exclusive benefits!`);
        loadVIPStatus();
      }
    } catch (error) {
      console.error('Error purchasing VIP:', error);
      toast.error('Transaction failed or cancelled');
    } finally {
      setIsPurchasing(false);
    }
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const CurrentIcon = currentTier.icon;

  // Check if VIP is active
  const isVIPActive = vipData?.expires_at && new Date(vipData.expires_at) > new Date();
  const daysRemaining = isVIPActive 
    ? Math.ceil((new Date(vipData.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30 animate-pulse">
        <div className="h-32" />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`p-4 bg-gradient-to-br ${currentTier.color} border-purple-500/30 relative overflow-hidden`}>
        {/* Sparkle effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                delay: i * 0.4
              }}
              className="absolute"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + Math.random() * 40}%`
              }}
            >
              <Sparkles className="w-3 h-3 text-yellow-400/50" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10">
          {/* Current status */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`p-3 rounded-full bg-gradient-to-br ${currentTier.color}`}
              >
                <CurrentIcon className={`w-8 h-8 ${currentTier.textColor}`} />
              </motion.div>
              <div>
                <h3 className={`font-bold text-xl ${currentTier.textColor}`}>
                  {isVIPActive ? currentTier.name : 'No VIP Status'}
                </h3>
                {isVIPActive && (
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining} days remaining
                  </p>
                )}
              </div>
            </div>
            {isVIPActive && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Shield className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {/* Current benefits */}
          {isVIPActive && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Your Benefits:</h4>
              <div className="flex flex-wrap gap-2">
                {currentTier.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                    <Gift className="w-3 h-3 mr-1" />
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade options */}
          {nextTier && (
            <div className="mb-4 p-3 bg-black/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <nextTier.icon className={`w-5 h-5 ${nextTier.textColor}`} />
                  <span className={`font-bold ${nextTier.textColor}`}>{nextTier.name}</span>
                </div>
                <span className="font-bold">{nextTier.price} TON</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {nextTier.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                    {benefit}
                  </Badge>
                ))}
              </div>
              <Button 
                onClick={() => purchaseVIP(nextTier)}
                disabled={isPurchasing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isPurchasing ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to {nextTier.name}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* All tiers preview */}
          <div className="flex justify-center gap-2">
            {VIP_TIERS.map(tier => {
              const TierIcon = tier.icon;
              const isCurrentOrLower = VIP_TIERS.findIndex(t => t.tier === tier.tier) <= 
                VIP_TIERS.findIndex(t => t.tier === (vipData?.tier || 'none'));
              return (
                <motion.div
                  key={tier.tier}
                  whileHover={{ scale: 1.2 }}
                  className={`p-2 rounded-full ${
                    isCurrentOrLower && isVIPActive ? tier.textColor : 'text-gray-600'
                  } ${
                    tier.tier === vipData?.tier ? 'ring-2 ring-white/50' : ''
                  }`}
                >
                  <TierIcon className="w-5 h-5" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
