import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useBoltMining } from "@/hooks/useBoltMining";
import { useBoltReferrals } from "@/hooks/useBoltReferrals";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Users, Share2, Loader2 } from "lucide-react";
import { PageWrapper, StaggerContainer, FadeUp, AnimatedNumber } from '@/components/ui/motion-wrapper';
import { ContestBanner } from '@/components/contest/ContestBanner';

const Invite: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser, loading: miningLoading } = useBoltMining(tgUser);
  const { referrals, stats, loading: friendsLoading } = useBoltReferrals(boltUser?.id);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  useTelegramBackButton();

  const referralCode = useMemo(() => tgUser?.username || tgUser?.id?.toString() || "guest", [tgUser]);
  const referralLink = useMemo(() => `https://t.me/boltrsbot?start=${encodeURIComponent(referralCode)}`, [referralCode]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(referralLink); setCopied(true); toast({ title: "Link copied!" }); setTimeout(() => setCopied(false), 1500); } catch { toast({ title: "Error" }); }
  };

  const handleShare = () => {
    const message = `Join me in BOLT mining!\n\n${referralLink}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
    if ((window as any).Telegram?.WebApp?.openLink) { (window as any).Telegram.WebApp.openLink(telegramShareUrl); } else { window.open(telegramShareUrl, '_blank'); }
  };

  const isLoading = friendsLoading || miningLoading;

  return (
    <PageWrapper className="min-h-screen bg-background pb-44">
      <Helmet><title>Invite Friends</title></Helmet>
      <div className="max-w-md mx-auto px-5 pt-16">
        <StaggerContainer className="space-y-6">
          <FadeUp><ContestBanner userId={boltUser?.id} /></FadeUp>
          <FadeUp><h1 className="text-xl font-semibold text-foreground">Invite Friends</h1><p className="text-sm text-muted-foreground">Earn BOLT for every friend who joins</p></FadeUp>

          <div className="grid grid-cols-2 gap-4">
            <FadeUp><motion.div className="p-4 rounded-xl bg-card border border-border" whileHover={{ y: -2 }}><p className="text-xs text-muted-foreground mb-1">Friends</p><p className="text-2xl font-bold text-foreground"><AnimatedNumber value={boltUser?.total_referrals || 0} duration={0.8} /></p></motion.div></FadeUp>
            <FadeUp><motion.div className="p-4 rounded-xl bg-card border border-border" whileHover={{ y: -2 }}><p className="text-xs text-muted-foreground mb-1">Earned</p><p className="text-2xl font-bold text-primary"><AnimatedNumber value={boltUser?.referral_bonus || 0} decimals={0} duration={0.8} /></p></motion.div></FadeUp>
          </div>

          <FadeUp>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="font-medium text-foreground mb-3">Rewards</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Per Friend</span><span className="text-primary font-medium">+100 BOLT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">5 Friends Bonus</span><span className="text-primary font-medium">+500 BOLT</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">10 Friends Bonus</span><span className="text-primary font-medium">+1,500 BOLT</span></div>
              </div>
            </div>
          </FadeUp>

          <FadeUp>
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border"><p className="font-medium text-foreground">Friends</p></div>
              <div className="p-4">
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8"><div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3"><Users className="w-6 h-6 text-muted-foreground" /></div><p className="text-sm text-muted-foreground">No friends yet</p></div>
                ) : (
                  <AnimatePresence>
                    {referrals.map((friend, index) => {
                      const name = friend.referred?.first_name || friend.referred?.telegram_username || `User${index + 1}`;
                      return (
                        <motion.div key={friend.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 mb-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={friend.referred?.photo_url} alt={name} /><AvatarFallback className="bg-primary/10 text-primary text-sm">{name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                            <span className="text-sm font-medium text-foreground">{name}</span>
                          </div>
                          <span className="text-sm text-primary font-medium">+{friend.bonus_earned || 100}</span>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </FadeUp>
        </StaggerContainer>
      </div>

      <motion.div className="fixed bottom-20 left-0 right-0 p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <div className="max-w-md mx-auto flex gap-3">
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}><Button onClick={handleShare} className="w-full h-12 font-medium rounded-xl"><Share2 className="w-4 h-4 mr-2" />Share Link</Button></motion.div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button onClick={copyLink} variant="outline" className="h-12 w-12 p-0 rounded-xl">
              <AnimatePresence mode="wait">{copied ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-5 h-5 text-primary" /></motion.div> : <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-5 h-5" /></motion.div>}</AnimatePresence>
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </PageWrapper>
  );
};

export default Invite;