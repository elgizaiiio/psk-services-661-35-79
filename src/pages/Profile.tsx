import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  Zap,
  Clock,
  Users,
  Target,
  Moon,
  Sun,
  Globe,
  Bell,
  Volume2,
  VolumeX,
  Share2,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  Crown
} from "lucide-react";
import { useTelegramAuth } from "@/hooks/useTelegramAuth";
import { useViralMining } from "@/hooks/useViralMining";
import { useTasks } from "@/hooks/useTasks";
import { useTelegramBackButton } from "@/hooks/useTelegramBackButton";
import { useLanguage, languageNames } from "@/contexts/LanguageContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { BoltIcon, UsdtIcon } from "@/components/ui/currency-icons";

type Language = 'en' | 'ru';

const Profile: React.FC = () => {
  const { user: tgUser, hapticFeedback } = useTelegramAuth();
  const { user: vmUser, loading: miningLoading } = useViralMining(tgUser);
  const { completedTasks, loading: tasksLoading } = useTasks();
  const { language, setLanguage } = useLanguage();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  useTelegramBackButton();

  const [copiedId, setCopiedId] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sound-enabled') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('sound-enabled', String(enabled));
    hapticFeedback?.impact?.('light');
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notifications-enabled', String(enabled));
    hapticFeedback?.impact?.('light');
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setShowLanguages(false);
    hapticFeedback?.impact?.('light');
    toast.success('Language updated');
  };

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
    const botUsername = 'BoltMiningBot';
    const shareUrl = `https://t.me/${botUsername}`;
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
        toast.success('Link copied!');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    }
  };

  const totalTasksCompleted = completedTasks.length;
  const languages = Object.entries(languageNames) as [Language, { name: string; nativeName: string; flag: string }][];
  const currentLang = languageNames[language];

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
        <div className="max-w-md mx-auto px-4 pt-6 space-y-5">
          
          {/* Hero Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-background border border-primary/20 p-6"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 ring-4 ring-primary/30 shadow-2xl">
                  <AvatarImage src={tgUser?.photo_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                    {tgUser?.first_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-foreground truncate">
                  {tgUser?.first_name} {tgUser?.last_name}
                </h1>
                
                {tgUser?.username && (
                  <p className="text-primary text-sm font-medium">@{tgUser.username}</p>
                )}
                
                <p className="text-xs text-muted-foreground mt-1">
                  Joined {vmUser ? formatDistanceToNow(new Date(vmUser.created_at), { addSuffix: true }) : 'recently'}
                </p>
                
                <button 
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-xs text-muted-foreground hover:bg-background transition-colors border border-border/50"
                >
                  ID: {tgUser?.id}
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-5 shadow-lg"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 text-sm font-medium">Total Balance</span>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-foreground">
                  {vmUser?.token_balance?.toFixed(2) || '0.00'}
                </span>
                <span className="text-primary-foreground/70 font-medium">BOLT</span>
              </div>
              
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/20">
                <UsdtIcon size={16} />
                <span className="text-primary-foreground/90 text-sm">
                  ${(vmUser as any)?.usdt_balance?.toFixed(2) || '0.00'} USDT
                </span>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-4 rounded-2xl bg-card border border-border hover:border-amber-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Mining Power</p>
              <p className="text-xl font-bold text-foreground">×{vmUser?.mining_power || 1}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border hover:border-blue-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="text-xl font-bold text-foreground">{vmUser?.mining_duration_hours || 4}h</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Referrals</p>
              <p className="text-xl font-bold text-foreground">{vmUser?.total_referrals || 0}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/30 transition-colors group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">Tasks Done</p>
              <p className="text-xl font-bold text-foreground">{totalTasksCompleted}</p>
            </div>
          </motion.div>

          {/* Earnings Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-2xl bg-card border border-border"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Referral Bonus</h3>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Total earned from referrals</span>
              <div className="flex items-center gap-1.5">
                <BoltIcon size={16} />
                <span className="font-bold text-primary">{vmUser?.referral_bonus?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </motion.div>

          {/* Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">Settings</h2>
            
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                    {isDarkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Dark Mode</span>
                    <p className="text-xs text-muted-foreground">{isDarkMode ? 'On' : 'Off'}</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              </div>
              
              {/* Sound */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Sound Effects</span>
                    <p className="text-xs text-muted-foreground">{soundEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>
              
              {/* Notifications */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Notifications</span>
                    <p className="text-xs text-muted-foreground">{notificationsEnabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
              </div>
              
              {/* Language */}
              <button 
                onClick={() => setShowLanguages(!showLanguages)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-foreground">Language</span>
                    <p className="text-xs text-muted-foreground">{currentLang.flag} {currentLang.nativeName}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${showLanguages ? 'rotate-90' : ''}`} />
              </button>
              
              {showLanguages && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-2 bg-muted/20"
                >
                  {languages.map(([langCode, langInfo]) => (
                    <button
                      key={langCode}
                      onClick={() => handleLanguageChange(langCode)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        language === langCode 
                          ? 'bg-primary/20 text-primary' 
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{langInfo.flag}</span>
                        <span className="text-sm font-medium">{langInfo.nativeName}</span>
                      </span>
                      {language === langCode && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {/* Share */}
              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-foreground">Share App</span>
                    <p className="text-xs text-muted-foreground">Invite friends & earn rewards</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
              
              {/* Help */}
              <button 
                onClick={() => {
                  const tg = (window as any).Telegram?.WebApp;
                  if (tg?.openTelegramLink) {
                    tg.openTelegramLink('https://t.me/boltcomm');
                  } else {
                    window.open('https://t.me/boltcomm', '_blank');
                  }
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-foreground">Help & Support</span>
                    <p className="text-xs text-muted-foreground">Get help from our team</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* App Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
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