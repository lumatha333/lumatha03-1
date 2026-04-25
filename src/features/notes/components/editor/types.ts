import { NoteTheme } from '../../types';

export type EditorPanel = 'add' | 'color' | 'typography' | 'menu' | null;

export type EditorMediaType = 'image' | 'video' | 'drawing';

export interface EditorMediaItem {
  id: string;
  type: EditorMediaType;
  url?: string;
}

export interface EditorTypography {
  size: 'sm' | 'base' | 'h1' | 'h2';
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface EditorColorState {
  text: string;
  background: string;
  theme: NoteTheme;
}
