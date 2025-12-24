import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Globe, ChevronRight, Info, Bell, Palette, Check } from 'lucide-react';
import { useLanguage, languageNames } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

type Language = 'en' | 'ar' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'ja' | 'ko' | 'pt' | 'tr' | 'hi';

const Settings = () => {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast.success(t('settings.languageChanged'));
  };

  const languages = Object.entries(languageNames) as [Language, { name: string; nativeName: string; flag: string }][];

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
        {/* Language Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <span className="font-medium text-foreground">{t('settings.language')}</span>
                <p className="text-xs text-muted-foreground">{t('settings.selectLanguage')}</p>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[320px]">
            <div className="p-2">
              {languages.map(([langCode, langInfo]) => (
                <motion.button
                  key={langCode}
                  onClick={() => handleLanguageChange(langCode)}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all mb-1 ${
                    language === langCode 
                      ? 'bg-primary/20 text-primary' 
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{langInfo.flag}</span>
                    <div className="text-left">
                      <p className="font-medium">{langInfo.nativeName}</p>
                      <p className="text-xs text-muted-foreground">{langInfo.name}</p>
                    </div>
                  </span>
                  {language === langCode && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Other Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border/50 overflow-hidden"
        >
          <SettingItem
            icon={<Bell className="w-5 h-5 text-orange-500" />}
            iconBg="bg-orange-500/20"
            label={t('settings.notifications')}
          />
          <SettingItem
            icon={<Palette className="w-5 h-5 text-purple-500" />}
            iconBg="bg-purple-500/20"
            label={t('settings.theme')}
          />
          <SettingItem
            icon={<Info className="w-5 h-5 text-green-500" />}
            iconBg="bg-green-500/20"
            label={t('settings.about')}
            value="v1.0.0"
            isLast
          />
        </motion.div>
      </div>
    </div>
  );
};

interface SettingItemProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  isLast?: boolean;
}

const SettingItem = ({ icon, iconBg, label, value, isLast }: SettingItemProps) => (
  <button 
    className={`w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors ${
      !isLast ? 'border-b border-border/30' : ''
    }`}
  >
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <span className="font-medium text-foreground">{label}</span>
    </div>
    <div className="flex items-center gap-2 text-muted-foreground">
      {value && <span className="text-sm">{value}</span>}
      <ChevronRight className="w-5 h-5" />
    </div>
  </button>
);

export default Settings;
