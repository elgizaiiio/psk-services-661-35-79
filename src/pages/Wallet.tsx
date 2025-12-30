import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { Eye, EyeOff, Loader2, Wallet as WalletIcon } from "lucide-react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { PageWrapper, StaggerContainer, FadeUp, ScaleIn, AnimatedNumber } from '@/components/ui/motion-wrapper';
import { BoltIcon, TonIcon, UsdtIcon } from '@/components/ui/currency-icons';

const Wallet: React.FC = () => {
  const { user: tgUser, isLoading: authLoading } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  const wallet = useTonWallet();
  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  useTelegramBackButton();

  const boltBalance = user?.token_balance ?? 0;
  const usdtBalance = (user as any)?.usdt_balance ?? 0;

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setTonPrice(data?.["the-open-network"]?.usd ?? null))
      .catch(() => {});
  }, []);

  const isLoading = authLoading || miningLoading;

  if (!wallet?.account?.address) {
    return (
      <PageWrapper className="min-h-screen bg-background flex items-center justify-center px-6 pb-24">
        <Helmet><title>Wallet | Connect</title></Helmet>
        <div className="text-center space-y-4">
          <ScaleIn>
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <WalletIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          </ScaleIn>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-xl font-semibold text-foreground">Connect Wallet</h2>
            <p className="text-sm text-muted-foreground max-w-xs mt-2">Connect your TON wallet to view your assets</p>
            <div className="pt-4"><TonConnectButton /></div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
          <FadeUp>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-foreground">Wallet</h1>
              <motion.button onClick={() => setShowBalance(!showBalance)} className="p-2 rounded-lg hover:bg-muted" whileTap={{ scale: 0.9 }}>
                {showBalance ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
              </motion.button>
            </div>
          </FadeUp>

          <FadeUp>
            <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
              <div>
                <p className="text-xs text-muted-foreground">TON Wallet</p>
                <p className="text-sm font-medium text-foreground">{wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}</p>
              </div>
              <TonConnectButton />
            </div>
          </FadeUp>

          <FadeUp>
            <motion.div className="p-6 rounded-2xl bg-card border border-border text-center" whileHover={{ y: -2 }}>
              <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
              <AnimatePresence mode="wait">
                {showBalance ? (
                  <motion.p key="show" className="text-4xl font-bold text-foreground" initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0)' }} exit={{ opacity: 0, filter: 'blur(10px)' }}>
                    $<AnimatedNumber value={usdtBalance} decimals={2} duration={1} />
                  </motion.p>
                ) : (
                  <motion.p key="hide" className="text-4xl font-bold text-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>••••••</motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </FadeUp>

          <FadeUp><p className="text-sm font-medium text-muted-foreground px-1">Assets</p></FadeUp>

          {[
            { name: 'BOLT', balance: boltBalance, value: 0, icon: <BoltIcon size={40} /> },
            { name: 'TON', balance: 0, value: 0, icon: <TonIcon size={40} /> },
            { name: 'USDT', balance: usdtBalance, value: usdtBalance, icon: <UsdtIcon size={40} /> },
          ].map((asset) => (
            <FadeUp key={asset.name}>
              <motion.div className="p-4 rounded-xl bg-card border border-border" whileTap={{ scale: 0.98 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {asset.icon}
                    <div>
                      <p className="font-medium text-foreground">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">{showBalance ? asset.balance.toFixed(2) : '••••'}</p>
                    </div>
                  </div>
                  <p className="font-medium text-foreground">{showBalance ? `$${asset.value.toFixed(2)}` : '••••'}</p>
                </div>
              </motion.div>
            </FadeUp>
          ))}
        </StaggerContainer>
      </div>
    </PageWrapper>
  );
};

export default Wallet;