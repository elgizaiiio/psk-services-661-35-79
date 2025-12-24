import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

export const languageNames: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
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
    // Mining Characters
    'mining.characters': 'Mining Characters',
    'mining.myCharacters': 'My Characters',
    'mining.allCharacters': 'All Characters',
    'mining.speed': 'Mining Speed',
    'mining.boost': 'Boost',
    'mining.extraCoins': 'Extra Coins',
    'mining.jackpotBonus': 'Jackpot Bonus',
    'mining.buy': 'Buy',
    'mining.activate': 'Activate',
    'mining.active': 'Active',
    'mining.owned': 'Owned',
    'mining.level': 'Level',
    // Challenges
    'challenges.title': 'Challenges',
    'challenges.daily': 'Daily',
    'challenges.weekly': 'Weekly',
    'challenges.special': 'Special',
    'challenges.progress': 'Progress',
    'challenges.reward': 'Reward',
    'challenges.join': 'Join',
    'challenges.completed': 'Completed',
    // Achievements
    'achievements.title': 'Achievements',
    'achievements.unlocked': 'Unlocked',
    'achievements.locked': 'Locked',
    'achievements.progress': 'Progress',
    // Marketplace
    'marketplace.title': 'Marketplace',
    'marketplace.buy': 'Buy',
    'marketplace.sell': 'Sell',
    'marketplace.myListings': 'My Listings',
    'marketplace.price': 'Price',
    'marketplace.seller': 'Seller',
    // Ranking
    'ranking.title': 'Rankings',
    'ranking.rank': 'Rank',
    'ranking.player': 'Player',
    'ranking.tokens': 'Tokens',
  },
  ru: {
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.notifications': 'Уведомления',
    'settings.about': 'О приложении',
    'settings.languageChanged': 'Язык успешно изменён',
    'settings.selectLanguage': 'Выберите язык',
    // Mining Characters
    'mining.characters': 'Персонажи майнинга',
    'mining.myCharacters': 'Мои персонажи',
    'mining.allCharacters': 'Все персонажи',
    'mining.speed': 'Скорость майнинга',
    'mining.boost': 'Буст',
    'mining.extraCoins': 'Дополнительные монеты',
    'mining.jackpotBonus': 'Бонус джекпота',
    'mining.buy': 'Купить',
    'mining.activate': 'Активировать',
    'mining.active': 'Активен',
    'mining.owned': 'В наличии',
    'mining.level': 'Уровень',
    // Challenges
    'challenges.title': 'Вызовы',
    'challenges.daily': 'Ежедневные',
    'challenges.weekly': 'Еженедельные',
    'challenges.special': 'Специальные',
    'challenges.progress': 'Прогресс',
    'challenges.reward': 'Награда',
    'challenges.join': 'Присоединиться',
    'challenges.completed': 'Завершено',
    // Achievements
    'achievements.title': 'Достижения',
    'achievements.unlocked': 'Разблокировано',
    'achievements.locked': 'Заблокировано',
    'achievements.progress': 'Прогресс',
    // Marketplace
    'marketplace.title': 'Маркетплейс',
    'marketplace.buy': 'Купить',
    'marketplace.sell': 'Продать',
    'marketplace.myListings': 'Мои объявления',
    'marketplace.price': 'Цена',
    'marketplace.seller': 'Продавец',
    // Ranking
    'ranking.title': 'Рейтинг',
    'ranking.rank': 'Место',
    'ranking.player': 'Игрок',
    'ranking.tokens': 'Токены',
  },
  ar: {
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.notifications': 'الإشعارات',
    'settings.about': 'حول التطبيق',
    'settings.languageChanged': 'تم تغيير اللغة بنجاح',
    'settings.selectLanguage': 'اختر اللغة',
    // Mining Characters
    'mining.characters': 'شخصيات التعدين',
    'mining.myCharacters': 'شخصياتي',
    'mining.allCharacters': 'جميع الشخصيات',
    'mining.speed': 'سرعة التعدين',
    'mining.boost': 'التعزيز',
    'mining.extraCoins': 'عملات إضافية',
    'mining.jackpotBonus': 'مكافأة الجائزة الكبرى',
    'mining.buy': 'شراء',
    'mining.activate': 'تفعيل',
    'mining.active': 'نشط',
    'mining.owned': 'مملوك',
    'mining.level': 'المستوى',
    // Challenges
    'challenges.title': 'التحديات',
    'challenges.daily': 'يومي',
    'challenges.weekly': 'أسبوعي',
    'challenges.special': 'خاص',
    'challenges.progress': 'التقدم',
    'challenges.reward': 'المكافأة',
    'challenges.join': 'انضمام',
    'challenges.completed': 'مكتمل',
    // Achievements
    'achievements.title': 'الإنجازات',
    'achievements.unlocked': 'مفتوح',
    'achievements.locked': 'مقفل',
    'achievements.progress': 'التقدم',
    // Marketplace
    'marketplace.title': 'السوق',
    'marketplace.buy': 'شراء',
    'marketplace.sell': 'بيع',
    'marketplace.myListings': 'عروضي',
    'marketplace.price': 'السعر',
    'marketplace.seller': 'البائع',
    // Ranking
    'ranking.title': 'التصنيف',
    'ranking.rank': 'الترتيب',
    'ranking.player': 'اللاعب',
    'ranking.tokens': 'الرموز',
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
    const isRTL = lang === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    const rtl = language === 'ar';
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
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
