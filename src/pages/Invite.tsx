import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useBoltMining } from "@/hooks/useBoltMining";
import { useBoltReferrals } from "@/hooks/useBoltReferrals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Users, Gift, TrendingUp, Share2, ChevronRight, Sparkles } from "lucide-react";

const Invite: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser, loading: miningLoading, refreshUser } = useBoltMining(tgUser);
  const { referrals, stats, loading: friendsLoading, refreshReferrals } = useBoltReferrals(boltUser?.id);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showBonusDetails, setShowBonusDetails] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const referralCode = useMemo(() => {
    if (tgUser?.username) return tgUser.username;
    if (tgUser?.id) return tgUser.id.toString();
    return "guest";
  }, [tgUser]);
  
  const referralLink = useMemo(() => {
    return `https://t.me/Vlralbot?startapp=${encodeURIComponent(referralCode)}`;
  }, [referralCode]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied successfully" });
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      toast({ title: "Error", description: "Could not copy the link, please try again" });
    }
  };

  const handleShareViaTelegram = () => {
    const message = `🎯 Join me in BOLT mining and earn real tokens!

💎 Start mining now: ${referralLink}

🚀 What you will get:
• Free mining setup
• Earn tokens effortlessly
• Complete daily tasks for rewards
• Upgrade your mining power

🎁 Join thousands earning daily!`;

    const encodedMessage = encodeURIComponent(message);
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodedMessage}`;
    
    if ((window as any).Telegram?.WebApp?.openLink) {
      (window as any).Telegram.WebApp.openLink(telegramShareUrl);
    } else if ((window as any).Telegram?.WebApp) {
      (window as any).Telegram.WebApp.openTelegramLink?.(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
    
    toast({ title: "Shared!", description: "Opening Telegram to share" });
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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

      <div className="min-h-screen bg-background pb-32">
        <motion.div 
          className="max-w-md mx-auto px-4 py-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Friends</h1>
            <p className="text-muted-foreground">
              Earn BOLT for every friend who joins!
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total_referrals}</p>
              <p className="text-sm text-muted-foreground">Total Friends</p>
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.total_bonus.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">BOLT Earned</p>
            </div>
          </motion.div>

          {/* Bonus Info - Now Clickable */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 mb-6 overflow-hidden cursor-pointer"
            onClick={() => setShowBonusDetails(!showBonusDetails)}
            whileTap={{ scale: 0.98 }}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Referral Bonus</p>
                  <p className="text-sm text-muted-foreground">Tap to see details</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: showBonusDetails ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.div>
            </div>
            
            <AnimatePresence>
              {showBonusDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-primary/20"
                >
                  <div className="p-4 space-y-4">
                    {/* Current Bonus Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Your Referral Bonus</p>
                        <p className="text-xl font-bold text-primary">{boltUser?.referral_bonus || 0} BOLT</p>
                      </div>
                      <div className="p-3 rounded-xl bg-background/50">
                        <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
                        <p className="text-xl font-bold text-foreground">{boltUser?.total_referrals || 0}</p>
                      </div>
                    </div>
                    
                    {/* Bonus Tiers */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Referral Rewards
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-background/30">
                          <span className="text-muted-foreground">Per Friend</span>
                          <span className="text-primary font-medium">+100 BOLT</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-background/30">
                          <span className="text-muted-foreground">5 Friends Bonus</span>
                          <span className="text-primary font-medium">+500 BOLT</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-background/30">
                          <span className="text-muted-foreground">10 Friends Bonus</span>
                          <span className="text-primary font-medium">+1,500 BOLT</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Refresh Button */}
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshReferrals();
                        refreshUser?.();
                        toast({ title: "Refreshed!", description: "Referral data updated" });
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Refresh Data
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Friends List */}
          <motion.div 
            variants={itemVariants}
            className="rounded-2xl bg-card border border-border/50 overflow-hidden"
          >
            <div className="p-4 border-b border-border/50">
              <h2 className="font-semibold text-foreground">Friends List</h2>
            </div>
            
            <div className="p-4">
              {friendsLoading || miningLoading ? (
                <div className="text-center py-8">
                  <div className="simple-loader mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-1">No friends yet</p>
                  <p className="text-sm text-muted-foreground">Share the link and start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referrals.map((friend, index) => {
                    const name = friend.referred?.first_name || friend.referred?.telegram_username || `User${index + 1}`;
                    const initials = name.substring(0, 2).toUpperCase();
                    const earnings = getEarnings(index);
                    
                    return (
                      <motion.div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border-2 border-primary/20">
                            <AvatarImage src={friend.referred?.photo_url} alt={name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground font-medium">{name}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          +{friend.bonus_earned || earnings}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Share Buttons */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
          <div className="max-w-md mx-auto">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                onClick={handleShareViaTelegram}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 rounded-2xl text-lg gap-2"
                size="lg"
              >
                <Share2 className="w-5 h-5" />
                Share Link
              </Button>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={copyLink}
                  variant="outline"
                  size="lg"
                  className="h-14 w-14 p-0 rounded-2xl border-border/50 bg-card hover:bg-muted"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-primary" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invite;
