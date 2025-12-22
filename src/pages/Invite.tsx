import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useBoltMining } from "@/hooks/useBoltMining";
import { useBoltReferrals } from "@/hooks/useBoltReferrals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Users } from "lucide-react";

const Invite: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser, loading: miningLoading } = useBoltMining(tgUser);
  const { referrals, stats, loading: friendsLoading } = useBoltReferrals(boltUser?.id);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const referralCode = useMemo(() => {
    if (tgUser?.username) return tgUser.username;
    if (tgUser?.id) return tgUser.id.toString();
    return "guest";
  }, [tgUser]);
  
  const referralLink = useMemo(() => {
    console.log('🔗 Creating referral link with code:', referralCode);
    return `https://t.me/Vlralbot?startapp=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Copied", description: "Invitation link copied successfully" });
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      toast({ title: "Error", description: "Cannot copy link, try again" });
    }
  };

  const handleShareViaTelegram = () => {
    const message = `🎯 Join me in mining BOLT and earn real cryptocurrency!

💎 Start mining BOLT tokens now: ${referralLink}

🚀 What you'll get:
• Free mining setup
• Earn tokens while idle
• Complete daily tasks for rewards  
• Upgrade your mining power

🎁 Join thousands earning real crypto daily!
⚡ Click the link and start mining now!`;

    const encodedMessage = encodeURIComponent(message);
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodedMessage}`;
    
    if ((window as any).Telegram?.WebApp?.openLink) {
      (window as any).Telegram.WebApp.openLink(telegramShareUrl);
    } else if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink?.(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
    
    toast({ title: "Shared!", description: "Opening Telegram to share your invitation" });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Invite Friends",
    description: "Invite your friends through a unique link and get rewards for every successful referral.",
    url: currentUrl,
  };

  const getEarnings = (index: number) => {
    const baseEarning = 0.07;
    const variation = Math.random() * 0.03;
    return (baseEarning + variation).toFixed(2);
  };

  return (
    <>
      <Helmet>
        <title>Invite Friends | Earn Referral Rewards</title>
        <meta name="description" content="Invite your friends through a unique link and get rewards for every successful referral." />
        <meta property="og:title" content="Invite Friends | Earn Referral Rewards" />
        <meta property="og:description" content="Invite your friends through a unique link and get rewards for every successful referral." />
        <meta property="og:url" content={currentUrl} />
        <link rel="canonical" href={currentUrl} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="safe-area pb-24 min-h-screen bg-background">
        <div className="max-w-md mx-auto px-4 py-6">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">Friends</h1>
            <p className="text-muted-foreground text-lg">
              Get BOLT for every server rental by your friends!
            </p>
          </div>

          {/* Stats Card */}
          <Card className="bg-card border-border rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total_referrals}</p>
                <p className="text-sm text-muted-foreground">Total Friends</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.total_bonus.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">BOLT Earned</p>
              </div>
            </div>
          </Card>

          {/* Friends Level Card */}
          <Card className="bg-card border-border rounded-2xl p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground mb-2">Friends</h2>
            </div>
            
            <div className="border-t border-border pt-4">
              {friendsLoading || miningLoading ? (
                <div className="text-center py-6">
                  <div className="simple-loader mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No friends invited yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((friend, index) => {
                    const name = friend.referred?.first_name || friend.referred?.telegram_username || `User${index + 1}`;
                    const initials = name.substring(0, 2).toUpperCase();
                    const earnings = getEarnings(index);
                    
                    return (
                      <div key={friend.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 bg-primary/20">
                            <AvatarImage src={friend.referred?.photo_url} alt={name} />
                            <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground font-medium">{name}</span>
                        </div>
                        <div className="text-primary text-sm font-medium">
                          + {friend.bonus_earned || earnings} BOLT
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          {/* Share Link Button */}
          <div className="fixed bottom-20 left-0 right-0 p-4">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleShareViaTelegram}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-2xl text-lg"
                  size="lg"
                >
                  Share Link
                </Button>
                <Button 
                  onClick={copyLink}
                  variant="outline"
                  size="lg"
                  className="px-4 py-4 rounded-2xl border-border bg-card hover:bg-muted"
                  title="Copy Link"
                >
                  {copied ? <Check className="h-5 w-5 text-primary" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Invite;
