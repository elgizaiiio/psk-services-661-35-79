import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { 
  Coins,
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
  Loader2
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
  const { language, setLanguage, t } = useLanguage();
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  useTelegramBackButton();

  const [copiedId, setCopiedId] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  
  // Settings state
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

  // Apply dark mode
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
        <div className="max-w-md mx-auto px-4 pt-8 space-y-6">
          
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Avatar className="w-24 h-24 mx-auto ring-4 ring-primary/20 shadow-xl">
              <AvatarImage src={tgUser?.photo_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {tgUser?.first_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <h1 className="text-xl font-bold mt-4 text-foreground">
              {tgUser?.first_name} {tgUser?.last_name}
            </h1>
            
            {tgUser?.username && (
              <p className="text-muted-foreground text-sm">@{tgUser.username}</p>
            )}
            
            <button 
              onClick={handleCopyId}
              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              ID: {tgUser?.id}
              {copiedId ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            
            <p className="text-xs text-muted-foreground mt-2">
              Joined {vmUser ? formatDistanceToNow(new Date(vmUser.created_at), { addSuffix: true }) : 'recently'}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BoltIcon size={16} />
                </div>
                <span className="text-xs text-muted-foreground">Balance</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {vmUser?.token_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <UsdtIcon size={16} />
                </div>
                <span className="text-xs text-muted-foreground">USDT</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                ${(vmUser as any)?.usdt_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground">Power</span>
              </div>
              <p className="text-lg font-bold text-foreground">×{vmUser?.mining_power || 1}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground">Duration</span>
              </div>
              <p className="text-lg font-bold text-foreground">{vmUser?.mining_duration_hours || 4}h</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-xs text-muted-foreground">Referrals</span>
              </div>
              <p className="text-lg font-bold text-foreground">{vmUser?.total_referrals || 0}</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground">Tasks</span>
              </div>
              <p className="text-lg font-bold text-foreground">{totalTasksCompleted}</p>
            </div>
          </motion.div>

          {/* Settings Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <h2 className="text-sm font-medium text-muted-foreground px-1">Settings</h2>
            
            <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
              {/* Dark Mode */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  </div>
                  <span className="font-medium text-foreground">Dark Mode</span>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
              </div>
              
              {/* Sound */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <span className="font-medium text-foreground">Sound</span>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
              </div>
              
              {/* Notifications */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Notifications</span>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
              </div>
              
              {/* Language */}
              <button 
                onClick={() => setShowLanguages(!showLanguages)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium text-foreground">Language</span>
                    <p className="text-xs text-muted-foreground">{currentLang.flag} {currentLang.nativeName}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showLanguages ? 'rotate-90' : ''}`} />
              </button>
              
              {showLanguages && (
                <div className="p-2 bg-muted/20">
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
                        <span className="text-lg">{langInfo.flag}</span>
                        <span className="text-sm font-medium">{langInfo.nativeName}</span>
                      </span>
                      {language === langCode && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
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
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Share App</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium text-foreground">Help & Support</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </motion.div>

          {/* App Version */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-xs text-muted-foreground pt-4"
          >
            BOLT Mining v1.0.0
          </motion.p>
        </div>
      </div>
    </>
  );
};

export default Profile;
