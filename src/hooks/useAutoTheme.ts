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
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light');
      document.body.classList.add('dark');
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
