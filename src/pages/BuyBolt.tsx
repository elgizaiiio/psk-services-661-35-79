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
import { usePriceCalculator } from '@/hooks/usePriceCalculator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageWrapper, FadeUp, StaggerContainer } from '@/components/ui/motion-wrapper';
import { TON_PAYMENT_ADDRESS, getValidUntil, tonToNano } from '@/lib/ton-constants';

interface Package {
  id: string;
  name: string;
  bolts: number;
  priceTon: number;
  bonus: number;
}

// Packages defined by TON price - Stars calculated dynamically
const packages: Package[] = [
  { id: 'starter', name: 'Starter', bolts: 3000, priceTon: 0.5, bonus: 0 },
  { id: 'basic', name: 'Basic', bolts: 6000, priceTon: 1, bonus: 5 },
  { id: 'popular', name: 'Popular', bolts: 18000, priceTon: 3, bonus: 10 },
  { id: 'premium', name: 'Premium', bolts: 36000, priceTon: 6, bonus: 15 },
  { id: 'whale', name: 'Whale', bolts: 60000, priceTon: 10, bonus: 20 },
];

const BuyBolt = () => {
  const { user: telegramUser, webApp } = useTelegramAuth();
  
  const { user } = useViralMining(telegramUser);
  const [tonConnectUI] = useTonConnectUI();
  const { tonPrice, tonToStars, tonToUsd } = usePriceCalculator();
  useTelegramBackButton();

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ton' | 'stars'>('ton');

  const handlePackagePurchase = async (pkg: Package, method: 'ton' | 'stars') => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    // Calculate Stars dynamically based on real TON price
    const priceStars = tonToStars(pkg.priceTon);
    const priceUsd = tonToUsd(pkg.priceTon);

    if (method === 'stars') {
      if (!telegramUser?.id || !webApp) {
        toast.error('Stars payment only works inside Telegram');
        return;
      }

      const totalBolts = pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100);

      setSelectedPackage(pkg.id);
      setPaymentMethod('stars');
      setIsProcessing(true);

      try {
        // 1) Create a payment record
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('stars_payments')
          .insert({
            user_id: user.id,
            telegram_id: telegramUser.id,
            product_type: 'token_purchase',
            product_id: pkg.id,
            amount_stars: priceStars,
            amount_usd: priceUsd,
            status: 'pending',
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // 2) Create invoice link via backend function
        const { data, error } = await supabase.functions.invoke('create-stars-invoice', {
          body: {
            title: `${pkg.name} Package`,
            description: `${pkg.bolts.toLocaleString()} BOLT tokens${pkg.bonus > 0 ? ` (+${pkg.bonus}% bonus)` : ''}`,
            payload: JSON.stringify({
              payment_id: paymentRecord.id,
              product_type: 'token_purchase',
              product_id: pkg.id,
              user_id: user.id,
              bolts: totalBolts,
            }),
            amount: priceStars,
          },
        });

        if (error) throw error;

        const invoiceUrl = data?.invoice_link;
        if (!invoiceUrl) {
          throw new Error('No invoice URL returned');
        }

        // 3) Open invoice and wait for completion
        if ('openInvoice' in webApp) {
          await new Promise<void>((resolve) => {
            (webApp as any).openInvoice(invoiceUrl, async (status: string) => {
              try {
                  if (status === 'paid') {
                                  await supabase
                                    .from('stars_payments')
                                    .update({ status: 'completed' })
                                    .eq('id', paymentRecord.id);

                                  const { data: currentUser, error: balanceError } = await supabase
                                    .from('bolt_users')
                                    .select('token_balance')
                                    .eq('id', user.id)
                                    .single();

                                  if (balanceError) throw balanceError;

                                  const newBalance = (currentUser?.token_balance || 0) + totalBolts;
                                  const { error: updateError } = await supabase
                                    .from('bolt_users')
                                    .update({ token_balance: newBalance })
                                    .eq('id', user.id);

                                  if (updateError) throw updateError;

                                  // Notify admin about Stars payment
                                  try {
                                    await supabase.functions.invoke('notify-admin-payment', {
                                      body: {
                                        userId: user.id,
                                        username: telegramUser?.username || telegramUser?.first_name || 'Unknown',
                                        telegramId: telegramUser?.id,
                                        paymentMethod: 'stars',
                                        amount: priceStars,
                                        currency: 'Stars',
                                        productType: 'token_purchase',
                                        productName: `${pkg.name} Package`,
                                        description: `${totalBolts.toLocaleString()} BOLT tokens`,
                                      }
                                    });
                                  } catch (e) {
                                    console.error('Failed to notify admin', e);
                                  }

                                  toast.success(`Purchased ${totalBolts.toLocaleString()} BOLT`);
                } else if (status === 'cancelled') {
                  await supabase
                    .from('stars_payments')
                    .update({ status: 'cancelled' })
                    .eq('id', paymentRecord.id);
                  toast.info('Payment cancelled');
                } else if (status === 'failed') {
                  await supabase
                    .from('stars_payments')
                    .update({ status: 'failed' })
                    .eq('id', paymentRecord.id);
                  toast.error('Payment failed');
                } else {
                  await supabase
                    .from('stars_payments')
                    .update({ status: 'processing' })
                    .eq('id', paymentRecord.id);
                  toast.info('Payment is processing...');
                }
              } catch (e) {
                console.error('Stars payment completion error:', e);
                toast.error('Failed to complete payment');
              } finally {
                resolve();
              }
            });
          });
        } else {
          window.open(invoiceUrl, '_blank');
        }
      } catch (error: any) {
        console.error('Stars payment error:', error);
        toast.error('Failed to start Stars payment');
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
      const amountNano = tonToNano(pkg.priceTon);
      const totalBolts = pkg.bolts + Math.floor(pkg.bolts * pkg.bonus / 100);

      const { data: payment, error: paymentError } = await supabase
        .from('ton_payments')
        .insert({
          user_id: user.id,
          amount_ton: pkg.priceTon,
          destination_address: TON_PAYMENT_ADDRESS,
          product_type: 'token_purchase',
          product_id: pkg.id,
          description: `Purchase ${pkg.name} Package`,
          status: 'pending',
          metadata: { bolts: totalBolts, package: pkg.name },
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      const result = await tonConnectUI.sendTransaction({
        validUntil: getValidUntil(),
        messages: [{
          address: TON_PAYMENT_ADDRESS,
          amount: amountNano,
        }],
      });

      // Save tx_hash but keep as PENDING - don't confirm yet!
      await supabase
        .from('ton_payments')
        .update({ 
          tx_hash: result.boc,
          wallet_address: tonConnectUI.wallet?.account?.address || null,
          metadata: { 
            bolts: totalBolts, 
            package: pkg.name,
            boc_submitted: true,
            submitted_at: new Date().toISOString()
          }
        })
        .eq('id', payment.id);

      toast.info('Verifying transaction on blockchain...');

      // Wait for transaction to propagate
      await new Promise(resolve => setTimeout(resolve, 6000));

      // Verify the payment on blockchain
      const verifyResult = await supabase.functions.invoke('verify-ton-payment', {
        body: {
          paymentId: payment.id,
          txHash: result.boc,
          walletAddress: tonConnectUI.wallet?.account?.address
        },
        headers: {
          'x-telegram-id': String(telegramUser?.id)
        }
      });

      if (verifyResult.error || !verifyResult.data?.ok) {
        console.warn('Payment sent but verification pending:', verifyResult);
        toast.warning('Payment sent! Verification may take a few minutes. Tokens will be credited once confirmed.');
      } else {
        // Only credit tokens AFTER successful blockchain verification
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

        // Notify admin about verified TON payment
        try {
          await supabase.functions.invoke('notify-admin-payment', {
            body: {
              userId: user.id,
              username: telegramUser?.username || telegramUser?.first_name || 'Unknown',
              telegramId: telegramUser?.id,
              paymentMethod: 'ton',
              amount: pkg.priceTon,
              currency: 'TON',
              productType: 'token_purchase',
              productName: `${pkg.name} Package`,
              description: `${totalBolts.toLocaleString()} BOLT tokens (verified)`,
            }
          });
        } catch (e) {
          console.error('Failed to notify admin', e);
        }

        toast.success(`Purchased ${totalBolts.toLocaleString()} BOLT`);
      }
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
              <p className="text-xs text-muted-foreground mt-2">
                1 TON ≈ ${tonPrice.toFixed(2)} • 1 Star = $0.02
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
              const priceStars = tonToStars(pkg.priceTon);
              const priceUsd = tonToUsd(pkg.priceTon);

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
                          <p className="text-[10px] text-muted-foreground">
                            ≈ ${priceUsd.toFixed(2)} USD
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
                              <span>{priceStars}</span>
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
