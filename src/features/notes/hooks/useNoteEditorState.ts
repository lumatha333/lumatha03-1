import { useCallback, useMemo, useRef, useState } from 'react';
import { EditorPanel } from '../components/editor/types';

const LAST_PANEL_KEY = 'lumatha_notes_last_panel';

const haptic = () => {
  if (
    typeof window !== 'undefined' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
    'vibrate' in navigator
  ) {
    navigator.vibrate(8);
  }
};

export const useNoteEditorState = () => {
  const [activePanel, setActivePanelState] = useState<EditorPanel>(() => {
    const saved = localStorage.getItem(LAST_PANEL_KEY);
    if (saved === 'add' || saved === 'color' || saved === 'typography' || saved === 'menu') return saved;
    return null;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimer = useRef<number | null>(null);

  const setActivePanel = useCallback((panel: EditorPanel) => {
    setActivePanelState(panel);
    localStorage.setItem(LAST_PANEL_KEY, panel ?? '');
    haptic();
  }, []);

  const triggerAutoSave = useCallback((saveFn: () => void, delay = 700) => {
    setIsSaving(true);
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
    }
    saveTimer.current = window.setTimeout(() => {
      saveFn();
      setIsSaving(false);
      setLastSavedAt(new Date());
    }, delay);
  }, []);

  const forceSave = useCallback((saveFn: () => void) => {
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveFn();
    setIsSaving(false);
    setLastSavedAt(new Date());
  }, []);

  const saveLabel = useMemo(() => {
    if (isSaving) return 'Saving…';
    if (!lastSavedAt) return 'Saved';
    return `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [isSaving, lastSavedAt]);

  return {
    activePanel,
    setActivePanel,
    isSaving,
    saveLabel,
    triggerAutoSave,
    forceSave,
    haptic,
  };
};
