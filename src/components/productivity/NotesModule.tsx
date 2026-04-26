import React from 'react';
import { SupabaseNotesProvider } from '@/features/notes/context/SupabaseNotesContext';
import { NotesListScreenV2 } from '@/features/notes/screens/NotesListScreenV2';

export function NotesModule() {
  return (
    <SupabaseNotesProvider>
      <div className="h-full w-full overflow-hidden bg-[#070B14]">
        <NotesListScreenV2 />
      </div>
    </SupabaseNotesProvider>
  );
}

export default NotesModule;
