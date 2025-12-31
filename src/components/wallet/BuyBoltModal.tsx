import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  TrendingUp, 
  Zap, 
  Crown, 
  Flame, 
  Star, 
  Gift,
  Clock,
  Users,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { BoltIcon, TonIcon } from '@/components/ui/currency-icons';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface BuyBoltModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

// Dark psychology pricing packages
const BOLT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    bolts: 5000,
    priceTon: 0.5,
    originalPrice: 0.8,
    discount: 37,
    badge: null,
    popular: false,
    description: 'Perfect to get started',
    urgency: null,
    icon: Zap,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'popular',
    name: 'Power Pack',
    bolts: 25000,
    priceTon: 2,
    originalPrice: 4,
    discount: 50,
    badge: '🔥 MOST POPULAR',
    popular: true,
    description: '5x more value!',
    urgency: '847 bought today',
    icon: Flame,
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/50',
  },
  {
    id: 'whale',
    name: 'Whale Pack',
    bolts: 100000,
    priceTon: 6,
    originalPrice: 16,
    discount: 62,
    badge: '👑 BEST VALUE',
    popular: false,
    description: 'Maximum savings!',
    urgency: 'Only 23 left at this price',
    icon: Crown,
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/50',
  },
];

// Simulated live price chart data
const generateChartData = () => {
  const data = [];
  let price = 0.00012;
  for (let i = 0; i < 24; i++) {
    price += (Math.random() - 0.45) * 0.00001;
    price = Math.max(0.0001, price);
    data.push({ hour: i, price });
  }
  return data;
};

