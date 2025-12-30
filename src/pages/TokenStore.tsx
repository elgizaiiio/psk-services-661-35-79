import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Coins, 
  Zap, 
  Gift, 
  Sparkles,
  TrendingUp,
  Star,
  Flame,
  Crown,
  Percent
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTelegramTonConnect } from '@/hooks/useTelegramTonConnect';
import { useDirectTonPayment } from '@/hooks/useDirectTonPayment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  bonusTokens: number;
  price: number;
  popular?: boolean;
  bestValue?: boolean;
  discount?: number;
  icon: React.ReactNode;
  gradient: string;
}

const tokenPackages: TokenPackage[] = [
  {
    id: 'starter',
    name: 'Starter',
    tokens: 500,
    bonusTokens: 0,
    price: 0.8,
    icon: <Coins className="w-6 h-6" />,
    gradient: 'from-blue-400 to-cyan-500'
  },
  {
    id: 'basic',
    name: 'Basic',
    tokens: 1200,
    bonusTokens: 100,
    price: 1.5,
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-green-400 to-emerald-500'
  },
  {
    id: 'popular',
    name: 'Popular',
    tokens: 3000,
    bonusTokens: 500,
    price: 3.5,
    popular: true,
    discount: 15,
    icon: <Star className="w-6 h-6" />,
    gradient: 'from-yellow-400 to-orange-500'
  },
  {
    id: 'premium',
    name: 'Premium',
    tokens: 8000,
    bonusTokens: 2000,
    price: 8,
    discount: 20,
    icon: <Flame className="w-6 h-6" />,
    gradient: 'from-orange-400 to-red-500'
  },
  {
    id: 'elite',
    name: 'Elite',
    tokens: 20000,
    bonusTokens: 6000,
    price: 15,
    bestValue: true,
    discount: 30,
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-purple-400 to-pink-500'
  },
  {
    id: 'whale',
    name: 'Whale',
    tokens: 50000,
    bonusTokens: 20000,
    price: 30,
    discount: 40,
    icon: <Sparkles className="w-6 h-6" />,
    gradient: 'from-indigo-400 to-purple-600'
  }
];

const TokenStore = () => {
  const navigate = useNavigate();
  const { user: telegramUser } = useTelegramAuth();
  const { isConnected, connectWallet } = useTelegramTonConnect();
  const { sendDirectPayment, isProcessing } = useDirectTonPayment();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  // Development mode: use mock user ID
  const isDev = !telegramUser;
  const mockTelegramId = 123456789;

  const handlePurchase = async (pkg: TokenPackage) => {
    const telegramId = telegramUser?.id || mockTelegramId;

    if (!isConnected) {
      await connectWallet();
      return;
    }

    setPurchasing(pkg.id);

    try {
      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('bolt_users')
        .select('id, token_balance')
        .eq('telegram_id', telegramId)
        .maybeSingle();

      if (userError || !userData) {
        toast.error('User not found. Please open the app in Telegram.');
        setPurchasing(null);
        return;
      }

      const totalTokens = pkg.tokens + pkg.bonusTokens;

      // Send TON transaction
      const success = await sendDirectPayment({
        amount: pkg.price,
        description: `Purchase ${totalTokens.toLocaleString()} VIRAL Tokens`,
        productType: 'ai_credits',
        productId: pkg.id,
        credits: totalTokens
      });

      if (success) {
        // Update user balance
        await supabase
          .from('bolt_users')
          .update({ 
            token_balance: (userData.token_balance || 0) + totalTokens 
          })
          .eq('id', userData.id);

        // Create social notification
        await supabase
          .from('bolt_social_notifications')
          .insert({
            user_id: userData.id,
            action_type: 'token_purchase',
            amount: totalTokens,
            username: telegramUser?.first_name || 'User',
            product_name: pkg.name
          });

        toast.success(`🎉 Added ${totalTokens.toLocaleString()} VIRAL to your balance!`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('An error occurred during purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const calculateTokensPerTon = (pkg: TokenPackage) => {
    return Math.round((pkg.tokens + pkg.bonusTokens) / pkg.price);
  };

  return (
    <main className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Token Store | VIRAL</title>
        <meta name="description" content="Buy VIRAL Tokens with TON" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-16">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Token Store</h1>
          <p className="text-sm text-muted-foreground">Buy VIRAL with TON</p>
        </div>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden mb-6 p-6 bg-gradient-to-br from-primary/30 via-primary/10 to-background border border-primary/30"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex items-center gap-4">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
            >
              <Coins className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Exclusive Offers!</h2>
              <p className="text-sm text-muted-foreground">Up to 40% off on larger packages</p>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Instant Activation</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Gift className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Bonus Tokens</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Best Value</p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tokenPackages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <Card className={`relative overflow-hidden p-4 border-2 ${
                pkg.popular ? 'border-primary' : pkg.bestValue ? 'border-yellow-500' : 'border-border'
              }`}>
                {/* Badges */}
                {pkg.popular && (
                  <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] px-2">
                    Most Popular
                  </Badge>
                )}
                {pkg.bestValue && (
                  <Badge className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] px-2">
                    Best Value
                  </Badge>
                )}

                {/* Discount Badge */}
                {pkg.discount && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                      <Percent className="w-2.5 h-2.5 mr-0.5" />
                      {pkg.discount}%
                    </Badge>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pkg.gradient} flex items-center justify-center text-white mb-3 mx-auto`}>
                  {pkg.icon}
                </div>

                {/* Package Name */}
                <h3 className="font-bold text-foreground text-center text-sm mb-1">{pkg.name}</h3>

                {/* Tokens */}
                <div className="text-center mb-2">
                  <p className="text-lg font-bold text-primary">
                    {pkg.tokens.toLocaleString()}
                  </p>
                  {pkg.bonusTokens > 0 && (
                    <p className="text-xs text-green-500 font-medium">
                      +{pkg.bonusTokens.toLocaleString()} bonus
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-3">
                  <span className="text-xl font-bold text-foreground">{pkg.price}</span>
                  <span className="text-xs text-muted-foreground ml-1">TON</span>
                </div>

                {/* Tokens per TON */}
                <p className="text-[10px] text-muted-foreground text-center mb-3">
                  {calculateTokensPerTon(pkg).toLocaleString()} VIRAL/TON
                </p>

                {/* Buy Button */}
                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing === pkg.id || isProcessing}
                  size="sm"
                  className={`w-full ${
                    pkg.popular || pkg.bestValue
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {purchasing === pkg.id ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : !isConnected ? (
                    'Connect Wallet'
                  ) : (
                    'Buy'
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-6 p-4 bg-muted/30 rounded-xl">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Why buy VIRAL?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use them to buy characters and upgrades</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Enter competitions and challenges</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Trade in the marketplace with other players</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Get exclusive VIP benefits</span>
            </li>
          </ul>
        </div>

        {/* Security Note */}
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p className="text-xs text-green-600 dark:text-green-400 text-center">
            🔒 All transactions are secure via TON network
          </p>
        </div>
      </div>
    </main>
  );
};

export default TokenStore;
