import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { Eye, EyeOff, Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Copy, Check } from "lucide-react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { PageWrapper, StaggerContainer, FadeUp, ScaleIn, AnimatedNumber } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';
import { toast } from 'sonner';
import WithdrawModal from '@/components/WithdrawModal';
import WithdrawSelectModal from '@/components/wallet/WithdrawSelectModal';
import DepositModal from '@/components/wallet/DepositModal';

const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const { user: tgUser, isLoading: authLoading } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  const wallet = useTonWallet();
  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawSelectOpen, setWithdrawSelectOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; currency: 'TON' | 'USDT' } | null>(null);
  const [copied, setCopied] = useState(false);
  useTelegramBackButton();

  const boltBalance = user?.token_balance ?? 0;
  const usdtBalance = (user as any)?.usdt_balance ?? 0;
  const tonBalance = (user as any)?.ton_balance ?? 0;

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setTonPrice(data?.["the-open-network"]?.usd ?? null))
      .catch(() => {});
  }, []);

  const isLoading = authLoading || miningLoading;

  // Calculate total in USD
  const totalUSD = usdtBalance + (tonBalance * (tonPrice || 0));

  const copyAddress = () => {
    if (wallet?.account?.address) {
      navigator.clipboard.writeText(wallet.account.address);
      setCopied(true);
      toast.success('تم نسخ العنوان');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet?.account?.address) {
    return (
      <PageWrapper className="min-h-screen bg-background flex items-center justify-center px-6 pb-24">
        <Helmet><title>Wallet | Connect</title></Helmet>
        <div className="text-center space-y-4">
          <ScaleIn>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <WalletIcon className="w-10 h-10 text-primary" />
            </div>
          </ScaleIn>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-foreground">ربط المحفظة</h2>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">اربط محفظة TON لعرض أصولك</p>
            <div className="pt-6"><TonConnectButton /></div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <PageWrapper className="min-h-screen bg-background pb-28">
      <Helmet><title>Wallet</title></Helmet>
      <div className="max-w-md mx-auto px-5 pt-8">
        <StaggerContainer className="space-y-6">
          
          {/* Total Balance - Hero Section */}
          <FadeUp>
            <div className="text-center py-6">
              {/* Balance Toggle */}
              <motion.button 
                onClick={() => setShowBalance(!showBalance)} 
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted/50"
                whileTap={{ scale: 0.9 }}
              >
                {showBalance ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
              </motion.button>

              <p className="text-sm text-muted-foreground mb-2">الرصيد الإجمالي</p>
              <AnimatePresence mode="wait">
                {showBalance ? (
                  <motion.div
                    key="balance"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-center gap-2"
                  >
                    <span className="text-5xl font-bold text-foreground">
                      $<AnimatedNumber value={totalUSD} decimals={2} duration={1} />
                    </span>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-5xl font-bold text-foreground"
                  >
                    ••••••
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Wallet Address */}
              <motion.div 
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                onClick={copyAddress}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-mono text-muted-foreground">
                  {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </motion.div>
            </div>
          </FadeUp>

          {/* Action Buttons Grid */}
          <FadeUp>
            <div className="grid grid-cols-2 gap-3">
              {/* Deposit Button */}
              <motion.button
                onClick={() => setDepositModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6 text-green-500" />
                </div>
                <span className="text-sm font-medium text-foreground">إيداع</span>
              </motion.button>

              {/* Withdraw Button */}
              <motion.button
                onClick={() => setWithdrawSelectOpen(true)}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-orange-500" />
                </div>
                <span className="text-sm font-medium text-foreground">سحب</span>
              </motion.button>
            </div>
          </FadeUp>

          {/* Wallet Connection */}
          <FadeUp>
            <div className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex items-center gap-3">
                <TonIcon size={32} />
                <div>
                  <p className="text-xs text-muted-foreground">محفظة TON</p>
                  <p className="text-sm font-medium text-foreground">متصلة</p>
                </div>
              </div>
              <TonConnectButton />
            </div>
          </FadeUp>

          {/* Assets Section */}
          <FadeUp>
            <div className="flex items-center justify-between px-1 pt-2">
              <p className="text-sm font-semibold text-foreground">الأصول</p>
            </div>
          </FadeUp>

          {/* Asset Cards */}
          <div className="space-y-3">
            {[
              { 
                name: 'BOLT', 
                fullName: 'Bolt Token',
                balance: boltBalance, 
                value: 0, 
                icon: <BoltIcon size={44} />,
                change: null
              },
              { 
                name: 'TON', 
                fullName: 'Toncoin',
                balance: tonBalance, 
                value: tonBalance * (tonPrice || 0), 
                icon: <TonIcon size={44} />,
                change: '+2.4%'
              },
              { 
                name: 'USDT', 
                fullName: 'Tether USD',
                balance: usdtBalance, 
                value: usdtBalance, 
                icon: <UsdtIcon size={44} />,
                change: null
              },
            ].map((asset, index) => (
              <FadeUp key={asset.name}>
                <motion.div 
                  className="p-4 rounded-2xl bg-card border border-border backdrop-blur-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        {asset.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{asset.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{asset.fullName}</p>
                          {asset.change && (
                            <span className="text-xs text-green-500 font-medium">{asset.change}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {showBalance ? asset.balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '••••'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showBalance ? `$${asset.value.toFixed(2)}` : '••••'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </StaggerContainer>
      </div>

      {/* Deposit Modal */}
      {user && (
        <DepositModal
          open={depositModalOpen}
          onClose={() => setDepositModalOpen(false)}
          userId={user.id}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Withdraw Select Modal */}
      <WithdrawSelectModal
        open={withdrawSelectOpen}
        onClose={() => setWithdrawSelectOpen(false)}
        onSelectCurrency={(currency) => {
          setWithdrawSelectOpen(false);
          setWithdrawModal({ open: true, currency });
        }}
        tonBalance={tonBalance}
        usdtBalance={usdtBalance}
      />

      {/* Withdraw Modal */}
      {withdrawModal && user && (
        <WithdrawModal
          open={withdrawModal.open}
          onClose={() => setWithdrawModal(null)}
          userId={user.id}
          currency={withdrawModal.currency}
          balance={withdrawModal.currency === 'USDT' ? usdtBalance : withdrawModal.currency === 'TON' ? tonBalance : 0}
        />
      )}
    </PageWrapper>
  );
};

export default Wallet;
