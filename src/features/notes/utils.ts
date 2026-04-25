import { NoteBlock } from './types';

export const calculateNoteStats = (blocks: NoteBlock[]) => {
  const allText = blocks
    .filter(b => b.type !== 'image' && b.type !== 'divider')
    .map(b => (typeof b.content === 'string' ? b.content : ''))
    .join(' ');

  const words = allText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const chars = allText.length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  
  const h1 = blocks.find(b => b.type === 'heading1');
  const title = (h1?.content as string) || '';
  
  const textBlock = blocks.find(b => b.type === 'text' && b.content);
  const previewText = (textBlock?.content as string)?.slice(0, 80) || '';
  
  const firstImage = blocks.find(b => b.type === 'image');
  const firstImageUrl = (firstImage?.content as string) || undefined;

  return { words, chars, readTime, title, previewText, firstImageUrl };
};
