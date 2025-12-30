import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
  const { price: tonPrice } = useTonPrice();
  useTelegramBackButton();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ton' | 'stars'>('ton');

  const handlePackagePurchase = async (pkg: Package, method: 'ton' | 'stars') => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    if (method === 'stars') {
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
            title: `${pkg.name} Package`,
            description: `${pkg.bolts.toLocaleString()} BOLT tokens${pkg.bonus > 0 ? ` (+${pkg.bonus}% bonus)` : ''}`,
            payload: JSON.stringify({ 
              type: 'bolt_tokens', 
              packageId: pkg.id, 
              userId: user.id,
              bolts: pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100)
            }),
            amount: pkg.priceStars,
          },
          headers: {
            'x-telegram-init-data': initData,
          },
        });

        if (error) throw error;

        const invoiceUrl = data?.invoice_link;
        if (invoiceUrl) {
          const tgWebApp = (window as any).Telegram?.WebApp;
          if (tgWebApp?.openInvoice) {
            tgWebApp.openInvoice(invoiceUrl, async (status: string) => {
              if (status === 'paid') {
                // Update user balance
                const totalBolts = pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100);
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
                
                toast.success(`Purchased ${totalBolts.toLocaleString()} BOLT`);
              } else if (status === 'cancelled') {
                toast.info('Payment cancelled');
              } else {
                toast.error('Payment failed');
              }
            });
          } else {
            window.open(invoiceUrl, '_blank');
          }
        } else {
          throw new Error('No invoice URL returned');
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

      toast.success(`Purchased ${totalBolts.toLocaleString()} BOLT`);
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

      <div className="max-w-md mx-auto px-4 pt-6">
        <StaggerContainer className="space-y-6">
          {/* Header */}
          <FadeUp>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">Buy BOLT</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a package and payment method
              </p>
            </div>
          </FadeUp>

          {/* Current Balance */}
          <FadeUp>
            <Card className="p-4 border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Balance</span>
                <div className="flex items-center gap-2">
                  <BoltIcon size={20} />
                  <span className="text-lg font-bold text-foreground">
                    {(user?.token_balance || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </FadeUp>

          {/* Packages */}
          <div className="space-y-3">
            {packages.map((pkg, index) => {
              const isSelected = selectedPackage === pkg.id;
              const totalBolts = pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100);

              return (
                <FadeUp key={pkg.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={`p-4 border-border transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                      {/* Package Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{pkg.name}</span>
                            {pkg.bonus > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                +{pkg.bonus}%
                              </span>
                            )}
                          </div>
                          <p className="text-lg font-bold text-primary mt-0.5">
                            {totalBolts.toLocaleString()} BOLT
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BoltIcon size={20} />
                        </div>
                      </div>

                      {/* Payment Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePackagePurchase(pkg, 'ton')}
                          disabled={isProcessing}
                          className="h-10"
                        >
                          {isSelected && paymentMethod === 'ton' && isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <TonIcon size={16} />
                              <span>{pkg.priceTon} TON</span>
                            </div>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePackagePurchase(pkg, 'stars')}
                          disabled={isProcessing}
                          className="h-10"
                        >
                          {isSelected && paymentMethod === 'stars' && isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span>⭐</span>
                              <span>{pkg.priceStars}</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                </FadeUp>
              );
            })}
          </div>

          {/* Info */}
          <FadeUp>
            <p className="text-xs text-muted-foreground text-center px-4">
              Payments are processed securely. TON requires wallet connection.
              Stars payments are handled through Telegram.
            </p>
          </FadeUp>
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default BuyBolt;