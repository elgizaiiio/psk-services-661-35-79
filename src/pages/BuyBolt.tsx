import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowDownUp, Loader2, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BoltIcon, TonIcon } from '@/components/ui/currency-icons';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useViralMining } from '@/hooks/useViralMining';
import { useTelegramBackButton } from '@/hooks/useTelegramBackButton';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { useTonPrice } from '@/hooks/useTonPrice';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';

// BOLT price in USD
const BOLT_PRICE_USD = 0.0001;

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
  const { user: telegramUser, webApp } = useTelegramAuth();
  const initData = webApp?.initData || '';
  const { user } = useViralMining(telegramUser);
  const [tonConnectUI] = useTonConnectUI();
  const { price: tonPrice, isLoading: priceLoading } = useTonPrice();
  useTelegramBackButton();

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [tonAmount, setTonAmount] = useState('');
  const [boltAmount, setBoltAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ton' | 'stars'>('ton');

  // Calculate BOLT per TON based on real price
  const boltPerTon = tonPrice / BOLT_PRICE_USD;

  // Calculate conversions
  const tonValue = parseFloat(tonAmount) || 0;
  const boltValue = parseFloat(boltAmount) || 0;

  // Update the other input when one changes
  const handleTonChange = (value: string) => {
    setTonAmount(value);
    const ton = parseFloat(value) || 0;
    setBoltAmount(ton > 0 ? Math.floor(ton * boltPerTon).toString() : '');
  };

  const handleBoltChange = (value: string) => {
    setBoltAmount(value);
    const bolt = parseFloat(value) || 0;
    setTonAmount(bolt > 0 ? (bolt / boltPerTon).toFixed(4) : '');
  };

  // Load TradingView widget
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BYBIT:TONUSDT",
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: true,
      hide_legend: true,
      save_image: false,
      hide_volume: true,
      support_host: "https://www.tradingview.com"
    });

    chartContainerRef.current.innerHTML = '';
    chartContainerRef.current.appendChild(script);
  }, []);

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
      const boltsToReceive = Math.floor(tonValue * boltPerTon);

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

  const handlePackagePurchase = async (pkg: Package, method: 'ton' | 'stars') => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    if (method === 'stars') {
      // Handle Stars payment via Telegram
      if (!telegramUser?.id || !initData) {
        toast.error('Telegram authentication required');
        return;
      }

      setSelectedPackage(pkg.id);
      setPaymentMethod('stars');
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke('create-stars-invoice', {
          body: {
            productType: 'bolt_tokens',
            productId: pkg.id,
            amount: pkg.priceStars,
            title: `${pkg.name} Package`,
            description: `${pkg.bolts.toLocaleString()} BOLT tokens${pkg.bonus > 0 ? ` (+${pkg.bonus}% bonus)` : ''}`,
          },
          headers: {
            'x-telegram-init-data': initData,
          },
        });

        if (error) throw error;

        if (data?.invoiceUrl) {
          // Open Telegram payment
          const webApp = (window as any).Telegram?.WebApp;
          if (webApp?.openInvoice) {
            webApp.openInvoice(data.invoiceUrl, (status: string) => {
              if (status === 'paid') {
                toast.success(`Successfully purchased ${pkg.bolts.toLocaleString()} BOLT`);
              } else if (status === 'cancelled') {
                toast.info('Payment cancelled');
              } else {
                toast.error('Payment failed');
              }
            });
          } else {
            window.open(data.invoiceUrl, '_blank');
          }
        }
      } catch (error: any) {
        console.error('Stars payment error:', error);
        toast.error('Failed to create payment');
      } finally {
        setIsProcessing(false);
        setSelectedPackage(null);
      }
      return;
    }

    // TON payment
    if (!tonConnectUI.connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSelectedPackage(pkg.id);
    setPaymentMethod('ton');
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
        <meta name="description" content="Buy BOLT tokens with TON or Stars" />
      </Helmet>

      <div className="max-w-md mx-auto px-4 pt-4">
        <StaggerContainer className="space-y-4">
          {/* Header */}
          <FadeUp>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Buy BOLT</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Swap TON or Stars for BOLT tokens</p>
            </div>
          </FadeUp>

          {/* TradingView Chart */}
          <FadeUp>
            <Card className="overflow-hidden border-border">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TonIcon size={20} />
                  <span className="font-semibold text-foreground text-sm">TON/USDT</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground text-sm">
                    ${priceLoading ? '...' : tonPrice.toFixed(2)}
                  </span>
                </div>
              </div>
              <div 
                ref={chartContainerRef}
                className="tradingview-widget-container h-48 w-full"
              />
            </Card>
          </FadeUp>

          {/* Swap Interface */}
          <FadeUp>
            <Card className="p-4 border-border">
              <div className="space-y-3">
                {/* TON Input */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">You Pay</span>
                    <span className="text-[10px] text-muted-foreground">
                      ≈ ${(tonValue * tonPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border">
                      <TonIcon size={20} />
                      <span className="font-semibold text-foreground text-sm">TON</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={tonAmount}
                      onChange={(e) => handleTonChange(e.target.value)}
                      className="text-right text-lg font-bold border-0 bg-transparent focus-visible:ring-0 h-9"
                    />
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center -my-1 relative z-10">
                  <motion.button
                    className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg border border-border"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9, rotate: 180 }}
                  >
                    <ArrowDownUp className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* BOLT Output */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">You Receive</span>
                    <span className="text-[10px] text-muted-foreground">
                      ≈ ${(boltValue * BOLT_PRICE_USD).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border">
                      <BoltIcon size={20} />
                      <span className="font-semibold text-foreground text-sm">BOLT</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={boltAmount}
                      onChange={(e) => handleBoltChange(e.target.value)}
                      className="text-right text-lg font-bold border-0 bg-transparent focus-visible:ring-0 h-9"
                    />
                  </div>
                </div>

                {/* Rate Info */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 py-1 rounded bg-muted/20">
                  <span>Rate</span>
                  <span className="font-medium">1 TON = {Math.floor(boltPerTon).toLocaleString()} BOLT</span>
                </div>

                {/* Swap Button */}
                <Button
                  onClick={handleSwap}
                  disabled={tonValue <= 0 || isProcessing}
                  className="w-full h-11 text-sm font-semibold bg-white text-black hover:bg-white/90"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
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
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground px-1">Quick Buy Packages</h2>
              
              <div className="space-y-2">
                {packages.map((pkg, index) => (
                  <motion.div
                    key={pkg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className="p-3 border-border relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BoltIcon size={18} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-sm">{pkg.name}</span>
                              {pkg.bonus > 0 && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-500 font-medium">
                                  +{pkg.bonus}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-primary font-bold">
                              {pkg.bolts.toLocaleString()} BOLT
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* TON Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePackagePurchase(pkg, 'ton')}
                            disabled={isProcessing && selectedPackage === pkg.id}
                            className="h-8 px-2.5 text-xs font-semibold border-border hover:bg-muted"
                          >
                            {isProcessing && selectedPackage === pkg.id && paymentMethod === 'ton' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <TonIcon size={14} />
                                <span className="ml-1">{pkg.priceTon}</span>
                              </>
                            )}
                          </Button>

                          {/* Stars Button */}
                          <Button
                            size="sm"
                            onClick={() => handlePackagePurchase(pkg, 'stars')}
                            disabled={isProcessing && selectedPackage === pkg.id}
                            className="h-8 px-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            {isProcessing && selectedPackage === pkg.id && paymentMethod === 'stars' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Star className="w-3 h-3 fill-current" />
                                <span className="ml-1">{pkg.priceStars}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Info */}
          <FadeUp>
            <div className="p-3 rounded-xl bg-muted/20 border border-border">
              <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                Transactions are processed securely on the TON blockchain or via Telegram Stars. 
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
