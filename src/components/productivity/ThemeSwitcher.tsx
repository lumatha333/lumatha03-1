import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductivityTheme = 'calm-light' | 'deep-dark' | 'soft-neon';

const THEME_KEY = 'lumatha_productivity_theme';

const themes: { id: ProductivityTheme; name: string; preview: string; bg: string }[] = [
  { 
    id: 'calm-light', 
    name: 'Calm Light', 
    preview: 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
    bg: 'from-slate-50 via-blue-50/50 to-indigo-50'
  },
  { 
    id: 'deep-dark', 
    name: 'Deep Dark', 
    preview: 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900',
    bg: 'from-slate-900 via-gray-900 to-zinc-900'
  },
  { 
    id: 'soft-neon', 
    name: 'Soft Neon', 
    preview: 'bg-gradient-to-br from-purple-900/80 via-fuchsia-900/60 to-cyan-900/80',
    bg: 'from-purple-900/40 via-fuchsia-900/30 to-cyan-900/40'
  }
];

export function useProductivityTheme() {
  const [theme, setTheme] = useState<ProductivityTheme>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return (saved as ProductivityTheme) || 'calm-light';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  return { theme, setTheme, currentTheme, themes };
}

interface ThemeSwitcherProps {
  theme: ProductivityTheme;
  setTheme: (theme: ProductivityTheme) => void;
}

export function ThemeSwitcher({ theme, setTheme }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground px-2 py-1">Theme</p>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors text-left",
                theme === t.id ? "bg-primary/10" : "hover:bg-muted"
              )}
            >
              <div className={cn("w-6 h-6 rounded-full border", t.preview)} />
              <span className="text-sm flex-1">{t.name}</span>
              {theme === t.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
