import { useEffect, useCallback } from 'react';

/**
 * Theme system: Dark is default. User can manually switch.
 * Manual override persists until changed again.
 */
export function useAutoTheme() {
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    root.classList.add('theme-transitioning');
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
      root.style.backgroundColor = '#F8FAFC';
      body.style.backgroundColor = '#F8FAFC';
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#F8FAFC');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
      root.style.backgroundColor = '';
      body.style.backgroundColor = '';
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', '#09090f');
    }
    setTimeout(() => root.classList.remove('theme-transitioning'), 300);
  }, []);

  useEffect(() => {
    // Dark is default — only apply light if explicitly saved
    const saved = localStorage.getItem('lumatha_theme') || 'dark';
    applyTheme(saved as 'light' | 'dark');

    const handleStorageThemeChange = (event: StorageEvent) => {
      if (event.key && event.key !== 'lumatha_theme' && event.key !== 'lumatha_theme_override') return;
      const nextTheme = (localStorage.getItem('lumatha_theme') || 'dark') as 'light' | 'dark';
      applyTheme(nextTheme);
    };

    const handleCustomThemeChange = () => {
      const nextTheme = (localStorage.getItem('lumatha_theme') || 'dark') as 'light' | 'dark';
      applyTheme(nextTheme);
    };

    window.addEventListener('storage', handleStorageThemeChange);
    window.addEventListener('lumatha-theme-changed', handleCustomThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageThemeChange);
      window.removeEventListener('lumatha-theme-changed', handleCustomThemeChange as EventListener);
    };
  }, [applyTheme]);

  const setManualTheme = useCallback((theme: 'light' | 'dark') => {
    localStorage.setItem('lumatha_theme_override', theme);
    localStorage.setItem('lumatha_theme', theme);
    applyTheme(theme);
    window.dispatchEvent(new CustomEvent('lumatha-theme-changed', { detail: theme }));
  }, [applyTheme]);

  return { setManualTheme, currentTheme: (localStorage.getItem('lumatha_theme') || 'dark') as 'light' | 'dark' };
}
