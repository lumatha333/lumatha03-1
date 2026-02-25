import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, StickyNote, GraduationCap, BarChart3 } from 'lucide-react';
import { TodoModule } from '@/components/productivity/TodoModule';
import { NotesModule } from '@/components/productivity/NotesModule';
import { EducationModule } from '@/components/productivity/EducationModule';
import { ProductivityAnalytics } from '@/components/productivity/ProductivityAnalytics';

const STORAGE_KEY = 'lumatha_productivity_tab';

export default function Education() {
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ['todos', 'notes', 'education', 'analytics'].includes(saved) ? saved : 'todos';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeModule);
  }, [activeModule]);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14 p-1.5 rounded-2xl glass-card">
            <TabsTrigger 
              value="todos" 
              className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs">To-Do</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs">Notes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="education" 
              className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs">Docs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-1.5 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:shadow-sm transition-all duration-300"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs">Stats</span>
            </TabsTrigger>
          </TabsList>

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

            <TabsContent value="analytics" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <ProductivityAnalytics />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
