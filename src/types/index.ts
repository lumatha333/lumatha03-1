export interface User {
  id: string;
  name: string;
  profilePic?: string;
  isAnonymous?: boolean;
}

export interface Post {
  id: string;
  title: string;
  text: string;
  img?: string;
  author: string;
  authorId: string;
  authorPic?: string;
  category: Category;
  subcategory: Subcategory;
  visibility: 'public' | 'private';
  ts: number;
}

// New 5-zone system
export type Category = 'inspire' | 'explore' | 'knowledge' | 'creative' | 'fun';

export type Subcategory = 
  // Inspire zone
  | 'thoughts' | 'poems' | 'culture' | 'travel' | 'nature' | 'facts'
  // Explore zone
  | 'news' | 'politics' | 'economy' | 'education' | 'technology' | 'society'
  // Knowledge zone
  | 'stories' | 'ideas' | 'art' | 'music' | 'writing' | 'projects'
  // Creative zone (same as Knowledge)
  // stories, ideas, art, music, writing, projects (shared with Knowledge)
  // Fun zone
  | 'sports' | 'movies' | 'humor' | 'games' | 'trends' | 'lifestyle';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  ts: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  img?: string;
  ts: number;
}

export interface Routine {
  id: string;
  name: string;
  tasks: string[];
  schedule: string;
  ts: number;
}

export interface AppState {
  user: User;
  posts: Post[];
  saved: string[];
  playlists: Playlist[];
  todos: Todo[];
  notes: Note[];
  routines: Routine[];
  theme: 'dark' | 'light' | 'cosmic';
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  ts: number;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  file?: File;
  url?: string;
}
