import { calculateNoteStats } from '../../utils';
import { LumaNote, NoteBlock } from '../../types';
import { EditorMediaItem } from './types';

const textTypes = new Set(['text', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 'todoList', 'quote', 'code']);
const editorManagedTypes = new Set([
  'text',
  'heading1',
  'heading2',
  'heading3',
  'bulletList',
  'numberedList',
  'todoList',
  'quote',
  'code',
  'image',
  'video',
]);

export const parseNoteForEditor = (note: LumaNote) => {
  const title = note.title || '';

  const textParts = note.blocks
    .filter((block) => textTypes.has(block.type))
    .map((block) => {
      if (typeof block.content === 'string') return block.content;
      if (Array.isArray(block.content)) {
        return block.content.map((item: any) => item?.text || '').filter(Boolean).join('\n');
      }
      return '';
    })
    .filter(Boolean);

  const media: EditorMediaItem[] = note.blocks
    .filter((block) => block.type === 'image' || block.type === 'video')
    .map((block) => {
      const raw = block.content;
      const url = typeof raw === 'string' ? raw : raw?.url;
      return {
        id: block.id,
        type: block.type as 'image' | 'video',
        url,
      };
    })
    .filter((item) => Boolean(item.url));

  return {
    title,
    description: textParts.join('\n\n'),
    media,
  };
};

export const serializeEditorToNote = (
  note: LumaNote,
  title: string,
  description: string,
  media: EditorMediaItem[]
): Partial<LumaNote> => {
  const retainedBlocks = note.blocks.filter((block) => !editorManagedTypes.has(block.type));

  const rebuilt: NoteBlock[] = [];

  if (description.trim()) {
    rebuilt.push({
      id: crypto.randomUUID(),
      type: 'text',
      content: description.trim(),
      isFocused: true,
      style: { fontFamily: 'normal' },
    });
  }

  media.forEach((item) => {
    if (!item.url) return;
    rebuilt.push({
      id: item.id || crypto.randomUUID(),
      type: item.type === 'drawing' ? 'image' : item.type,
      content: item.type === 'video'
        ? { url: item.url, width: 90, isMuted: true, autoPlay: false }
        : { url: item.url, width: 90, alignment: 'center' },
      isFocused: false,
    } as NoteBlock);
  });

  const blocks = [...rebuilt, ...retainedBlocks];
  const stats = calculateNoteStats(blocks);

  return {
    title: title.trim(),
    blocks,
    wordCount: stats.words,
    previewText: stats.previewText,
    firstImageUrl: stats.firstImageUrl,
    updatedAt: new Date().toISOString(),
  };
};
