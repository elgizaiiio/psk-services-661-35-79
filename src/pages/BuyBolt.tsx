import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowDownUp, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoltIcon, TonIcon } from '@/components/ui/currency-icons';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';

// Exchange rate: 1 TON = 10,000 BOLT
const BOLT_PER_TON = 10000;

// Price chart data simulation
const generateChartData = () => {
  const data: number[] = [];
  let price = 0.00012;
  for (let i = 0; i < 48; i++) {
    price += (Math.random() - 0.45) * 0.000008;
    price = Math.max(0.00008, Math.min(0.00018, price));
    data.push(price);
  }
  return data;
};

interface Package {
  id: string;
  name: string;
  bolts: number;
  priceTon: number;
  priceStars: number;
  bonus: number;
}

const packages: Package[] = [
  { id: 'starter', name: 'Starter', bolts: 5000, priceTon: 0.5, priceStars: 50, bonus: 0 },
  { id: 'basic', name: 'Basic', bolts: 15000, priceTon: 1.2, priceStars: 120, bonus: 10 },
  { id: 'popular', name: 'Popular', bolts: 50000, priceTon: 3.5, priceStars: 350, bonus: 20 },
  { id: 'premium', name: 'Premium', bolts: 150000, priceTon: 9, priceStars: 900, bonus: 30 },
  { id: 'whale', name: 'Whale', bolts: 500000, priceTon: 25, priceStars: 2500, bonus: 40 },
];

