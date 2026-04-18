import { Sun, CalendarDays, CalendarRange, Target, Star, Sparkles } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

// Lumatha Default To-Dos - Clean, positive, universal for all ages

export type TodoCategory = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime' | 'custom';

export const TODO_CATEGORIES: { id: TodoCategory; label: string; icon: LucideIcon; resetPeriod: string }[] = [
  { id: 'daily', label: 'Daily', icon: Sun, resetPeriod: '24 hours' },
  { id: 'weekly', label: 'Weekly', icon: CalendarDays, resetPeriod: '7 days' },
  { id: 'monthly', label: 'Monthly', icon: CalendarRange, resetPeriod: '1 month' },
  { id: 'yearly', label: 'Yearly', icon: Target, resetPeriod: '1 year' },
  { id: 'lifetime', label: 'Lifetime', icon: Star, resetPeriod: 'Never' },
  { id: 'custom', label: 'Custom', icon: Sparkles, resetPeriod: 'User defined' },
];

export const DEFAULT_DAILY_TODOS = [
  "Wake up on time",
  "Drink enough water",
  "Move your body (10–15 minutes)",
  "Eat at least one healthy meal",
  "Brush teeth and maintain hygiene",
  "Keep your surroundings clean",
  "Complete your most important task",
  "Learn something small (5–10 minutes)",
  "Take short breaks to relax your mind",
  "Limit unnecessary screen time",
  "Respond to messages responsibly",
  "Spend time with family or friends",
  "Be kind to someone (online or offline)",
  "Reflect on your day",
  "Sleep on time"
];

export const DEFAULT_WEEKLY_TODOS = [
  "Plan your week",
  "Review last week's progress",
  "Clean and organize your space",
  "Exercise at least 3 times",
  "Spend time outdoors",
  "Learn a useful topic or skill",
  "Reduce digital clutter (photos, files, apps)",
  "Manage your expenses or budget",
  "Cook or eat healthier meals",
  "Practice a hobby",
  "Connect with someone you miss",
  "Do one act of help or service",
  "Take care of your mental health",
  "Set next week's goals",
  "Appreciate your achievements"
];

export const DEFAULT_MONTHLY_TODOS = [
  "Review personal goals",
  "Improve one habit",
  "Learn something meaningful",
  "Declutter unnecessary items",
  "Update important documents",
  "Review health routines",
  "Track emotional well-being",
  "Reduce stress sources",
  "Try something new",
  "Save money or plan finances",
  "Improve one personal skill",
  "Strengthen relationships",
  "Review progress and mistakes",
  "Plan the next month",
  "Celebrate small wins"
];

export const DEFAULT_YEARLY_TODOS = [
  "Set clear life goals",
  "Review the entire year",
  "Learn a major new skill",
  "Improve physical health",
  "Improve mental peace",
  "Strengthen relationships",
  "Travel or explore new places",
  "Build or improve career plans",
  "Save and plan finances wisely",
  "Let go of negative habits",
  "Help others consistently",
  "Reflect on personal values",
  "Plan self-development",
  "Be grateful for achievements",
  "Prepare goals for the next year"
];

export const DEFAULT_LIFETIME_TODOS = [
  "Build strong personal discipline",
  "Maintain long-term physical fitness",
  "Maintain long-term mental well-being",
  "Learn financial literacy",
  "Develop a stable career or business path",
  "Build strong communication skills",
  "Improve time management",
  "Become consistent with learning",
  "Maintain good hygiene and self-care",
  "Build meaningful friendships",
  "Build healthy relationships",
  "Support family and community",
  "Travel and explore the world",
  "Create a personal legacy (skills, work, values)",
  "Live with purpose and gratitude"
];

export const getDefaultTodos = (category: TodoCategory): string[] => {
  switch (category) {
    case 'daily': return DEFAULT_DAILY_TODOS;
    case 'weekly': return DEFAULT_WEEKLY_TODOS;
    case 'monthly': return DEFAULT_MONTHLY_TODOS;
    case 'yearly': return DEFAULT_YEARLY_TODOS;
    case 'lifetime': return DEFAULT_LIFETIME_TODOS;
    case 'custom': return [];
    default: return DEFAULT_DAILY_TODOS;
  }
};
