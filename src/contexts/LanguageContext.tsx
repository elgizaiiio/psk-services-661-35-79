import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.english': 'English',
    'settings.arabic': 'العربية',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.about': 'About',
    'settings.version': 'Version',
    'settings.languageChanged': 'Language changed successfully',
    
    // Navigation
    'nav.home': 'Home',
    'nav.mining': 'Mining',
    'nav.tasks': 'Tasks',
    'nav.friends': 'Friends',
    'nav.wallet': 'Wallet',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
  },
  ar: {
    // Settings
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.english': 'English',
    'settings.arabic': 'العربية',
    'settings.theme': 'المظهر',
    'settings.notifications': 'الإشعارات',
    'settings.about': 'حول التطبيق',
    'settings.version': 'الإصدار',
    'settings.languageChanged': 'تم تغيير اللغة بنجاح',
    
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.mining': 'التعدين',
    'nav.tasks': 'المهام',
    'nav.friends': 'الأصدقاء',
    'nav.wallet': 'المحفظة',
    
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجاح',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.back': 'رجوع',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
