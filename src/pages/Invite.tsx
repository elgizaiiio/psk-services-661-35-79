import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useBoltMining } from "@/hooks/useBoltMining";
import { useBoltReferrals } from "@/hooks/useBoltReferrals";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Copy, Check, Users, Share2 } from "lucide-react";

const Invite: React.FC = () => {
  const { user: tgUser } = useTelegramAuth();
  const { user: boltUser, loading: miningLoading } = useBoltMining(tgUser);
  const { referrals, stats, loading: friendsLoading } = useBoltReferrals(boltUser?.id);
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

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
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      toast({ title: "Error", description: "Could not copy the link" });
    }
  };

  const handleShare = () => {
    const message = `Join me in BOLT mining!\n\n${referralLink}`;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
    
    if ((window as any).Telegram?.WebApp?.openLink) {
      (window as any).Telegram.WebApp.openLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  const isLoading = friendsLoading || miningLoading;

  return (
    <>
      <Helmet>
        <title>Invite Friends</title>
        <meta name="description" content="Invite friends and earn BOLT" />
      </Helmet>

      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-5 pt-8 space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-xl font-semibold text-foreground">Invite Friends</h1>
            <p className="text-sm text-muted-foreground">Earn BOLT for every friend who joins</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Friends</p>
              <p className="text-2xl font-bold text-foreground">{stats.total_referrals}</p>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="text-xs text-muted-foreground mb-1">Earned</p>
              <p className="text-2xl font-bold text-primary">{stats.total_bonus.toFixed(0)}</p>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="font-medium text-foreground mb-3">Rewards</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Per Friend</span>
                <span className="text-primary font-medium">+100 BOLT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">5 Friends Bonus</span>
                <span className="text-primary font-medium">+500 BOLT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">10 Friends Bonus</span>
                <span className="text-primary font-medium">+1,500 BOLT</span>
              </div>
            </div>
          </div>

          {/* Friends List */}
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <p className="font-medium text-foreground">Friends</p>
            </div>
            
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="simple-loader" />
                </div>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">No friends yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Share the link to start earning</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((friend, index) => {
                    const name = friend.referred?.first_name || friend.referred?.telegram_username || `User${index + 1}`;
                    const initials = name.substring(0, 2).toUpperCase();
                    
                    return (
                      <div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={friend.referred?.photo_url} alt={name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-foreground">{name}</span>
                        </div>
                        <span className="text-sm text-primary font-medium">
                          +{friend.bonus_earned || 100}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent">
          <div className="max-w-md mx-auto flex gap-3">
            <Button 
              onClick={handleShare}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
            <Button 
              onClick={copyLink}
              variant="outline"
              className="h-12 w-12 p-0 rounded-xl border-border"
            >
              {copied ? (
                <Check className="w-5 h-5 text-primary" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Invite;