const BuyBolt = () => {
  const { user: telegramUser } = useTelegramAuth();
  const { user } = useViralMining(telegramUser);
  const [tonConnectUI] = useTonConnectUI();
  useTelegramBackButton();

  const [tonAmount, setTonAmount] = useState('');
  const [boltAmount, setBoltAmount] = useState('');
  const [isSwapped, setIsSwapped] = useState(false);
  const [chartData] = useState(generateChartData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Calculate conversions
  const tonValue = parseFloat(tonAmount) || 0;
  const boltValue = parseFloat(boltAmount) || 0;
  const calculatedBolt = tonValue * BOLT_PER_TON;
  const calculatedTon = boltValue / BOLT_PER_TON;

  // Update the other input when one changes
  const handleTonChange = (value: string) => {
    setTonAmount(value);
    const ton = parseFloat(value) || 0;
    setBoltAmount(ton > 0 ? (ton * BOLT_PER_TON).toString() : '');
  };

  const handleBoltChange = (value: string) => {
    setBoltAmount(value);
    const bolt = parseFloat(value) || 0;
    setTonAmount(bolt > 0 ? (bolt / BOLT_PER_TON).toFixed(4) : '');
  };

  // Chart price info
  const currentPrice = chartData[chartData.length - 1];
  const previousPrice = chartData[0];
  const priceChange = ((currentPrice - previousPrice) / previousPrice * 100);

  const handleSwap = async () => {
    if (!tonConnectUI.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (tonValue <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    setIsProcessing(true);

    try {
      const destinationAddress = 'UQBPwD0mGFYq6MDBw-TjhHHZCy87n-t0pbCqc8YsqPzDGqpz';
      const amountNano = Math.floor(tonValue * 1e9).toString();
      const boltsToReceive = Math.floor(calculatedBolt);

      // Record payment
      const { data: payment, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: user.id,
          amount_ton: tonValue,
          destination_address: destinationAddress,
          product_type: 'token_purchase',
          description: `Purchase ${boltsToReceive.toLocaleString()} BOLT`,
          status: 'pending',
          metadata: { bolts: boltsToReceive },
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Send transaction
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: destinationAddress,
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
        .eq('id', user.id)
        .single();

      const newBalance = (currentUser?.token_balance || 0) + boltsToReceive;
      await supabase
        .from('bolt_users')
        .update({ token_balance: newBalance })
        .eq('id', user.id);

      toast.success(`Successfully purchased ${boltsToReceive.toLocaleString()} BOLT`);
      setTonAmount('');
      setBoltAmount('');
    } catch (error: any) {
      console.error('Purchase error:', error);
      if (error?.message?.includes('cancel')) {
        toast.info('Transaction cancelled');
      } else {
        toast.error('Failed to complete purchase');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePackagePurchase = async (pkg: Package) => {
    if (!tonConnectUI.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    setSelectedPackage(pkg.id);
    setIsProcessing(true);

    try {
      const destinationAddress = 'UQBPwD0mGFYq6MDBw-TjhHHZCy87n-t0pbCqc8YsqPzDGqpz';
      const amountNano = Math.floor(pkg.priceTon * 1e9).toString();
      const totalBolts = pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100);

      const { data: payment, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: user.id,
          amount_ton: pkg.priceTon,
          destination_address: destinationAddress,
          product_type: 'token_purchase',
          product_id: pkg.id,
          description: `Purchase ${pkg.name} Package`,
          status: 'pending',
          metadata: { bolts: totalBolts, package: pkg.name },
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: destinationAddress,
          amount: amountNano,
        }],
      });

      await supabase
        .from('ton_payments')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', payment.id);

      const { data: currentUser } = await supabase
        .from('bolt_users')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      const newBalance = (currentUser?.token_balance || 0) + totalBolts;
      await supabase
        .from('bolt_users')
        .update({ token_balance: newBalance })
        .eq('id', user.id);

      toast.success(`Successfully purchased ${totalBolts.toLocaleString()} BOLT`);
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

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet>
        <title>Buy BOLT</title>
        <meta name="description" content="Buy BOLT tokens with TON" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-6">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Buy BOLT</h1>
              <p className="text-sm text-muted-foreground mt-1">Swap TON for BOLT tokens</p>
            </div>
          </FadeUp>

          {/* Price Chart */}
          <FadeUp>
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">BOLT/USD</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">
                      ${currentPrice.toFixed(6)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      priceChange >= 0 
                        ? 'bg-emerald-500/20 text-emerald-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">24h Volume</p>
                  <p className="text-sm font-medium text-foreground">$1.2M</p>
                </div>
              </div>

              {/* Chart Bars */}
              <div className="h-20 flex items-end gap-0.5">
                {chartData.map((price, i) => {
                  const height = ((price - 0.00008) / 0.0001) * 100;
                  const isUp = i > 0 && price >= chartData[i - 1];
                  return (
                    <motion.div
                      key={i}
                      className={`flex-1 rounded-t ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(10, height)}%` }}
                      transition={{ delay: i * 0.01, duration: 0.3 }}
                    />
                  );
                })}
              </div>
            </Card>
          </FadeUp>

          {/* Swap Interface */}
          <FadeUp>
            <Card className="p-5 border-border">
              <div className="space-y-4">
                {/* TON Input */}
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">You Pay</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background">
                      <TonIcon size={24} />
                      <span className="font-medium text-foreground">TON</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tonAmount}
                      onChange={(e) => handleTonChange(e.target.value)}
                      className="text-right text-xl font-bold border-0 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-2 relative z-10">
                  <motion.button
                    onClick={() => setIsSwapped(!isSwapped)}
                    className="w-10 h-10 rounded-full bg-primary flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9, rotate: 180 }}
                  >
                    <ArrowDownUp className="w-5 h-5 text-primary-foreground" />
                  </motion.button>
                </div>

                {/* BOLT Output */}
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">You Receive</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background">
                      <BoltIcon size={24} />
                      <span className="font-medium text-foreground">BOLT</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={boltAmount}
                      onChange={(e) => handleBoltChange(e.target.value)}
                      className="text-right text-xl font-bold border-0 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                </div>

                {/* Rate Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>Rate</span>
                  <span>1 TON = {BOLT_PER_TON.toLocaleString()} BOLT</span>
                </div>

                {/* Swap Button */}
                <Button
                  onClick={handleSwap}
                  disabled={tonValue <= 0 || isProcessing}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isProcessing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : !tonConnectUI.connected ? (
                    'Connect Wallet'
                  ) : (
                    'Swap'
                  )}
                </Button>
              </div>
            </Card>
          </FadeUp>

          {/* Packages Section */}
          <FadeUp>
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground px-1">Quick Buy Packages</h2>
              
              <div className="space-y-3">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`p-4 border-border cursor-pointer transition-all hover:border-primary/50 ${
                        selectedPackage === pkg.id ? 'border-primary' : ''
                      }`}
                      onClick={() => !isProcessing && handlePackagePurchase(pkg)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <BoltIcon size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{pkg.name}</span>
                              {pkg.bonus > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-medium">
                                  +{pkg.bonus}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-primary font-bold">
                              {pkg.bolts.toLocaleString()} BOLT
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* TON Price */}
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <TonIcon size={16} />
                              <span className="font-bold text-foreground">{pkg.priceTon}</span>
                            </div>
                          </div>

                          {/* Stars Price */}
                          <div className="text-right border-l border-border pl-3">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="font-bold text-foreground">{pkg.priceStars}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Loading overlay */}
                      {isProcessing && selectedPackage === pkg.id && (
                        <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Info */}
          <FadeUp>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <p className="text-xs text-muted-foreground text-center">
                All transactions are processed securely on the TON blockchain. 
                Tokens will be credited instantly after confirmation.
              </p>
            </div>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default BuyBolt;
