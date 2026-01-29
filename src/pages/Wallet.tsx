import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { Eye, EyeOff, Loader2, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Copy, Check } from "lucide-react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { BoltIcon, TonIcon, UsdtIcon, ViralIcon, EthIcon } from '@/components/ui/currency-icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import WithdrawModal from '@/components/WithdrawModal';
import WithdrawSelectModal from '@/components/wallet/WithdrawSelectModal';
import ViralWithdrawModal from '@/components/wallet/ViralWithdrawModal';
import DepositModal from '@/components/wallet/DepositModal';
import WalletVerificationModal from '@/components/WalletVerificationModal';
import RequireServerModal from '@/components/RequireServerModal';

const Wallet: React.FC = () => {
  const { user: tgUser, isLoading: authLoading } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  const wallet = useTonWallet();
  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawSelectOpen, setWithdrawSelectOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState<{ open: boolean; currency: 'TON' | 'USDT' } | null>(null);
  const [viralWithdrawOpen, setViralWithdrawOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [isWalletVerified, setIsWalletVerified] = useState(false);
  const [pendingWithdrawCurrency, setPendingWithdrawCurrency] = useState<'TON' | 'USDT' | 'VIRAL' | null>(null);
  const [hasServer, setHasServer] = useState<boolean | null>(null);
  const [requireServerOpen, setRequireServerOpen] = useState(false);
  useTelegramBackButton();

  const boltBalance = user?.token_balance ?? 0;
  const usdtBalance = (user as any)?.usdt_balance ?? 0;
  const tonBalance = (user as any)?.ton_balance ?? 0;
  const viralBalance = (user as any)?.viral_balance ?? 0;
  const ethBalance = (user as any)?.eth_balance ?? 0;

  useEffect(() => {
    Promise.all([
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd")
        .then(res => res.json())
        .then(data => setTonPrice(data?.["the-open-network"]?.usd ?? null)),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd")
        .then(res => res.json())
        .then(data => setEthPrice(data?.["ethereum"]?.usd ?? null))
    ]).catch(() => {});
  }, []);

  // Check if user has a server
  useEffect(() => {
    const checkUserServers = async () => {
      if (!user?.id) return;
      
      try {
        const { count } = await supabase
          .from('user_servers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        setHasServer((count || 0) > 0);
      } catch {
        setHasServer(false);
      }
    };

    checkUserServers();
  }, [user?.id]);

  // Check if current wallet is verified
  useEffect(() => {
    const checkWalletVerification = async () => {
      if (!user?.id || !wallet?.account?.address) return;
      
      try {
        const { data } = await supabase
          .from('wallet_verifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('wallet_address', wallet.account.address)
          .single();
        
        setIsWalletVerified(!!data);
      } catch {
        setIsWalletVerified(false);
      }
    };

    checkWalletVerification();
  }, [user?.id, wallet?.account?.address]);

  const isLoading = authLoading || miningLoading;
  const totalUSD = usdtBalance + (tonBalance * (tonPrice || 0)) + (ethBalance * (ethPrice || 0));

  const copyAddress = () => {
    if (wallet?.account?.address) {
      navigator.clipboard.writeText(wallet.account.address);
      setCopied(true);
      toast.success('Address copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdrawSelect = (currency: 'TON' | 'USDT' | 'VIRAL') => {
    setWithdrawSelectOpen(false);
    
    // Viral has instant withdrawal - no verification needed
    if (currency === 'VIRAL') {
      setViralWithdrawOpen(true);
      return;
    }
    
    // First check if wallet is verified
    if (!isWalletVerified) {
      setPendingWithdrawCurrency(currency);
      setVerificationOpen(true);
      return;
    }
    
    // Then check if user has a server
    if (!hasServer) {
      setRequireServerOpen(true);
      return;
    }
    
    // All checks passed, open withdraw modal
    setWithdrawModal({ open: true, currency });
  };

  if (!wallet?.account?.address) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 pb-24">
        <Helmet><title>Wallet | Connect</title></Helmet>
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <WalletIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Connect Wallet</h2>
            <p className="text-sm text-muted-foreground mt-2">Connect your TON wallet to view assets</p>
          </div>
          <TonConnectButton />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet><title>Wallet</title></Helmet>
      <div className="max-w-md mx-auto px-5 pt-8">
        
        {/* Header with visibility toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold text-foreground">Wallet</h1>
          <button 
            onClick={() => setShowBalance(!showBalance)} 
            className="p-2 text-muted-foreground"
          >
            {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Total Balance */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
          <AnimatePresence mode="wait">
            {showBalance ? (
              <motion.p
                key="balance"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-4xl font-bold text-foreground"
              >
                ${totalUSD.toFixed(2)}
              </motion.p>
            ) : (
              <motion.p
                key="hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-4xl font-bold text-foreground"
              >
                ••••••
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Wallet Address */}
        <button 
          onClick={copyAddress}
          className="flex items-center justify-center gap-2 mx-auto mb-8 px-4 py-2 rounded-full bg-muted/50"
        >
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm font-mono text-muted-foreground">
            {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
          </span>
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Action Buttons - No background, no borders */}
        <div className="flex items-center justify-center gap-12 mb-10">
          <button
            onClick={() => setDepositModalOpen(true)}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-sm text-foreground">Deposit</span>
          </button>

          <button
            onClick={() => setWithdrawSelectOpen(true)}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-orange-500" />
            </div>
            <span className="text-sm text-foreground">Withdraw</span>
          </button>
        </div>

        {/* TON Wallet Connection */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 mb-6">
          <div className="flex items-center gap-3">
            <TonIcon size={28} />
            <div>
              <p className="text-xs text-muted-foreground">TON Wallet</p>
              <p className="text-sm font-medium text-foreground">Connected</p>
            </div>
          </div>
          <TonConnectButton />
        </div>

        {/* Assets Header */}
        <p className="text-sm font-medium text-muted-foreground mb-4">Assets</p>

        {/* Asset List */}
        <div className="space-y-2">
          {[
            { 
              name: 'VIRAL', 
              fullName: 'Viral Token',
              balance: viralBalance, 
              value: 0, 
              icon: <ViralIcon size={40} />,
            },
            { 
              name: 'ETH', 
              fullName: 'Ethereum',
              balance: ethBalance, 
              value: ethBalance * (ethPrice || 0), 
              icon: <EthIcon size={40} />,
            },
            { 
              name: 'BOLT', 
              fullName: 'Bolt Token',
              balance: boltBalance, 
              value: 0, 
              icon: <BoltIcon size={40} />,
            },
            { 
              name: 'TON', 
              fullName: 'Toncoin',
              balance: tonBalance, 
              value: tonBalance * (tonPrice || 0), 
              icon: <TonIcon size={40} />,
            },
            { 
              name: 'USDT', 
              fullName: 'Tether USD',
              balance: usdtBalance, 
              value: usdtBalance, 
              icon: <UsdtIcon size={40} />,
            },
          ].map((asset) => (
            <div 
              key={asset.name}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/20"
            >
              <div className="flex items-center gap-3">
                {asset.icon}
                <div>
                  <p className="font-medium text-foreground">{asset.name}</p>
                  <p className="text-xs text-muted-foreground">{asset.fullName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-foreground">
                  {showBalance ? asset.balance.toLocaleString(undefined, { maximumFractionDigits: asset.name === 'ETH' ? 6 : 2 }) : '••••'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {showBalance ? `$${asset.value.toFixed(2)}` : '••••'}
                </p>
              </div>
            </div>
          ))}
        </div>
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
        onSelectCurrency={handleWithdrawSelect}
        tonBalance={tonBalance}
        usdtBalance={usdtBalance}
        viralBalance={viralBalance}
      />

      {/* Wallet Verification Modal */}
      {user && wallet?.account?.address && (
        <WalletVerificationModal
          open={verificationOpen}
          onClose={() => {
            setVerificationOpen(false);
            setPendingWithdrawCurrency(null);
          }}
          userId={user.id}
          walletAddress={wallet.account.address}
          onVerified={() => {
            setIsWalletVerified(true);
            setVerificationOpen(false);
            // After verification, check if user has server
            if (pendingWithdrawCurrency && pendingWithdrawCurrency !== 'VIRAL') {
              if (!hasServer) {
                setRequireServerOpen(true);
                setPendingWithdrawCurrency(null);
              } else {
                setWithdrawModal({ open: true, currency: pendingWithdrawCurrency as 'TON' | 'USDT' });
                setPendingWithdrawCurrency(null);
              }
            }
          }}
        />
      )}

      {/* Require Server Modal */}
      <RequireServerModal
        open={requireServerOpen}
        onClose={() => setRequireServerOpen(false)}
      />

      {/* Viral Withdraw Modal (Instant) */}
      {user && (
        <ViralWithdrawModal
          open={viralWithdrawOpen}
          onClose={() => setViralWithdrawOpen(false)}
          userId={user.id}
          balance={viralBalance}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Withdraw Modal (TON/USDT) */}
      {withdrawModal && user && (
        <WithdrawModal
          open={withdrawModal.open}
          onClose={() => setWithdrawModal(null)}
          userId={user.id}
          currency={withdrawModal.currency}
          balance={withdrawModal.currency === 'USDT' ? usdtBalance : withdrawModal.currency === 'TON' ? tonBalance : 0}
        />
      )}
    </div>
  );
};

export default Wallet;
