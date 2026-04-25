import { NoteTheme } from './types';

export const NOTE_THEMES: Record<NoteTheme, { colors: string[]; name: string; accent: string }> = {
  deepNavy: {
    colors: ['#060B18', '#0D1425'],
    name: 'Deep Navy',
    accent: '#3B82F6',
  },
  purpleMist: {
    colors: ['#0F081E', '#160B2A'],
    name: 'Purple Mist',
    accent: '#8B5CF6',
  },
  warmDark: {
    colors: ['#140D08', '#1E120D'],
    name: 'Warm Dark',
    accent: '#F97316',
  },
  pureBlack: {
    colors: ['#000000', '#040404'],
    name: 'Pure Black',
    accent: '#FFFFFF',
  },
  midnightGreen: {
    colors: ['#05140F', '#0A1E16'],
    name: 'Midnight Green',
    accent: '#10B981',
  },
  roseDark: {
    colors: ['#16080D', '#200B14'],
    name: 'Rose Dark',
    accent: '#F43F5E',
  },
  oceanBlue: {
    colors: ['#060F1E', '#0A182D'],
    name: 'Ocean Blue',
    accent: '#06B6D4',
  },
  ember: {
    colors: ['#180806', '#240D0B'],
    name: 'Ember',
    accent: '#EF4444',
  },
  forest: {
    colors: ['#081208', '#0D1A0D'],
    name: 'Forest',
    accent: '#22C55E',
  },
  slate: {
    colors: ['#0F172A', '#020617'],
    name: 'Slate',
    accent: '#94A3B8',
  },
};

export const CATEGORY_COLORS: Record<string, string> = {
  default: '#3B4A6B',
  all: '#3B4A6B',
  purple: '#8B5CF6',
  golden: '#F59E0B',
  cool: '#3B82F6',
  warm: '#F97316',
  pinned: '#EC4899',
  saved: '#10B981',
};

export const TEXT_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Light', value: '#F3F4F6' },
  { name: 'Silver', value: '#D1D5DB' },
  { name: 'Gray', value: '#9CA3AF' },
  { name: 'Slate', value: '#64748B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Soft Red', value: '#F87171' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Soft Orange', value: '#FB923C' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Yellow', value: '#FBBF24' },
  { name: 'Lime', value: '#84CC16' },
  { name: 'Green', value: '#10B981' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Teal', value: '#06B6D4' },
  { name: 'Cyan', value: '#0891B2' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Royal Blue', value: '#2563EB' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Purple', value: '#A855F7' },
  { name: 'Fuchsia', value: '#D946EF' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Rose', value: '#F43F5E' },
  { name: 'Crimson', value: '#BE123C' },
  { name: 'Sunset', value: '#FF7E5F' },
  { name: 'Gold', value: '#FFD700' },
  { name: 'Neon Green', value: '#39FF14' },
  { name: 'Electric Blue', value: '#7DF9FF' },
];

export const HIGHLIGHT_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Yellow', value: 'rgba(253,224,71,0.25)' },
  { name: 'Green', value: 'rgba(74,222,128,0.2)' },
  { name: 'Blue', value: 'rgba(96,165,250,0.2)' },
  { name: 'Purple', value: 'rgba(192,132,252,0.2)' },
  { name: 'Pink', value: 'rgba(244,114,182,0.2)' },
  { name: 'Red', value: 'rgba(248,113,113,0.15)' },
  { name: 'Orange', value: 'rgba(251,146,60,0.2)' },
];

export const BG_COLORS = [
  { name: 'None', value: 'transparent' },
  { name: 'Dark Gray', value: 'rgba(255,255,255,0.04)' },
  { name: 'Purple', value: 'rgba(139,92,246,0.08)' },
  { name: 'Blue', value: 'rgba(59,130,246,0.08)' },
  { name: 'Green', value: 'rgba(16,185,129,0.08)' },
  { name: 'Yellow', value: 'rgba(253,224,71,0.08)' },
  { name: 'Red', value: 'rgba(239,68,68,0.08)' },
  { name: 'Pink', value: 'rgba(236,72,153,0.08)' },
];
