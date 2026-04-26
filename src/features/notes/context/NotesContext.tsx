import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LumaNote, NoteBlock, NoteTheme, NoteCategory } from '../types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotesContextType {
  notes: LumaNote[];
  addNote: () => LumaNote;
  updateNote: (id: string, updates: Partial<LumaNote>) => void;
  deleteNote: (id: string) => void;
  getNote: (id: string) => LumaNote | undefined;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'lumatha_notes_v3';

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<LumaNote[]>([]);
  const isInitialMount = useRef(true);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
    isInitialMount.current = false;
  }, []);

  // Sync to local storage on change
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes]);

  const addNote = useCallback(() => {
    const newNote: LumaNote = {
      id: crypto.randomUUID(),
      title: '',
      blocks: [{ id: crypto.randomUUID(), type: 'text', content: '', isFocused: true }],
      theme: 'deepNavy',
      category: 'all',
      isPinned: false,
      isSaved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: 0,
      previewText: '',
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  }, []);

  const updateNote = useCallback((id: string, updates: Partial<LumaNote>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    toast.success('Note deleted');
  }, []);

  const getNote = useCallback((id: string) => {
    return notes.find(n => n.id === id);
  }, [notes]);

  return (
    <NotesContext.Provider value={{ notes, addNote, updateNote, deleteNote, getNote }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) throw new Error('useNotes must be used within a NotesProvider');
  return context;
};
