// Default To-Dos - Simple, positive, suitable for all ages

export const DEFAULT_DAILY_TODOS = [
  "Wake up on time",
  "Drink enough water",
  "Do 10-15 minutes of physical movement",
  "Eat at least one healthy meal",
  "Practice gratitude (think of 1 good thing)",
  "Learn something new (small)",
  "Complete your main task of the day",
  "Keep your surroundings clean",
  "Be kind to someone (online or offline)",
  "Limit unnecessary screen time",
  "Check your messages responsibly",
  "Spend time with family or friends",
  "Take short breaks to relax your mind",
  "Reflect on your day",
  "Sleep on time"
];

export const DEFAULT_WEEKLY_TODOS = [
  "Plan your week",
  "Review last week's progress",
  "Clean and organize your space",
  "Learn a new skill or topic",
  "Exercise at least 3 times",
  "Connect with someone you haven't talked to recently",
  "Save or manage your expenses",
  "Reduce digital clutter (files, photos, apps)",
  "Help someone in need",
  "Read or watch something educational",
  "Practice a hobby",
  "Spend quality time outdoors",
  "Set goals for next week",
  "Take care of your mental health",
  "Appreciate your achievements"
];

export const DEFAULT_MONTHLY_TODOS = [
  "Review personal goals",
  "Learn something meaningful",
  "Improve one habit",
  "Save money or plan finances",
  "Declutter unnecessary items",
  "Update important documents",
  "Reflect on emotional well-being",
  "Try something new",
  "Help your community or society",
  "Track your personal growth",
  "Improve a personal skill",
  "Reduce stress sources",
  "Review health routines",
  "Plan for the next month",
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

export type TodoCategory = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const TODO_CATEGORIES = [
  { id: 'daily' as TodoCategory, label: 'Daily', resetPeriod: '1 day', emoji: '☀️' },
  { id: 'weekly' as TodoCategory, label: 'Weekly', resetPeriod: '1 week', emoji: '📅' },
  { id: 'monthly' as TodoCategory, label: 'Monthly', resetPeriod: '1 month', emoji: '🗓️' },
  { id: 'yearly' as TodoCategory, label: 'Yearly', resetPeriod: '1 year', emoji: '🎯' },
];

export const getDefaultTodos = (category: TodoCategory): string[] => {
  switch (category) {
    case 'daily': return DEFAULT_DAILY_TODOS;
    case 'weekly': return DEFAULT_WEEKLY_TODOS;
    case 'monthly': return DEFAULT_MONTHLY_TODOS;
    case 'yearly': return DEFAULT_YEARLY_TODOS;
    default: return DEFAULT_DAILY_TODOS;
  }
};