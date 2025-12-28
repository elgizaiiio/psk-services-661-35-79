import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { Eye, EyeOff, Zap } from "lucide-react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";

const Wallet: React.FC = () => {
  const { user: tgUser, isLoading: authLoading } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);
  const wallet = useTonWallet();

  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  const boltBalance = user?.token_balance ?? 0;
  const usdtBalance = (user as any)?.usdt_balance ?? 0;

  useEffect(() => {
    const fetchTonPrice = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
        );
        const data = await res.json();
        setTonPrice(data?.["the-open-network"]?.usd ?? null);
      } catch (e) {
        console.error("Error fetching TON price:", e);
      }
    };
    fetchTonPrice();
  }, []);

  const isLoading = authLoading || miningLoading;

  if (!wallet?.account?.address) {
    return (
      <>
        <Helmet>
          <title>Wallet | Connect</title>
        </Helmet>
        <main className="min-h-screen bg-background flex items-center justify-center px-6 pb-24">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Connect Wallet</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Connect your TON wallet to view your assets
            </p>
            <div className="pt-4">
              <TonConnectButton />
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Wallet</title>
        <meta name="description" content="Manage your crypto assets" />
      </Helmet>

      <main className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Wallet</h1>
            <button 
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {showBalance ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Connected Wallet */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
            <div>
              <p className="text-xs text-muted-foreground">TON Wallet</p>
              <p className="text-sm font-medium text-foreground">
                {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
              </p>
            </div>
            <TonConnectButton />
          </div>

          {/* Total Balance */}
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
            <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-foreground tracking-tight">
              {showBalance ? `$${usdtBalance.toFixed(2)}` : '••••••'}
            </p>
          </div>

          {/* Assets List */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground px-1">Assets</p>
            
            {/* BOLT */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">BOLT</p>
                    <p className="text-xs text-muted-foreground">
                      {isLoading ? '...' : showBalance ? `${boltBalance.toFixed(2)}` : '••••••'}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-foreground">$0.00</p>
              </div>
            </div>

            {/* TON */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src="https://api.voxelplay.app/assets/images/currency/ton.png" 
                      alt="TON" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">TON</p>
                    <p className="text-xs text-muted-foreground">
                      {showBalance ? '0.00' : '••••••'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">$0.00</p>
                  {tonPrice && (
                    <p className="text-xs text-muted-foreground">${tonPrice.toFixed(2)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* USDT */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src="https://www.joinhu4.io/checkout/_next/static/media/usdt.6d35925e.svg" 
                      alt="USDT" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">USDT</p>
                    <p className="text-xs text-muted-foreground">
                      {showBalance ? usdtBalance.toFixed(4) : '••••••'}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-foreground">
                  ${showBalance ? usdtBalance.toFixed(2) : '••••'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </>
  );
};

export default Wallet;
