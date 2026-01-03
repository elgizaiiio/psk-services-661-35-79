import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTasks } from "@/hooks/useTasks";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const Profile: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user: vmUser, loading: miningLoading } = useViralMining(tgUser);
  const { completedTasks, loading: tasksLoading } = useTasks();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  useTelegramBackButton();

  const [copiedId, setCopiedId] = useState(false);

  const handleCopyId = async () => {
    if (tgUser?.id) {
      await navigator.clipboard.writeText(String(tgUser.id));
      setCopiedId(true);
      hapticFeedback?.notification?.('success');
      toast.success('ID copied!');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleShare = async () => {
    const botUsername = 'Boltminingbot';
    const referralCode = vmUser?.id || tgUser?.id || '';
    const shareUrl = `https://t.me/${botUsername}?start=${referralCode}`;
    const shareText = 'Join me on Bolt Mining and start earning BOLT tokens! 🚀';
    
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg?.openTelegramLink) {
      const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      tg.openTelegramLink(telegramShareUrl);
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bolt Mining',
          text: shareText,
          url: shareUrl
        });
      } catch {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Referral link copied!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Referral link copied!');
    }
    
    hapticFeedback?.impact?.('medium');
  };

  const handleOpenCommunity = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink('https://t.me/boltcomm');
    } else {
      window.open('https://t.me/boltcomm', '_blank');
    }
    hapticFeedback?.impact?.('light');
  };

  const totalTasksCompleted = completedTasks.length;

  if (miningLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="mt-3 text-sm text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile | BOLT Mining</title>
        <meta name="description" content="View your BOLT mining profile and settings." />
        <link rel="canonical" href={currentUrl} />
      </Helmet>

      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-16 space-y-6">
          
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-xl mb-4">
              <AvatarImage src={tgUser?.photo_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {tgUser?.first_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-2xl font-bold text-foreground">
              {tgUser?.first_name} {tgUser?.last_name}
            </h1>
            
            {tgUser?.username && (
              <p className="text-primary text-sm font-medium mt-1">@{tgUser.username}</p>
            )}
            
            <p className="text-xs text-muted-foreground mt-2">
              Joined {vmUser ? formatDistanceToNow(new Date(vmUser.created_at), { addSuffix: true }) : 'recently'}
            </p>
            
            <button 
              onClick={handleCopyId}
              className="mt-3 px-4 py-2 rounded-full bg-muted text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              {copiedId ? 'Copied!' : `ID: ${tgUser?.id}`}
            </button>
          </motion.div>

          {/* Balance Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6"
          >
            <p className="text-sm text-muted-foreground text-center mb-2">Total Balance</p>
            <p className="text-4xl font-bold text-center text-foreground">
              {vmUser?.token_balance?.toFixed(2) || '0.00'}
              <span className="text-lg font-medium text-muted-foreground ml-2">BOLT</span>
            </p>
            <div className="flex justify-center mt-3 pt-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                ${(vmUser as any)?.usdt_balance?.toFixed(2) || '0.00'} USDT
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="p-5 rounded-2xl bg-card border border-border text-center">
              <p className="text-3xl font-bold text-foreground">×{vmUser?.mining_power || 1}</p>
              <p className="text-xs text-muted-foreground mt-1">Mining Power</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-card border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{vmUser?.mining_duration_hours || 4}h</p>
              <p className="text-xs text-muted-foreground mt-1">Duration</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-card border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{vmUser?.total_referrals || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Referrals</p>
            </div>
            
            <div className="p-5 rounded-2xl bg-card border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">Tasks Done</p>
            </div>
          </motion.div>

          {/* Referral Bonus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Referral Bonus</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {vmUser?.referral_bonus?.toFixed(2) || '0.00'} BOLT
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <button 
              onClick={handleShare}
              className="w-full p-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-center hover:bg-primary/90 transition-colors"
            >
              Share Referral Link
            </button>
            
            <button 
              onClick={handleOpenCommunity}
              className="w-full p-4 rounded-2xl bg-card border border-border text-foreground font-medium text-center hover:bg-muted/50 transition-colors"
            >
              Join Community
            </button>
          </motion.div>

          {/* App Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-muted-foreground py-4"
          >
            BOLT Mining v1.0.0
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default Profile;
