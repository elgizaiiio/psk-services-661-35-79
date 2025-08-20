import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import ViralIcon from "@/components/ui/viral-icon";
import { 
  Send, 
  ArrowDownLeft, 
  Clock, 
  TrendingUp, 
  Eye,
  EyeOff,
  RefreshCw,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TonConnectButton, useTonWallet, useTonConnectUI } from "@tonconnect/ui-react";


const RECEIVER_ADDRESS = "UQBJSGcoWTcjdkWFSxA4A6sLmnD5uFKoKHFEHc3LqGJvFWya";

const WalletInner: React.FC = () => {
  const { user: tgUser, isLoading: authLoading, hapticFeedback } = useTelegramAuth();
  const { user, loading: miningLoading } = useViralMining(tgUser);

  const [tonPrice, setTonPrice] = useState<number | null>(null);
  const [tonLoading, setTonLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const wallet = useTonWallet();
  const [tcui] = useTonConnectUI();

  const viralBalance = useMemo(() => user?.token_balance ?? 0, [user]);

  const fetchTonPrice = async () => {
    try {
      setTonLoading(true);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd",
        { headers: { accept: "application/json" } }
      );
      if (!res.ok) throw new Error("Failed to fetch TON price");
      const data = await res.json();
      const price = data?.["the-open-network"]?.usd;
      if (typeof price !== "number") throw new Error("Invalid TON price data");
      setTonPrice(price);
    } catch (e: any) {
      console.error("Error fetching TON price:", e);
    } finally {
      setTonLoading(false);
    }
  };

  useEffect(() => {
    fetchTonPrice();
  }, []);

  const isLoading = authLoading || miningLoading;
  const tonBalance = 0;
  const tetherBalance = 0;
  const totalUsd = 0;

  if (!wallet?.account?.address) {
    return (
      <main className="safe-area pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-6">
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold mb-4">Connect TON Wallet</h2>
            <p className="text-muted-foreground mb-6">You need to connect a TON wallet to view the content</p>
            <TonConnectButton />
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="safe-area pb-24">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">TON Wallet</div>
            <div className="text-muted-foreground">
              {wallet.account.address.slice(0,6)}...{wallet.account.address.slice(-4)}
            </div>
          </div>
          <TonConnectButton />
        </div>

        {/* Total Balance */}
        <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
            <div className="text-4xl font-extrabold text-primary mb-2">
              {showBalance ? `$${totalUsd.toFixed(2)}` : '••••••'}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">No change</span>
            </div>
          </div>
        </Card>


        {/* Crypto Assets */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Digital Assets</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowBalance(!showBalance)}>
                {showBalance ? (
                  <>
                    <EyeOff className="w-4 h-4 ml-2" />
                    Hide Balance
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 ml-2" />
                    Show Balance
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              
              {/* VIRAL Token */}
              <div className="p-4 hover:bg-muted/30 transition-colors rounded-lg mx-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-1">
                      <ViralIcon size="lg" color="#ffffff" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">VIRAL</p>
                        <Badge variant="secondary" className="text-xs">$0.00</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isLoading ? (
                          <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                        ) : showBalance ? (
                          `${viralBalance.toFixed(4)} VIRAL`
                        ) : (
                          '••••••'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$0.00</p>
                    <span className="text-xs text-muted-foreground">No change</span>
                  </div>
                </div>
              </div>

              {/* TON Coin */}
              <div className="p-4 hover:bg-muted/30 transition-colors rounded-lg mx-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full">
                      <img 
                        src="https://api.voxelplay.app/assets/images/currency/ton.png" 
                        alt="TON" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">TON</p>
                        <Badge variant="secondary" className="text-xs">
                          {tonLoading ? (
                            <div className="w-12 h-3 bg-muted animate-pulse rounded" />
                          ) : tonPrice ? (
                            `$${tonPrice.toFixed(4)}`
                          ) : (
                            "..."
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {showBalance ? '0.0000 TON' : '••••••'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$0.00</p>
                    <span className="text-xs text-muted-foreground">No change</span>
                  </div>
                </div>
              </div>

              {/* USDT */}
              <div className="p-4 hover:bg-muted/30 transition-colors rounded-lg mx-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full">
                      <img 
                        src="https://www.joinhu4.io/checkout/_next/static/media/usdt.6d35925e.svg" 
                        alt="USDT" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">USDT</p>
                        <Badge variant="secondary" className="text-xs">$1.00</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {showBalance ? '0.0000 USDT' : '••••••'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$0.00</p>
                    <span className="text-xs text-muted-foreground">No change</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </main>
  );
};

const Wallet: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Wallet | VIRAL Wallet</title>
        <meta name="description" content="Manage your cryptocurrency wallet - VIRAL, TON, USDT with live prices" />
        <link rel="canonical" href="/wallet" />
      </Helmet>
      <WalletInner />
    </>
  );
};

export default Wallet;
