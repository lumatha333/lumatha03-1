import { useEffect, useCallback } from 'react';

/**
 * Auto theme: Light 5AM-5PM, Dark 5PM-5AM based on user's timezone.
 * Manual override lasts 1 week, then reverts to auto.
 */
export function useAutoTheme() {
  const getIsDay = useCallback(() => {
    const hour = new Date().getHours();
    return hour >= 5 && hour < 17; // 5AM to 5PM = light
  }, []);

  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      // Force light background immediately to prevent black flash
      root.style.backgroundColor = 'hsl(210, 40%, 98%)';
      body.style.backgroundColor = 'hsl(210, 40%, 98%)';
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
      root.style.backgroundColor = '';
      body.style.backgroundColor = '';
    }
  }, []);

  const checkAndApply = useCallback(() => {
    const override = localStorage.getItem('lumatha_theme_override');
    const overrideTime = localStorage.getItem('lumatha_theme_override_time');

    // If manual override exists, check if it's within 1 week
    if (override && overrideTime) {
      const elapsed = Date.now() - parseInt(overrideTime);
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (elapsed < oneWeek) {
        applyTheme(override as 'light' | 'dark');
        localStorage.setItem('lumatha_theme', override);
        return;
      }
      // Override expired, clear it
      localStorage.removeItem('lumatha_theme_override');
      localStorage.removeItem('lumatha_theme_override_time');
    }

    // Auto theme based on time
    const autoTheme = getIsDay() ? 'light' : 'dark';
    applyTheme(autoTheme);
    localStorage.setItem('lumatha_theme', autoTheme);
  }, [getIsDay, applyTheme]);

  useEffect(() => {
    checkAndApply();
    // Re-check every 5 minutes
    const interval = setInterval(checkAndApply, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndApply]);

  const setManualTheme = useCallback((theme: 'light' | 'dark') => {
    localStorage.setItem('lumatha_theme_override', theme);
    localStorage.setItem('lumatha_theme_override_time', String(Date.now()));
    localStorage.setItem('lumatha_theme', theme);
    applyTheme(theme);
  }, [applyTheme]);

  return { setManualTheme, currentTheme: (localStorage.getItem('lumatha_theme') || 'dark') as 'light' | 'dark' };
}
