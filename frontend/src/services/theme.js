import { useState, useEffect } from 'react';

export const themeService = {
  getTheme() {
    return localStorage.getItem('theme') || 'system';
  },

  setTheme(theme) {
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    window.dispatchEvent(new Event('theme-changed'));
  },

  applyTheme(theme) {
    const root = document.documentElement;
    if (
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  init() {
    const theme = this.getTheme();
    this.applyTheme(theme);

    // Watch for OS preference shifts
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (this.getTheme() === 'system') {
        this.applyTheme('system');
      }
    };
    
    // Support both older and newer matchMedia API signatures
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
    }
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState(themeService.getTheme());

  const changeTheme = (newTheme) => {
    themeService.setTheme(newTheme);
    setThemeState(newTheme);
  };

  useEffect(() => {
    const handleThemeChange = () => {
      setThemeState(themeService.getTheme());
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  return [theme, changeTheme];
}
