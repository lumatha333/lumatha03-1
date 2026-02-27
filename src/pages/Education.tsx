import { useState, useEffect } from 'react';
import { CheckSquare, StickyNote, GraduationCap, BarChart3 } from 'lucide-react';
import { TodoModule } from '@/components/productivity/TodoModule';
import { NotesModule } from '@/components/productivity/NotesModule';
import { EducationModule } from '@/components/productivity/EducationModule';
import { ProductivityAnalytics } from '@/components/productivity/ProductivityAnalytics';
import { SwipeableTabs } from '@/components/SwipeableTabs';
import { SectionHeader } from '@/components/SectionHeader';

const STORAGE_KEY = 'lumatha_productivity_tab';

const TABS = [
  { id: 'todos', label: 'To-Do', icon: <CheckSquare className="w-3.5 h-3.5" /> },
  { id: 'notes', label: 'Notes', icon: <StickyNote className="w-3.5 h-3.5" /> },
  { id: 'education', label: 'Docs', icon: <GraduationCap className="w-3.5 h-3.5" /> },
  { id: 'analytics', label: 'Stats', icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

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
        <SectionHeader sectionName="Learn" />
        <SwipeableTabs tabs={TABS} activeTab={activeModule} onTabChange={setActiveModule}>
          <div><TodoModule /></div>
          <div><NotesModule /></div>
          <div><EducationModule /></div>
          <div><ProductivityAnalytics /></div>
        </SwipeableTabs>
      </div>
    </div>
  );
}
