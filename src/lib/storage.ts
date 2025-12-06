import { AppState, Post, Category, Subcategory } from '@/types';

const APP_KEY = 'coc_state';

export const CATEGORIES: Category[] = ['inspire', 'explore', 'knowledge', 'creative', 'fun'];

export const SUBCATEGORIES: Record<Category, Subcategory[]> = {
  inspire: ['thoughts', 'poems', 'culture', 'travel', 'nature', 'facts'],
  explore: ['news', 'politics', 'economy', 'education', 'technology', 'society'],
  knowledge: ['stories', 'ideas', 'art', 'music', 'writing', 'projects'],
  creative: ['stories', 'ideas', 'art', 'music', 'writing', 'projects'],
  fun: ['sports', 'movies', 'humor', 'games', 'trends', 'lifestyle']
};

const demoPost = (id: string, title: string, text: string, category: Category, subcategory: Subcategory, visibility: 'public' | 'private' = 'public'): Post => ({
  id,
  title,
  text,
  author: 'Cosmic Explorer',
  authorId: 'demo-user',
  category,
  subcategory,
  visibility,
  ts: Date.now() - Math.random() * 86400000 * 7,
});

export const getDefaultState = (): AppState => ({
  user: {
    id: 'demo-user',
    name: 'Cosmic Explorer',
    isAnonymous: false
  },
  posts: [
    demoPost('1', 'The Universe Within', 'Every thought is a star in the galaxy of consciousness. We are not just observers of the cosmos, we are the cosmos observing itself.', 'inspire', 'thoughts'),
    demoPost('2', 'Wisdom from the Mountains', 'In the silence of the peaks, I found answers to questions I had not yet asked.', 'inspire', 'thoughts', 'private'),
    demoPost('3', 'Journey to Self', 'Today I discovered that the longest journey is the one from the head to the heart.', 'creative', 'ideas'),
    demoPost('4', 'Starlight Dreams', 'Under the canvas of night, dreams paint themselves with starlight and shadow.', 'inspire', 'poems'),
    demoPost('5', 'The Path Less Traveled', 'Sometimes the road not taken becomes the path that leads us home.', 'creative', 'stories'),
    demoPost('6', 'Quantum Physics Basics', 'Understanding the fundamental principles of quantum mechanics.', 'explore', 'education'),
    demoPost('7', 'Why did the photon...', 'Why did the photon check into a hotel? Because it needed to rest its mass!', 'fun', 'humor'),
    demoPost('8', 'Champions Rise', 'The team showed incredible determination in today\'s championship match.', 'fun', 'sports'),
  ],
  saved: ['1'],
  playlists: [
    {
      id: '1',
      name: 'Cosmic Vibes',
      tracks: [
        { id: '1', title: 'Nebula Dreams', artist: 'Stardust Collective', duration: 245 },
        { id: '2', title: 'Quantum Meditation', artist: 'Cosmic Resonance', duration: 320 },
        { id: '3', title: 'Galaxy Waves', artist: 'Space Harmony', duration: 298 },
      ],
      ts: Date.now(),
    },
  ],
  todos: [],
  notes: [],
  routines: [],
  theme: 'cosmic'
});

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(APP_KEY);
    return raw ? JSON.parse(raw) : getDefaultState();
  } catch {
    return getDefaultState();
  }
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(APP_KEY, JSON.stringify(state));
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const getCategoryPlaceholder = (category: Category): string => {
  const placeholders: Record<Category, string> = {
    inspire: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400',
    explore: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    knowledge: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400',
    creative: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400',
    fun: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
  };
  return placeholders[category];
};

export const CATEGORY_INFO: Record<Category, { emoji: string; title: string; description: string }> = {
  inspire: { emoji: '💭', title: 'Inspire Zone', description: 'Share what you feel' },
  explore: { emoji: '🌍', title: 'Explore Zone', description: 'Learn and discover new things' },
  knowledge: { emoji: '🧠', title: 'Knowledge Zone', description: 'Know and stay informed' },
  creative: { emoji: '🎨', title: 'Creative Zone', description: 'Make and express freely' },
  fun: { emoji: '⚡', title: 'Fun Zone', description: 'Laugh, relax, and enjoy' },
};

export const SUBCATEGORY_INFO: Record<Subcategory, { emoji: string; description: string }> = {
  // Inspire
  thoughts: { emoji: '💭', description: 'Small realizations or inner talks' },
  poems: { emoji: '✍️', description: 'Words that touch the soul' },
  culture: { emoji: '🌏', description: 'People, lifestyle, and habits around the world' },
  travel: { emoji: '🏔️', description: 'Explore stories, journeys, and places' },
  nature: { emoji: '🌳', description: 'Earth, wildlife, environment' },
  facts: { emoji: '🤯', description: 'Rare and interesting truths' },
  // Explore
  news: { emoji: '🗞️', description: 'Real world & current events' },
  politics: { emoji: '🏛️', description: 'Social, national, or global decisions' },
  economy: { emoji: '💰', description: 'Business, market, and finance' },
  education: { emoji: '🎓', description: 'Knowledge, learning, study tips' },
  technology: { emoji: '🤖', description: 'Science, gadgets, and AI tools' },
  society: { emoji: '🌐', description: 'Human values, lifestyle, and systems' },
  // Knowledge & Creative (shared)
  stories: { emoji: '📖', description: 'Fiction, life stories, or true events' },
  ideas: { emoji: '💡', description: 'Creative or innovative concepts' },
  art: { emoji: '🎨', description: 'Drawings, designs, and visual creativity' },
  music: { emoji: '🎶', description: 'Songs, melodies, lyrics' },
  writing: { emoji: '🖋️', description: 'Articles, essays, blogs' },
  projects: { emoji: '🤝', description: 'Group or solo creative tasks' },
  // Fun
  sports: { emoji: '⚽', description: 'Games, matches, motivation' },
  movies: { emoji: '🎬', description: 'Film reviews, updates, favorites' },
  humor: { emoji: '😂', description: 'Jokes, memes, funny texts' },
  games: { emoji: '🎮', description: 'Gaming, e-sports, game guides' },
  trends: { emoji: '🔥', description: 'What\'s viral and hot now' },
  lifestyle: { emoji: '💃', description: 'Habits, fashion, and daily life' },
};
