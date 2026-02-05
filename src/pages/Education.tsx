import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, StickyNote, GraduationCap } from 'lucide-react';
import { TodoModule } from '@/components/productivity/TodoModule';
import { NotesModule } from '@/components/productivity/NotesModule';
import { EducationModule } from '@/components/productivity/EducationModule';

const STORAGE_KEY = 'lumatha_productivity_tab';

export default function Education() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeModule, setActiveModule] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && ['todos', 'notes', 'education'].includes(saved) ? saved : 'todos';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeModule);
  }, [activeModule]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto p-4 pb-24">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Productivity Hub</h1>
          <p className="text-sm text-muted-foreground">Organize your life, learn, and grow</p>
        </div>

        {/* Module Tabs */}
        <Tabs value={activeModule} onValueChange={setActiveModule}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="todos" className="flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">To-Do</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-1.5">
              <StickyNote className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="education" className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Education</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todos" className="mt-0">
            <TodoModule />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <NotesModule />
          </TabsContent>

          <TabsContent value="education" className="mt-0">
            <EducationModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
