import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, StickyNote, GraduationCap } from 'lucide-react';
import { TodoModule } from '@/components/productivity/TodoModule';
import { NotesModule } from '@/components/productivity/NotesModule';
import { EducationModule } from '@/components/productivity/EducationModule';
import { ThemeSwitcher, useProductivityTheme } from '@/components/productivity/ThemeSwitcher';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lumatha_productivity_tab';

export default function Education() {
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ['todos', 'notes', 'education'].includes(saved) ? saved : 'todos';
  });

  const { theme, setTheme, currentTheme } = useProductivityTheme();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeModule);
  }, [activeModule]);

  // Theme background classes
  const getThemeBg = () => {
    switch (theme) {
      case 'calm-light':
        return 'bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50 text-slate-900';
      case 'deep-dark':
        return 'bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 text-white';
      case 'soft-neon':
        return 'bg-gradient-to-br from-purple-950/90 via-fuchsia-950/80 to-cyan-950/90 text-white';
      default:
        return '';
    }
  };

  const getCardStyle = () => {
    switch (theme) {
      case 'calm-light':
        return 'bg-white/70 backdrop-blur-xl border-slate-200/50';
      case 'deep-dark':
        return 'bg-slate-800/50 backdrop-blur-xl border-slate-700/50';
      case 'soft-neon':
        return 'bg-purple-900/30 backdrop-blur-xl border-purple-500/20';
      default:
        return '';
    }
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", getThemeBg())}>
      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        {/* Module Tabs with Theme Switcher */}
        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <div className="flex items-center gap-2">
            <TabsList className={cn(
              "flex-1 grid grid-cols-3 h-14 p-1.5 rounded-2xl transition-all duration-300",
              getCardStyle()
            )}>
              <TabsTrigger 
                value="todos" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">To-Do</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
              >
                <StickyNote className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Notes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Education</span>
              </TabsTrigger>
            </TabsList>
            
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          </div>

          <div className="animate-fade-in">
            <TabsContent value="todos" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <TodoModule />
            </TabsContent>

            <TabsContent value="notes" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <NotesModule />
            </TabsContent>

            <TabsContent value="education" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <EducationModule />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
