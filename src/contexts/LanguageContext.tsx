import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar' | 'es' | 'fr' | 'de' | 'ru' | 'zh' | 'ja' | 'ko' | 'pt' | 'tr' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export const languageNames: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.about': 'About',
    'settings.languageChanged': 'Language changed successfully',
    'settings.selectLanguage': 'Select Language',
  },
  ar: {
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.notifications': 'الإشعارات',
    'settings.about': 'حول التطبيق',
    'settings.languageChanged': 'تم تغيير اللغة بنجاح',
    'settings.selectLanguage': 'اختر اللغة',
  },
  es: {
    'settings.title': 'Configuración',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.notifications': 'Notificaciones',
    'settings.about': 'Acerca de',
    'settings.languageChanged': 'Idioma cambiado con éxito',
    'settings.selectLanguage': 'Seleccionar idioma',
  },
  fr: {
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.notifications': 'Notifications',
    'settings.about': 'À propos',
    'settings.languageChanged': 'Langue changée avec succès',
    'settings.selectLanguage': 'Choisir la langue',
  },
  de: {
    'settings.title': 'Einstellungen',
    'settings.language': 'Sprache',
    'settings.theme': 'Thema',
    'settings.notifications': 'Benachrichtigungen',
    'settings.about': 'Über',
    'settings.languageChanged': 'Sprache erfolgreich geändert',
    'settings.selectLanguage': 'Sprache auswählen',
  },
  ru: {
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.notifications': 'Уведомления',
    'settings.about': 'О приложении',
    'settings.languageChanged': 'Язык успешно изменён',
    'settings.selectLanguage': 'Выберите язык',
  },
  zh: {
    'settings.title': '设置',
    'settings.language': '语言',
    'settings.theme': '主题',
    'settings.notifications': '通知',
    'settings.about': '关于',
    'settings.languageChanged': '语言更改成功',
    'settings.selectLanguage': '选择语言',
  },
  ja: {
    'settings.title': '設定',
    'settings.language': '言語',
    'settings.theme': 'テーマ',
    'settings.notifications': '通知',
    'settings.about': 'について',
    'settings.languageChanged': '言語が正常に変更されました',
    'settings.selectLanguage': '言語を選択',
  },
  ko: {
    'settings.title': '설정',
    'settings.language': '언어',
    'settings.theme': '테마',
    'settings.notifications': '알림',
    'settings.about': '정보',
    'settings.languageChanged': '언어가 성공적으로 변경되었습니다',
    'settings.selectLanguage': '언어 선택',
  },
  pt: {
    'settings.title': 'Configurações',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.notifications': 'Notificações',
    'settings.about': 'Sobre',
    'settings.languageChanged': 'Idioma alterado com sucesso',
    'settings.selectLanguage': 'Selecionar idioma',
  },
  tr: {
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.theme': 'Tema',
    'settings.notifications': 'Bildirimler',
    'settings.about': 'Hakkında',
    'settings.languageChanged': 'Dil başarıyla değiştirildi',
    'settings.selectLanguage': 'Dil seçin',
  },
  hi: {
    'settings.title': 'सेटिंग्स',
    'settings.language': 'भाषा',
    'settings.theme': 'थीम',
    'settings.notifications': 'सूचनाएं',
    'settings.about': 'के बारे में',
    'settings.languageChanged': 'भाषा सफलतापूर्वक बदल दी गई',
    'settings.selectLanguage': 'भाषा चुनें',
  },
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
