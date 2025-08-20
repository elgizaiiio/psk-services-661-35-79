import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeType = 'dark-rain';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  themes: Array<{
    id: ThemeType;
    name: string;
    description: string;
    preview: string;
  }>;
}

const themes = [
  {
    id: 'dark-rain' as ThemeType,
    name: 'الشبكة المظلمة',
    description: 'ثيم أسود مع خلفية شبكة ثلاثية الأبعاد',
    preview: 'linear-gradient(135deg, #000000 0%, #001100 50%, #002200 100%)'
  }
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('viral-theme');
    return (saved as ThemeType) || 'dark-rain';
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('viral-theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (themeType: ThemeType) => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-dark-rain');
    
    // Add new theme class
    root.classList.add(`theme-${themeType}`);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};