const BuyBoltModal: React.FC<BuyBoltModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess,
}) => {
  const [tonConnectUI] = useTonConnectUI();
  const { user: tgUser } = useTelegramAuth();
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [chartData] = useState(generateChartData);
  const [liveViewers, setLiveViewers] = useState(Math.floor(Math.random() * 200) + 150);
  const [recentBuyers] = useState([
    { name: 'Alex***', amount: 25000, time: '2 min ago' },
    { name: 'Moh***', amount: 100000, time: '5 min ago' },
    { name: 'Sam***', amount: 5000, time: '8 min ago' },
  ]);

  // Simulate live viewers
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setLiveViewers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 3000);
    return () => clearInterval(interval);
  }, [open]);

  // Current price display
  const currentPrice = chartData[chartData.length - 1]?.price || 0.00012;
  const priceChange = ((currentPrice - chartData[0]?.price) / chartData[0]?.price * 100) || 0;

  const handleBuyPackage = async (pkg: typeof BOLT_PACKAGES[0]) => {
    if (!tonConnectUI.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    setSelectedPackage(pkg.id);

    try {
      const amountNano = tonToNano(pkg.priceTon);

      // Record payment
      const { data: payment, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: userId,
          amount_ton: pkg.priceTon,
          destination_address: TON_PAYMENT_ADDRESS,
          product_type: 'token_purchase',
          product_id: pkg.id,
          description: `Purchase ${pkg.bolts.toLocaleString()} BOLT`,
          status: 'pending',
          metadata: { bolts: pkg.bolts },
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Send transaction
      await tonConnectUI.sendTransaction({
        validUntil: getValidUntil(),
        messages: [{
          address: TON_PAYMENT_ADDRESS,
          amount: amountNano,
        }],
      });

      // Update payment status
      await supabase
        .from('ton_payments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', payment.id);

      // Get current balance and update
      const { data: currentUser } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', userId)
        .single();

      const newBalance = (currentUser?.token_balance || 0) + pkg.bolts;
      await supabase
        .from('bolt_users')
        .update({ token_balance: newBalance })
        .eq('id', userId);

      // Notify admin about the payment
      try {
        await supabase.functions.invoke('notify-admin-payment', {
          body: {
            userId: userId,
            username: tgUser?.username || tgUser?.first_name || 'Unknown',
            telegramId: tgUser?.id,
            paymentMethod: 'ton',
            amount: pkg.priceTon,
            currency: 'TON',
            productType: 'token_purchase',
            productName: pkg.name,
            description: `${pkg.bolts.toLocaleString()} BOLT tokens`,
          }
        });
      } catch (e) {
        console.error('Failed to notify admin', e);
      }

      toast.success(`🎉 Successfully purchased ${pkg.bolts.toLocaleString()} BOLT!`);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error?.message?.includes('cancel')) {
        toast.info('Transaction cancelled');
      } else {
        toast.error('Failed to complete purchase');
      }
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  const customTonAmount = parseFloat(customAmount) || 0;
  const customBolts = Math.floor(customTonAmount * 10000); // 1 TON = 10,000 BOLT

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <BoltIcon size={32} />
            <span>Buy BOLT Tokens</span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Live Price Chart */}
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground">BOLT/USD Price</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">
                    ${currentPrice.toFixed(5)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${priceChange >= 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>{liveViewers} viewing</span>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="h-16 flex items-end gap-0.5">
              {chartData.map((point, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-primary/60 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${(point.price / 0.00015) * 100}%` }}
                  transition={{ delay: i * 0.02 }}
                />
              ))}
            </div>
          </motion.div>

          {/* Social Proof - Recent Purchases */}
          <motion.div 
            className="p-3 rounded-lg bg-muted/50 space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>Recent purchases</span>
            </div>
            {recentBuyers.map((buyer, i) => (
              <motion.div
                key={i}
                className="flex items-center justify-between text-xs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="text-foreground">{buyer.name} bought <span className="text-primary font-semibold">{buyer.amount.toLocaleString()} BOLT</span></span>
                <span className="text-muted-foreground">{buyer.time}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Packages */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Special Packages
            </p>

            {BOLT_PACKAGES.map((pkg, i) => {
              const Icon = pkg.icon;
              return (
                <motion.div
                  key={pkg.id}
                  className={`relative p-4 rounded-xl bg-gradient-to-r ${pkg.gradient} border-2 ${pkg.borderColor} cursor-pointer transition-all hover:scale-[1.02]`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * i }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => !isProcessing && handleBuyPackage(pkg)}
                >
                  {/* Badge */}
                  {pkg.badge && (
                    <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                      {pkg.badge}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-background/50 flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{pkg.name}</p>
                        <div className="flex items-center gap-2">
                          <BoltIcon size={16} />
                          <span className="text-lg font-bold text-primary">{pkg.bolts.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{pkg.description}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <TonIcon size={20} />
                        <span className="text-xl font-bold text-foreground">{pkg.priceTon}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-through">{pkg.originalPrice} TON</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-semibold">
                        -{pkg.discount}%
                      </span>
                    </div>
                  </div>

                  {/* Urgency */}
                  {pkg.urgency && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-yellow-500">
                      <Clock className="w-3 h-3" />
                      {pkg.urgency}
                    </div>
                  )}

                  {/* Loading state */}
                  {isProcessing && selectedPackage === pkg.id && (
                    <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Custom Amount */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Custom Amount
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <TonIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="number"
                  placeholder="Enter TON amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-10"
                  min="0.1"
                  step="0.1"
                />
              </div>
              <Button
                onClick={() => customTonAmount > 0 && handleBuyPackage({
                  id: 'custom',
                  name: 'Custom',
                  bolts: customBolts,
                  priceTon: customTonAmount,
                  originalPrice: customTonAmount,
                  discount: 0,
                  badge: null,
                  popular: false,
                  description: 'Custom amount',
                  urgency: null,
                  icon: Zap,
                  gradient: '',
                  borderColor: '',
                })}
                disabled={customTonAmount <= 0 || isProcessing}
                className="px-6"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            {customTonAmount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                You will receive: <span className="text-primary font-semibold">{customBolts.toLocaleString()} BOLT</span>
              </p>
            )}
          </div>

          {/* Pre-market Notice */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-500">🚀 Pre-Market Phase</p>
                <p className="text-xs text-muted-foreground mt-1">
                  BOLT is currently in pre-market. Early buyers get the best rates before public listing!
                </p>
              </div>
            </div>
          </div>

          {/* FOMO Footer */}
          <motion.div 
            className="text-center py-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <p className="text-xs text-muted-foreground">
              ⚡ Limited time pricing • Price increases after pre-market
            </p>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyBoltModal;
