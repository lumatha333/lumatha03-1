import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, StickyNote, GraduationCap, Sparkles } from 'lucide-react';
import { TodoModule } from '@/components/productivity/TodoModule';
import { NotesModule } from '@/components/productivity/NotesModule';
import { EducationModule } from '@/components/productivity/EducationModule';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'lumatha_productivity_tab';

export default function Education() {
  const { user } = useAuth();
  
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ['todos', 'notes', 'education'].includes(saved) ? saved : 'todos';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeModule);
  }, [activeModule]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        {/* Premium Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Productivity Hub
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Organize your life, learn, and grow</p>
        </div>

        {/* Module Tabs */}
        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 p-1.5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50">
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
