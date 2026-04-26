export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulletList'
  | 'numberedList'
  | 'todoList'
  | 'quote'
  | 'code'
  | 'image'
  | 'video'
  | 'music'
  | 'divider'
  | 'callout'
  | 'drawing';

export interface BlockStyle {
  textColor?: string;
  highlightColor?: string;
  backgroundColor?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isStrikethrough?: boolean;
  alignment?: 'left' | 'center' | 'right';
  lineHeight?: number;
  fontFamily?: 'normal' | 'bold' | 'italic' | 'cursive' | 'serif' | 'mono';
  rotation?: number;
}

export interface ImageBlockData {
  url: string;
  width: number;
  alignment: 'left' | 'center' | 'right';
  caption?: string;
  borderRadius?: number;
}

export interface VideoBlockData {
  url: string;
  width: number;
  isMuted: boolean;
  autoPlay: boolean;
  borderRadius?: number;
}

export interface MusicBlockData {
  url: string;
  title: string;
  artist?: string;
  coverUrl?: string;
  isPlaying?: boolean;
}

export interface DrawingBlockData {
  paths: { 
    points: { x: number; y: number }[]; 
    color: string; 
    width: number;
    opacity: number;
  }[];
}

export interface NoteBlock {
  id: string;
  type: BlockType;
  content: any;
  style?: BlockStyle;
  isFocused?: boolean;
  indent?: number;
  position?: { x: number; y: number };
  scale?: number;
  rotation?: number;
}

export type NoteTheme =
  | 'deepNavy'
  | 'purpleMist'
  | 'warmDark'
  | 'pureBlack'
  | 'midnightGreen'
  | 'roseDark'
  | 'oceanBlue'
  | 'ember'
  | 'forest'
  | 'slate';

export type NoteCategory =
  | 'all'
  | 'pinned'
  | 'saved'
  | 'purple'
  | 'golden'
  | 'cool'
  | 'warm';

export interface LumaNote {
  id: string;
  title: string;
  blocks: NoteBlock[];
  theme: NoteTheme;
  category: NoteCategory;
  isPinned: boolean;
  isSaved: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  firstImageUrl?: string;
  previewText: string;
  tags?: string[];
}
