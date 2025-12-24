import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Globe, 
  ChevronRight, 
  Info, 
  Bell, 
  Palette, 
  Check,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Sun,
  Shield,
  Trash2,
  Share2,
  Star,
  HelpCircle,
  LogOut,
  Smartphone,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useLanguage, languageNames } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Language = 'en' | 'ru';

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // Settings state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('sound-enabled') !== 'false';
  });
  const [vibrationEnabled, setVibrationEnabled] = useState(() => {
    return localStorage.getItem('vibration-enabled') !== 'false';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('notifications-enabled') !== 'false';
  });
  const [hideBalance, setHideBalance] = useState(() => {
    return localStorage.getItem('hide-balance') === 'true';
  });
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showLanguageSection, setShowLanguageSection] = useState(false);

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

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast.success(t('settings.languageChanged'));
    setShowLanguageSection(false);
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('sound-enabled', String(enabled));
    toast.success(enabled ? 'Sound enabled' : 'Sound disabled');
  };

  const handleVibrationToggle = (enabled: boolean) => {
    setVibrationEnabled(enabled);
    localStorage.setItem('vibration-enabled', String(enabled));
    if (enabled && navigator.vibrate) {
      navigator.vibrate(50);
    }
    toast.success(enabled ? 'Vibration enabled' : 'Vibration disabled');
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notifications-enabled', String(enabled));
    toast.success(enabled ? 'Notifications enabled' : 'Notifications disabled');
  };

  const handleHideBalanceToggle = (enabled: boolean) => {
    setHideBalance(enabled);
    localStorage.setItem('hide-balance', String(enabled));
    toast.success(enabled ? 'Balance hidden' : 'Balance visible');
  };

  const handleClearCache = () => {
    // Clear specific app data, not language preference
    const language = localStorage.getItem('app-language');
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (language) localStorage.setItem('app-language', language);
    if (theme) localStorage.setItem('theme', theme);
    setShowClearDataDialog(false);
    toast.success('Cache cleared successfully');
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Bolt Mining',
      text: 'Join me on Bolt Mining and start earning BOLT tokens!',
      url: window.location.origin
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success('Link copied to clipboard!');
    }
  };

  const languages = Object.entries(languageNames) as [Language, { name: string; nativeName: string; flag: string }][];
  const currentLang = languageNames[language];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <div className="relative px-4 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
              <p className="text-sm text-muted-foreground">Customize your experience</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Settings List */}
      <div className="px-4 space-y-4">
        
        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</p>
          </div>
          
          {/* Language */}
          <button 
            onClick={() => setShowLanguageSection(!showLanguageSection)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">{t('settings.language')}</span>
                <p className="text-xs text-muted-foreground">{currentLang.flag} {currentLang.nativeName}</p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showLanguageSection ? 'rotate-90' : ''}`} />
          </button>

          {/* Language Options */}
          {showLanguageSection && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border/30"
            >
              <ScrollArea className="h-[250px]">
                <div className="p-2">
                  {languages.map(([langCode, langInfo]) => (
                    <button
                      key={langCode}
                      onClick={() => handleLanguageChange(langCode)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                        language === langCode 
                          ? 'bg-primary/20 text-primary' 
                          : 'hover:bg-muted/50 text-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{langInfo.flag}</span>
                        <div className="text-left">
                          <p className="font-medium text-sm">{langInfo.nativeName}</p>
                          <p className="text-xs text-muted-foreground">{langInfo.name}</p>
                        </div>
                      </span>
                      {language === langCode && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                {isDarkMode ? <Moon className="w-5 h-5 text-purple-500" /> : <Sun className="w-5 h-5 text-purple-500" />}
              </div>
              <div>
                <span className="font-medium text-foreground">{t('settings.theme')}</span>
                <p className="text-xs text-muted-foreground">{isDarkMode ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          </div>
        </motion.div>

        {/* Sound & Feedback Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sound & Feedback</p>
          </div>
          
          {/* Sound */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-green-500" /> : <VolumeX className="w-5 h-5 text-green-500" />}
              </div>
              <div>
                <span className="font-medium text-foreground">Sound Effects</span>
                <p className="text-xs text-muted-foreground">Play sounds for actions</p>
              </div>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={handleSoundToggle} />
          </div>

          {/* Vibration */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Vibrate className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <span className="font-medium text-foreground">Vibration</span>
                <p className="text-xs text-muted-foreground">Haptic feedback</p>
              </div>
            </div>
            <Switch checked={vibrationEnabled} onCheckedChange={handleVibrationToggle} />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <span className="font-medium text-foreground">{t('settings.notifications')}</span>
                <p className="text-xs text-muted-foreground">Push notifications</p>
              </div>
            </div>
            <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsToggle} />
          </div>
        </motion.div>

        {/* Privacy & Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Privacy & Security</p>
          </div>
          
          {/* Hide Balance */}
          <div className="flex items-center justify-between p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                {hideBalance ? <EyeOff className="w-5 h-5 text-cyan-500" /> : <Eye className="w-5 h-5 text-cyan-500" />}
              </div>
              <div>
                <span className="font-medium text-foreground">Hide Balance</span>
                <p className="text-xs text-muted-foreground">Hide your balance on home</p>
              </div>
            </div>
            <Switch checked={hideBalance} onCheckedChange={handleHideBalanceToggle} />
          </div>

          {/* Security */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Security</span>
                <p className="text-xs text-muted-foreground">PIN & biometric lock</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Data & Storage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data & Storage</p>
          </div>
          
          {/* Clear Cache */}
          <button 
            onClick={() => setShowClearDataDialog(true)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Clear Cache</span>
                <p className="text-xs text-muted-foreground">Free up storage space</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Refresh Data */}
          <button 
            onClick={() => {
              window.location.reload();
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-teal-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Refresh Data</span>
                <p className="text-xs text-muted-foreground">Sync with server</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">About</p>
          </div>
          
          {/* Share App */}
          <button 
            onClick={handleShare}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-pink-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Share App</span>
                <p className="text-xs text-muted-foreground">Invite your friends</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Rate App */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Rate Us</span>
                <p className="text-xs text-muted-foreground">Leave a review</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Help */}
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-sky-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">Help & Support</span>
                <p className="text-xs text-muted-foreground">Get help or report issues</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* App Info */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-left">
                <span className="font-medium text-foreground">{t('settings.about')}</span>
                <p className="text-xs text-muted-foreground">Bolt Mining v1.0.0</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">Build 2024</span>
          </div>
        </motion.div>

        {/* Version Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Made with ❤️ by Bolt Team</p>
          <p className="text-xs text-muted-foreground mt-1">Version 1.0.0</p>
        </div>

      </div>

      {/* Clear Data Dialog */}
      <Dialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear Cache?</DialogTitle>
            <DialogDescription>
              This will clear all cached data. Your account and balance will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearDataDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearCache}>
              Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
