import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Palette, Check, Sun, Moon, Crown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const getThemeIcon = (themeId: string) => {
  switch (themeId) {
    case 'dark-rain':
      return <Moon className="w-4 h-4" />;
    case 'light-rain':
      return <Sun className="w-4 h-4" />;
    default:
      return <Palette className="w-4 h-4" />;
  }
};

const ThemeSelector: React.FC = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start px-2 py-1.5 h-auto cursor-pointer hover:bg-primary/10"
        >
          {getThemeIcon(theme)}
          <span className="ml-2 text-sm">Change Theme</span>
        </Button>
      </DialogTrigger>
        <DialogContent className="sm:max-w-xs max-w-[90vw] bg-card/95 backdrop-blur-lg border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Choose Theme
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select your preferred theme to customize the app appearance
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {themes.map((themeOption) => (
            <Card
              key={themeOption.id}
              className={`p-2 cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                theme === themeOption.id
                  ? 'ring-2 ring-primary border-primary/50'
                  : 'hover:border-primary/30'
              }`}
              onClick={() => setTheme(themeOption.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getThemeIcon(themeOption.id)}
                    <div
                      className="w-8 h-6 rounded border-2 border-border/50 shadow-sm"
                      style={{ background: themeOption.preview }}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{themeOption.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {themeOption.description}
                    </p>
                  </div>
                </div>
                {theme === themeOption.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ThemeSelector;