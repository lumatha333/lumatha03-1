import React from 'react';
import { EditorScreen } from '../components/editor/EditorScreen';

interface NoteEditorScreenProps {
  noteId: string;
  onClose: () => void;
}

export const NoteEditorScreen: React.FC<NoteEditorScreenProps> = ({ noteId, onClose }) => {
  return <EditorScreen noteId={noteId} onClose={onClose} />;
};
