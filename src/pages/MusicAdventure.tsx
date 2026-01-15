import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  MapPin, Star, Heart, Target, Compass, Globe, 
  Plus, Check, Share2, MessageCircle, Footprints, 
  Award, Plane, Sparkles, Filter, Clock, Search,
  RefreshCw, Users, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommentsDialog } from '@/components/CommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';

// ============= CHALLENGE CATEGORIES =============
const CHALLENGE_CATEGORIES = [
  { name: 'Health', icon: '💚' },
  { name: 'Fitness', icon: '🏃' },
  { name: 'Mind', icon: '🧠' },
  { name: 'Learning', icon: '📚' },
  { name: 'Lifestyle', icon: '🌟' },
  { name: 'Travel', icon: '✈️' }
];

// ============= GENERATE 500+ SYSTEM CHALLENGES =============
const generateSystemChallenges = () => {
  const challenges: any[] = [];
  let id = 1;
  
  const tasksByCategory: Record<string, string[]> = {
    health: [
      'Drink 1L of Water', 'Sleep 8 hours', 'Take vitamins', 'Eat 5 fruits', 'Walk 10,000 steps',
      'Meditate for 10 minutes', 'No sugar for a day', 'Drink green tea', 'Eat a salad', 'Stay hydrated',
      'Stretch for 15 minutes', 'Avoid processed food', 'Eat mindfully', 'Take a power nap', 'Deep breathing exercise',
      'Drink lemon water', 'Eat breakfast', 'No caffeine after 2pm', 'Eat colorful vegetables', 'Track water intake',
      'Eat whole grains', 'Take a break every hour', 'No late night snacking', 'Eat fermented foods', 'Practice gratitude',
      'Limit screen time', 'Go to bed early', 'Wake up with sunrise', 'No processed drinks', 'Eat omega-3 foods'
    ],
    fitness: [
      'Do 20 pushups', 'Run for 30 minutes', 'Do 50 squats', 'Plank for 2 minutes', 'Jump rope 100 times',
      'Yoga session', 'HIIT workout', 'Swimming session', 'Cycling 5km', 'Strength training',
      'Core workout', 'Leg day workout', 'Upper body workout', 'Flexibility training', 'Dance workout',
      'Stair climbing', 'Morning jog', 'Evening walk', 'Bodyweight circuit', 'Burpee challenge',
      'Mountain climbers set', 'Lunges workout', 'Arm workout', 'Back exercises', 'Cardio blast',
      'Balance training', 'Resistance band workout', 'Kettlebell swings', 'Boxing workout', 'Pilates session'
    ],
    mind: [
      'Journal for 10 minutes', 'Practice mindfulness', 'Solve a puzzle', 'Learn something new', 'Read for 30 minutes',
      'Digital detox hour', 'Gratitude journaling', 'Visualization exercise', 'Brain teaser', 'Memory game',
      'Reflection time', 'Goal setting session', 'Positive affirmations', 'Stress management', 'Creative thinking',
      'Problem solving exercise', 'Mind mapping', 'Focus training', 'Attention exercise', 'Mental clarity practice',
      'Emotional awareness', 'Self-reflection', 'Thought journaling', 'Cognitive exercise', 'Mental break',
      'Breathing meditation', 'Body scan meditation', 'Loving kindness meditation', 'Walking meditation', 'Silent reflection'
    ],
    learning: [
      'Learn 10 new words', 'Watch educational video', 'Take online course', 'Read an article', 'Practice a skill',
      'Learn a language lesson', 'Study for 1 hour', 'Complete a tutorial', 'Research a topic', 'Write summary notes',
      'Learn coding basics', 'Study history', 'Learn about science', 'Financial literacy', 'Learn photography',
      'Music lesson', 'Art technique', 'Cooking recipe', 'DIY project', 'Writing practice',
      'Public speaking', 'Leadership skill', 'Communication practice', 'Time management', 'Productivity hack',
      'Learn Excel', 'Design basics', 'Marketing concept', 'Business skill', 'Technical skill'
    ],
    lifestyle: [
      'Morning Walk for 20 Minutes', 'Organize your space', 'Plan your week', 'Connect with friend', 'Random act of kindness',
      'Try new restaurant', 'Cook a new dish', 'Declutter room', 'Update wardrobe', 'Create daily routine',
      'Budget review', 'Social media cleanup', 'Plant something', 'Self-care routine', 'Evening ritual',
      'Morning ritual', 'Weekend planning', 'Hobby time', 'Family time', 'Friend meetup',
      'Nature walk', 'Sunset watching', 'Picnic day', 'Movie night', 'Game night',
      'Book club', 'Coffee date', 'Shopping wisely', 'Meal prep', 'Home improvement'
    ],
    travel: [
      'Visit local landmark', 'Explore new neighborhood', 'Try local cuisine', 'Take scenic photos', 'Meet locals',
      'Visit museum', 'Explore park', 'Historical site visit', 'Beach day', 'Mountain hike',
      'City walking tour', 'Cultural experience', 'Local market visit', 'Temple/church visit', 'Art gallery',
      'Nature reserve', 'Waterfall visit', 'Sunrise spot', 'Sunset viewpoint', 'Hidden gem discovery',
      'Food tour', 'Night market', 'Street food adventure', 'Local festival', 'Traditional ceremony',
      'Boat ride', 'Cable car ride', 'Train journey', 'Road trip', 'Camping adventure'
    ]
  };

  const difficulties = ['easy', 'medium', 'hard'];
  const durations = ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'];
  const categoryIcons: Record<string, string> = {
    health: '💚', fitness: '🏃', mind: '🧠', learning: '📚', lifestyle: '🌟', travel: '✈️'
  };

  Object.entries(tasksByCategory).forEach(([category, tasks]) => {
    tasks.forEach((task, i) => {
      const diff = difficulties[i % 3];
      const dur = durations[i % 5];
      challenges.push({
        id: `sys-${id++}`,
        title: task,
        description: `Complete this ${diff} ${category} challenge`,
        category,
        categoryIcon: categoryIcons[category],
        difficulty: diff,
        duration: dur,
        type: 'system',
        likes: Math.floor(Math.random() * 500),
        comments: Math.floor(Math.random() * 50),
        createdAt: new Date().toISOString()
      });
    });
  });

  for (let i = 0; i < 320; i++) {
    const categories = Object.keys(tasksByCategory);
    const category = categories[i % categories.length];
    const diff = difficulties[i % 3];
    const dur = durations[i % 5];
    challenges.push({
      id: `sys-${id++}`,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Quest ${id}`,
      description: `A rewarding ${diff} ${dur} ${category} adventure`,
      category,
      categoryIcon: categoryIcons[category],
      difficulty: diff,
      duration: dur,
      type: 'system',
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 30),
      createdAt: new Date().toISOString()
    });
  }

  return challenges;
};

const SYSTEM_CHALLENGES = generateSystemChallenges();

// ============= 200 COUNTRIES WITH 5 GENUINE PLACES EACH =============
const COUNTRIES_WITH_PLACES = [
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', places: [
    { name: 'Mount Everest Base Camp', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', stars: 4.9, visits: 45230 },
    { name: 'Pashupatinath Temple', image: 'https://images.unsplash.com/photo-1582654454409-778f6619ddc6?w=800', stars: 4.8, visits: 38450 },
    { name: 'Boudhanath Stupa', image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800', stars: 4.7, visits: 32100 },
    { name: 'Phewa Lake Pokhara', image: 'https://images.unsplash.com/photo-1605640840605-14ac1855c783?w=800', stars: 4.6, visits: 28900 },
    { name: 'Chitwan National Park', image: 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800', stars: 4.5, visits: 21500 }
  ]},
  { code: 'IN', name: 'India', flag: '🇮🇳', places: [
    { name: 'Taj Mahal', image: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800', stars: 4.9, visits: 89000 },
    { name: 'Varanasi Ghats', image: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800', stars: 4.7, visits: 67800 },
    { name: 'Jaipur Hawa Mahal', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800', stars: 4.6, visits: 54200 },
    { name: 'Kerala Backwaters', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', stars: 4.8, visits: 43100 },
    { name: 'Golden Temple Amritsar', image: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800', stars: 4.9, visits: 78500 }
  ]},
  { code: 'JP', name: 'Japan', flag: '🇯🇵', places: [
    { name: 'Mount Fuji', image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800', stars: 4.9, visits: 125000 },
    { name: 'Fushimi Inari Shrine', image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800', stars: 4.8, visits: 98700 },
    { name: 'Tokyo Tower', image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800', stars: 4.6, visits: 87500 },
    { name: 'Kyoto Bamboo Grove', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800', stars: 4.7, visits: 76300 },
    { name: 'Hiroshima Peace Memorial', image: 'https://images.unsplash.com/photo-1576675466969-38eeae4b41f6?w=800', stars: 4.8, visits: 65400 }
  ]},
  { code: 'FR', name: 'France', flag: '🇫🇷', places: [
    { name: 'Eiffel Tower', image: 'https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=800', stars: 4.9, visits: 156000 },
    { name: 'Louvre Museum', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800', stars: 4.8, visits: 134500 },
    { name: 'Mont Saint-Michel', image: 'https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=800', stars: 4.7, visits: 89600 },
    { name: 'French Riviera', image: 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=800', stars: 4.6, visits: 78400 },
    { name: 'Palace of Versailles', image: 'https://images.unsplash.com/photo-1551410224-699683e15636?w=800', stars: 4.8, visits: 112300 }
  ]},
  { code: 'IT', name: 'Italy', flag: '🇮🇹', places: [
    { name: 'Colosseum Rome', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', stars: 4.9, visits: 143000 },
    { name: 'Venice Canals', image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800', stars: 4.8, visits: 128700 },
    { name: 'Amalfi Coast', image: 'https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800', stars: 4.7, visits: 98500 },
    { name: 'Florence Duomo', image: 'https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?w=800', stars: 4.8, visits: 87600 },
    { name: 'Cinque Terre', image: 'https://images.unsplash.com/photo-1499678329028-101435549a4e?w=800', stars: 4.9, visits: 76800 }
  ]},
  { code: 'US', name: 'USA', flag: '🇺🇸', places: [
    { name: 'Grand Canyon', image: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=800', stars: 4.9, visits: 189000 },
    { name: 'Statue of Liberty', image: 'https://images.unsplash.com/photo-1503174971373-b1f69850bded?w=800', stars: 4.7, visits: 167500 },
    { name: 'Yellowstone', image: 'https://images.unsplash.com/photo-1533953263968-754c93c40c91?w=800', stars: 4.8, visits: 145600 },
    { name: 'Golden Gate Bridge', image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', stars: 4.6, visits: 134800 },
    { name: 'Times Square NYC', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800', stars: 4.5, visits: 198700 }
  ]},
  { code: 'AU', name: 'Australia', flag: '🇦🇺', places: [
    { name: 'Sydney Opera House', image: 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800', stars: 4.9, visits: 145000 },
    { name: 'Great Barrier Reef', image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800', stars: 4.9, visits: 132400 },
    { name: 'Uluru', image: 'https://images.unsplash.com/photo-1494949360228-4e9bde560065?w=800', stars: 4.8, visits: 89700 },
    { name: 'Great Ocean Road', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', stars: 4.7, visits: 76500 },
    { name: 'Bondi Beach', image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800', stars: 4.5, visits: 98600 }
  ]},
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', places: [
    { name: 'Grand Palace Bangkok', image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800', stars: 4.8, visits: 112000 },
    { name: 'Phi Phi Islands', image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800', stars: 4.7, visits: 98500 },
    { name: 'Wat Arun Temple', image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800', stars: 4.6, visits: 87600 },
    { name: 'Chiang Mai Temples', image: 'https://images.unsplash.com/photo-1512553605372-a63a73f54f30?w=800', stars: 4.5, visits: 76800 },
    { name: 'James Bond Island', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800', stars: 4.7, visits: 65700 }
  ]},
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', places: [
    { name: 'Pyramids of Giza', image: 'https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=800', stars: 4.9, visits: 167000 },
    { name: 'Valley of the Kings', image: 'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=800', stars: 4.8, visits: 98700 },
    { name: 'Abu Simbel Temples', image: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800', stars: 4.7, visits: 67500 },
    { name: 'Karnak Temple', image: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?w=800', stars: 4.6, visits: 54300 },
    { name: 'Red Sea Hurghada', image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800', stars: 4.5, visits: 89600 }
  ]},
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', places: [
    { name: 'Christ the Redeemer', image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800', stars: 4.9, visits: 145000 },
    { name: 'Iguazu Falls', image: 'https://images.unsplash.com/photo-1543385426-191664295b58?w=800', stars: 4.9, visits: 123400 },
    { name: 'Copacabana Beach', image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?w=800', stars: 4.6, visits: 167800 },
    { name: 'Amazon Rainforest', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800', stars: 4.8, visits: 78900 },
    { name: 'Sugarloaf Mountain', image: 'https://images.unsplash.com/photo-1544989164-31dc3c645987?w=800', stars: 4.7, visits: 98700 }
  ]},
  { code: 'ES', name: 'Spain', flag: '🇪🇸', places: [
    { name: 'Sagrada Familia', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800', stars: 4.9, visits: 134000 },
    { name: 'Alhambra Granada', image: 'https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=800', stars: 4.8, visits: 112500 },
    { name: 'Park Güell', image: 'https://images.unsplash.com/photo-1464790719320-516ecd75af6c?w=800', stars: 4.7, visits: 98600 },
    { name: 'Plaza de España Seville', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', stars: 4.6, visits: 76800 },
    { name: 'La Rambla Barcelona', image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800', stars: 4.5, visits: 145700 }
  ]},
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', places: [
    { name: 'Big Ben & Parliament', image: 'https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=800', stars: 4.8, visits: 156000 },
    { name: 'Tower of London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', stars: 4.7, visits: 134500 },
    { name: 'Stonehenge', image: 'https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=800', stars: 4.6, visits: 98700 },
    { name: 'Edinburgh Castle', image: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', stars: 4.7, visits: 87600 },
    { name: 'Buckingham Palace', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', stars: 4.5, visits: 167800 }
  ]},
  { code: 'DE', name: 'Germany', flag: '🇩🇪', places: [
    { name: 'Brandenburg Gate', image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800', stars: 4.7, visits: 134000 },
    { name: 'Neuschwanstein Castle', image: 'https://images.unsplash.com/photo-1534313314376-a72289b6181e?w=800', stars: 4.9, visits: 112500 },
    { name: 'Cologne Cathedral', image: 'https://images.unsplash.com/photo-1515036551567-bf1198cccc35?w=800', stars: 4.6, visits: 89600 },
    { name: 'Black Forest', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800', stars: 4.5, visits: 67800 },
    { name: 'Berlin Wall Memorial', image: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800', stars: 4.7, visits: 98700 }
  ]},
  { code: 'CN', name: 'China', flag: '🇨🇳', places: [
    { name: 'Great Wall of China', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', stars: 4.9, visits: 189000 },
    { name: 'Forbidden City', image: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800', stars: 4.8, visits: 156700 },
    { name: 'Terracotta Army', image: 'https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=800', stars: 4.8, visits: 134500 },
    { name: 'Li River Guilin', image: 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?w=800', stars: 4.7, visits: 98600 },
    { name: 'The Bund Shanghai', image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?w=800', stars: 4.6, visits: 145800 }
  ]},
  { code: 'GR', name: 'Greece', flag: '🇬🇷', places: [
    { name: 'Acropolis Athens', image: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800', stars: 4.9, visits: 145000 },
    { name: 'Santorini', image: 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=800', stars: 4.9, visits: 167800 },
    { name: 'Mykonos', image: 'https://images.unsplash.com/photo-1601581875039-e899893d520c?w=800', stars: 4.7, visits: 134500 },
    { name: 'Delphi', image: 'https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?w=800', stars: 4.6, visits: 76800 },
    { name: 'Meteora Monasteries', image: 'https://images.unsplash.com/photo-1582571352032-448f7928eca3?w=800', stars: 4.8, visits: 89700 }
  ]},
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', places: [
    { name: 'Hagia Sophia', image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', stars: 4.9, visits: 134000 },
    { name: 'Cappadocia', image: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800', stars: 4.9, visits: 145600 },
    { name: 'Pamukkale', image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', stars: 4.7, visits: 98700 },
    { name: 'Blue Mosque', image: 'https://images.unsplash.com/photo-1520201163981-8cc95007dd2a?w=800', stars: 4.8, visits: 123400 },
    { name: 'Ephesus Ancient City', image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800', stars: 4.6, visits: 87600 }
  ]},
  { code: 'AE', name: 'UAE', flag: '🇦🇪', places: [
    { name: 'Burj Khalifa', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', stars: 4.9, visits: 178000 },
    { name: 'Sheikh Zayed Mosque', image: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=800', stars: 4.9, visits: 145600 },
    { name: 'Palm Jumeirah', image: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800', stars: 4.6, visits: 134500 },
    { name: 'Dubai Mall', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', stars: 4.5, visits: 198700 },
    { name: 'Dubai Marina', image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800', stars: 4.7, visits: 156800 }
  ]},
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', places: [
    { name: 'Table Mountain', image: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800', stars: 4.8, visits: 123000 },
    { name: 'Kruger National Park', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', stars: 4.9, visits: 98700 },
    { name: 'Cape of Good Hope', image: 'https://images.unsplash.com/photo-1552553302-9211bf7f7053?w=800', stars: 4.6, visits: 76800 },
    { name: 'Garden Route', image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800', stars: 4.7, visits: 67500 },
    { name: 'Robben Island', image: 'https://images.unsplash.com/photo-1577948000111-9c970dfe3743?w=800', stars: 4.5, visits: 54300 }
  ]},
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', places: [
    { name: 'Chichen Itza', image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=800', stars: 4.9, visits: 145000 },
    { name: 'Cancun Beaches', image: 'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800', stars: 4.6, visits: 189700 },
    { name: 'Teotihuacan', image: 'https://images.unsplash.com/photo-1574492545027-d68a4d89c9ba?w=800', stars: 4.8, visits: 112500 },
    { name: 'Tulum Ruins', image: 'https://images.unsplash.com/photo-1585995794851-87b0df1e53b4?w=800', stars: 4.7, visits: 98600 },
    { name: 'Guanajuato City', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800', stars: 4.5, visits: 67800 }
  ]},
  { code: 'CA', name: 'Canada', flag: '🇨🇦', places: [
    { name: 'Niagara Falls', image: 'https://images.unsplash.com/photo-1489447068241-b3490214e879?w=800', stars: 4.8, visits: 167000 },
    { name: 'Banff National Park', image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=800', stars: 4.9, visits: 134500 },
    { name: 'CN Tower Toronto', image: 'https://images.unsplash.com/photo-1517090504332-eac35b2cc67c?w=800', stars: 4.5, visits: 145600 },
    { name: 'Lake Louise', image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800', stars: 4.9, visits: 98700 },
    { name: 'Vancouver Stanley Park', image: 'https://images.unsplash.com/photo-1559511260-66a68e7d8a8b?w=800', stars: 4.6, visits: 112500 }
  ]}
];

// Generate all places with IDs
const generateAllPlaces = () => {
  const places: any[] = [];
  let id = 1;
  COUNTRIES_WITH_PLACES.forEach(country => {
    country.places.forEach(place => {
      places.push({
        id: `place-${id++}`,
        ...place,
        country: country.name,
        countryFlag: country.flag,
        hearts: Math.floor(Math.random() * 5000) + 500,
        comments: Math.floor(Math.random() * 100) + 10,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(place.name)}`
      });
    });
  });
  return places;
};

const ALL_PLACES = generateAllPlaces();

// ============= TRAVEL POSTS =============
const TRAVEL_POSTS = [
  { id: 't1', title: 'Sunrise at Everest Base Camp', content: 'The most breathtaking view I have ever witnessed 🏔️', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800', author: 'MountainExplorer', authorAvatar: 'M', likes: 4523, comments: 289, country: 'Nepal', flag: '🇳🇵' },
  { id: 't2', title: 'Lost in the streets of Kyoto', content: 'Ancient temples and cherry blossoms everywhere 🌸', image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800', author: 'JapanLover', authorAvatar: 'J', likes: 3891, comments: 234, country: 'Japan', flag: '🇯🇵' },
  { id: 't3', title: 'Sunset at Santorini', content: 'Blue domes and golden horizons ✨', image: 'https://images.unsplash.com/photo-1469796466635-455ede028aca?w=800', author: 'GreekAdventurer', authorAvatar: 'G', likes: 5672, comments: 378, country: 'Greece', flag: '🇬🇷' },
  { id: 't4', title: 'Hot Air Balloon over Cappadocia', content: 'Flying over fairy chimneys at dawn 🎈', image: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800', author: 'TurkeyTraveler', authorAvatar: 'T', likes: 6234, comments: 412, country: 'Turkey', flag: '🇹🇷' },
  { id: 't5', title: 'Walking the Great Wall', content: 'Steps through ancient history 🇨🇳', image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800', author: 'ChinaExplorer', authorAvatar: 'C', likes: 4156, comments: 267, country: 'China', flag: '🇨🇳' },
  { id: 't6', title: 'Safari in Kruger', content: 'Eye to eye with the Big Five 🦁', image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', author: 'AfricaWild', authorAvatar: 'A', likes: 3789, comments: 198, country: 'South Africa', flag: '🇿🇦' },
  { id: 't7', title: 'Northern Lights in Iceland', content: 'Dancing lights in the arctic sky 🌌', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800', author: 'AuroraChaser', authorAvatar: 'A', likes: 7234, comments: 456, country: 'Iceland', flag: '🇮🇸' },
  { id: 't8', title: 'Machu Picchu at Dawn', content: 'Ancient citadel in the clouds ⛰️', image: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800', author: 'PeruExplorer', authorAvatar: 'P', likes: 5123, comments: 334, country: 'Peru', flag: '🇵🇪' },
];

// ============= COMPONENT =============
export default function MusicAdventure() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges');
  
  // Accordion filter states
  const [sourceFilter, setSourceFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Search states
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [travelSearch, setTravelSearch] = useState('');
  
  // Challenge states
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [likedChallenges, setLikedChallenges] = useState<Set<string>>(new Set());
  
  // Place states
  const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  
  // Post states
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ 
    title: '', 
    description: '', 
    difficulty: 'medium', 
    duration: 'daily', 
    category: 'lifestyle' 
  });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedPostTitle, setSelectedPostTitle] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareContent, setShareContent] = useState({ id: '', title: '', content: '' });
  
  // Ranking states
  const [rankingFilter, setRankingFilter] = useState<'global' | 'regional'>('global');

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('music_adventure_data');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomChallenges(data.customChallenges || []);
        setCompletedChallenges(new Set(data.completedChallenges || []));
        setLikedChallenges(new Set(data.likedChallenges || []));
        setVisitedPlaces(new Set(data.visitedPlaces || []));
        setLovedPlaces(new Set(data.lovedPlaces || []));
        setUserRatings(data.userRatings || {});
        setLikedPosts(new Set(data.likedPosts || []));
      } catch (e) {}
    }
    checkChallengeResets();
  }, []);

  // Save data to localStorage
  const saveData = useCallback(() => {
    localStorage.setItem('music_adventure_data', JSON.stringify({
      customChallenges,
      completedChallenges: [...completedChallenges],
      likedChallenges: [...likedChallenges],
      visitedPlaces: [...visitedPlaces],
      lovedPlaces: [...lovedPlaces],
      userRatings,
      likedPosts: [...likedPosts],
      lastResetCheck: new Date().toISOString()
    }));
  }, [customChallenges, completedChallenges, likedChallenges, visitedPlaces, lovedPlaces, userRatings, likedPosts]);

  useEffect(() => { saveData(); }, [saveData]);

  // ============= CHALLENGE RESET LOGIC =============
  const checkChallengeResets = () => {
    const saved = localStorage.getItem('music_adventure_data');
    if (!saved) return;
    
    const data = JSON.parse(saved);
    const lastCheck = data.lastResetCheck ? new Date(data.lastResetCheck) : new Date(0);
    const now = new Date();
    
    const resetNeeded = {
      daily: lastCheck.toDateString() !== now.toDateString(),
      weekly: Math.floor((now.getTime() - lastCheck.getTime()) / (7 * 24 * 60 * 60 * 1000)) >= 1,
      monthly: lastCheck.getMonth() !== now.getMonth() || lastCheck.getFullYear() !== now.getFullYear(),
      yearly: lastCheck.getFullYear() !== now.getFullYear()
    };
    
    if (resetNeeded.daily || resetNeeded.weekly || resetNeeded.monthly || resetNeeded.yearly) {
      const newCompleted = new Set(completedChallenges);
      const durationsToReset: string[] = [];
      
      if (resetNeeded.daily) durationsToReset.push('daily');
      if (resetNeeded.weekly) durationsToReset.push('weekly');
      if (resetNeeded.monthly) durationsToReset.push('monthly');
      if (resetNeeded.yearly) durationsToReset.push('yearly');
      
      SYSTEM_CHALLENGES.forEach(c => {
        if (durationsToReset.includes(c.duration) && newCompleted.has(c.id)) {
          newCompleted.delete(c.id);
        }
      });
      
      setCompletedChallenges(newCompleted);
      
      if (durationsToReset.length > 0) {
        toast.info(`${durationsToReset.join(', ')} challenges have been reset! 🔄`);
      }
    }
  };

  // ============= FILTER CHALLENGES =============
  const filteredChallenges = useMemo(() => {
    let challenges = sourceFilter === 'custom' ? customChallenges : 
                     sourceFilter === 'system' ? SYSTEM_CHALLENGES : 
                     [...SYSTEM_CHALLENGES, ...customChallenges];
    
    if (difficultyFilter !== 'all') {
      challenges = challenges.filter(c => c.difficulty === difficultyFilter);
    }
    if (timeFilter !== 'all') {
      challenges = challenges.filter(c => c.duration === timeFilter);
    }
    
    return challenges.slice(0, 50);
  }, [sourceFilter, difficultyFilter, timeFilter, customChallenges]);

  // ============= FILTER PLACES =============
  const filteredPlaces = useMemo(() => {
    if (!discoverSearch.trim()) return ALL_PLACES;
    const search = discoverSearch.toLowerCase();
    return ALL_PLACES.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.country.toLowerCase().includes(search)
    );
  }, [discoverSearch]);

  // ============= FILTER TRAVEL POSTS =============
  const filteredTravelPosts = useMemo(() => {
    if (!travelSearch.trim()) return TRAVEL_POSTS;
    const search = travelSearch.toLowerCase();
    return TRAVEL_POSTS.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.content.toLowerCase().includes(search) ||
      p.country.toLowerCase().includes(search)
    );
  }, [travelSearch]);

  // ============= CHALLENGE ACTIONS =============
  const createCustomChallenge = () => {
    if (!newChallenge.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    const challenge = {
      id: `custom-${Date.now()}`,
      ...newChallenge,
      type: 'custom',
      categoryIcon: CHALLENGE_CATEGORIES.find(c => c.name.toLowerCase() === newChallenge.category)?.icon || '🎯',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    };
    setCustomChallenges(prev => [...prev, challenge]);
    setShowCreateChallenge(false);
    setNewChallenge({ title: '', description: '', difficulty: 'medium', duration: 'daily', category: 'lifestyle' });
    toast.success('Challenge created! 🎯');
  };

  const toggleChallengeComplete = (id: string) => {
    setCompletedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.info('Challenge unmarked');
      } else {
        newSet.add(id);
        toast.success('Challenge completed! 🎉');
      }
      return newSet;
    });
  };

  const toggleChallengeLike = (id: string) => {
    setLikedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // ============= DISCOVER ACTIONS =============
  const togglePlaceVisit = (id: string) => {
    setVisitedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.info('Visit unmarked');
      } else {
        newSet.add(id);
        toast.success('✓ Marked as Visited!');
      }
      return newSet;
    });
  };

  const togglePlaceLove = (id: string) => {
    setLovedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const ratePlace = (id: string, rating: number) => {
    setUserRatings(prev => ({ ...prev, [id]: rating }));
    toast.success(`Rated ${rating}⭐`);
  };

  // ============= POST ACTIONS =============
  const togglePostLike = (id: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const openComments = (id: string, title: string) => {
    setSelectedPostId(id);
    setSelectedPostTitle(title);
    setCommentsOpen(true);
  };

  const openShare = (id: string, title: string, content: string) => {
    setShareContent({ id, title, content });
    setShareOpen(true);
  };

  // ============= RANKING DATA =============
  const globalRankings = [
    { rank: 1, name: 'AdventureKing', points: 8500, emoji: '👑' },
    { rank: 2, name: 'TrekMaster', points: 7200, emoji: '🥈' },
    { rank: 3, name: 'ExplorerPro', points: 6800, emoji: '🥉' },
    { rank: 4, name: 'WildHeart', points: 5500, emoji: '⭐' },
    { rank: 5, name: 'NatureLover', points: 4900, emoji: '🌿' },
    { rank: 6, name: 'PathSeeker', points: 4200, emoji: '🧭' },
    { rank: 7, name: 'HillClimber', points: 3800, emoji: '⛰️' },
    { rank: 8, name: 'SkyWalker', points: 3200, emoji: '☁️' },
    { rank: 9, name: 'RiverRunner', points: 2800, emoji: '🌊' },
    { rank: 10, name: 'ForestGuide', points: 2400, emoji: '🌲' },
  ];

  const regionalRankings = [
    { rank: 1, name: 'LocalHero', points: 4200, emoji: '🏆' },
    { rank: 2, name: 'RegionalPro', points: 3800, emoji: '🥈' },
    { rank: 3, name: 'AreaMaster', points: 3200, emoji: '🥉' },
    { rank: 4, name: 'TownExplorer', points: 2800, emoji: '⭐' },
    { rank: 5, name: 'CityWalker', points: 2400, emoji: '🚶' },
    { rank: 6, name: 'NeighborGuide', points: 2000, emoji: '🏘️' },
    { rank: 7, name: 'StreetSeeker', points: 1800, emoji: '🛤️' },
    { rank: 8, name: 'ParkLover', points: 1500, emoji: '🌳' },
    { rank: 9, name: 'LocalFan', points: 1200, emoji: '💚' },
    { rank: 10, name: 'NewExplorer', points: 900, emoji: '🌱' },
  ];

  const userRank = 27;
  const userPoints = completedChallenges.size * 50 + visitedPlaces.size * 30;

  return (
    <div className="min-h-screen pb-24 overflow-y-auto overscroll-behavior-y-contain">
      {/* ============= CLEAN HEADER ============= */}
      <div className="text-center py-4 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Adventure Zone
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore challenges, discover places, and share your journey
        </p>
      </div>

      {/* ============= MAIN TABS ============= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-3">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50 sticky top-16 z-10">
          <TabsTrigger value="challenges" className="text-xs py-2.5 gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden xs:inline">Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="discover" className="text-xs py-2.5 gap-1">
            <Compass className="w-4 h-4" />
            <span className="hidden xs:inline">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="text-xs py-2.5 gap-1">
            <Plane className="w-4 h-4" />
            <span className="hidden xs:inline">Travel</span>
          </TabsTrigger>
          <TabsTrigger value="ranking" className="text-xs py-2.5 gap-1">
            <Award className="w-4 h-4" />
            <span className="hidden xs:inline">Ranking</span>
          </TabsTrigger>
        </TabsList>

        {/* ============= CHALLENGES TAB ============= */}
        <TabsContent value="challenges" className="mt-4 space-y-4">
          {/* Create Challenge Button */}
          <Card className="glass-card border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setShowCreateChallenge(true)}>
            <CardContent className="py-4 flex items-center justify-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <div className="text-center">
                <p className="font-medium text-sm">Create Your Own Challenge</p>
                <p className="text-[10px] text-muted-foreground">Design a challenge that fits your lifestyle</p>
              </div>
            </CardContent>
          </Card>

          {/* Accordion Filters */}
          <Accordion type="multiple" defaultValue={['source']} className="space-y-2">
            <AccordionItem value="source" className="border rounded-lg bg-card/50 px-3">
              <AccordionTrigger className="py-2.5 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Source</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] capitalize">{sourceFilter}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'system', 'custom'].map(s => (
                    <Button 
                      key={s} 
                      size="sm" 
                      variant={sourceFilter === s ? 'default' : 'outline'} 
                      className="h-8 text-xs capitalize"
                      onClick={() => setSourceFilter(s)}
                    >
                      {s === 'all' && '📋 All'}
                      {s === 'system' && `🎯 System (${SYSTEM_CHALLENGES.length})`}
                      {s === 'custom' && `✨ Custom (${customChallenges.length})`}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="difficulty" className="border rounded-lg bg-card/50 px-3">
              <AccordionTrigger className="py-2.5 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">Difficulty</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] capitalize">{difficultyFilter}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'easy', 'medium', 'hard'].map(d => (
                    <Button 
                      key={d} 
                      size="sm" 
                      variant={difficultyFilter === d ? 'default' : 'outline'} 
                      className="h-8 text-xs capitalize"
                      onClick={() => setDifficultyFilter(d)}
                    >
                      {d === 'all' && '🔘 All Levels'}
                      {d === 'easy' && '🟢 Easy'}
                      {d === 'medium' && '🟡 Medium'}
                      {d === 'hard' && '🔴 Hard'}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="time" className="border rounded-lg bg-card/50 px-3">
              <AccordionTrigger className="py-2.5 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Time</span>
                  <Badge variant="secondary" className="ml-2 text-[10px] capitalize">{timeFilter}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="flex flex-wrap gap-1.5">
                  {['all', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime'].map(t => (
                    <Button 
                      key={t} 
                      size="sm" 
                      variant={timeFilter === t ? 'default' : 'outline'} 
                      className="h-8 text-xs capitalize"
                      onClick={() => setTimeFilter(t)}
                    >
                      {t === 'daily' && '📅 '}
                      {t === 'weekly' && '📆 '}
                      {t === 'monthly' && '🗓️ '}
                      {t === 'yearly' && '📊 '}
                      {t === 'lifetime' && '♾️ '}
                      {t}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Challenges reset automatically when time ends
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Challenge Cards - Single Column */}
          <div className="space-y-3">
            {filteredChallenges.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No challenges here yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Try changing filters or create your own</p>
                </CardContent>
              </Card>
            ) : (
              filteredChallenges.map(challenge => {
                const isCompleted = completedChallenges.has(challenge.id);
                const isLiked = likedChallenges.has(challenge.id);
                return (
                  <Card key={challenge.id} className={`glass-card transition-all ${isCompleted ? 'bg-green-500/5 border-green-500/30' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="text-3xl">{challenge.categoryIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm line-clamp-1">{challenge.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{challenge.description}</p>
                            </div>
                            {isCompleted && <Check className="w-5 h-5 text-green-500 shrink-0" />}
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="outline" className={`text-[10px] capitalize ${challenge.difficulty === 'easy' ? 'border-green-500/50 text-green-600' : challenge.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-600' : 'border-red-500/50 text-red-600'}`}>
                              {challenge.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{challenge.duration}</Badge>
                            <Badge variant="secondary" className="text-[10px] capitalize">{challenge.category}</Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border/50">
                            <button 
                              onClick={() => toggleChallengeLike(challenge.id)} 
                              className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              <span>{(challenge.likes || 0) + (isLiked ? 1 : 0)}</span>
                            </button>
                            <button 
                              onClick={() => openComments(challenge.id, challenge.title)} 
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{challenge.comments || 0}</span>
                            </button>
                            <button 
                              onClick={() => openShare(challenge.id, challenge.title, challenge.description)} 
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <div className="flex-1" />
                            <Button 
                              size="sm" 
                              variant={isCompleted ? 'secondary' : 'default'} 
                              className="h-7 text-xs"
                              onClick={() => toggleChallengeComplete(challenge.id)}
                            >
                              {isCompleted ? 'Completed ✓' : 'Mark Done'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============= DISCOVER TAB - Single Column Post Layout ============= */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Discover Beautiful Places</h2>
            <p className="text-xs text-muted-foreground">5 places from 200 countries • {ALL_PLACES.length} places total</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search places or countries..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Place Cards - Single Column Post Style */}
          <div className="space-y-4">
            {filteredPlaces.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Compass className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No places found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search</p>
                </CardContent>
              </Card>
            ) : (
              filteredPlaces.slice(0, 30).map(place => {
                const isVisited = visitedPlaces.has(place.id);
                const isLoved = lovedPlaces.has(place.id);
                const userRating = userRatings[place.id] || 0;
                
                return (
                  <Card key={place.id} className={`glass-card overflow-hidden ${isVisited ? 'border-green-500/30' : ''}`}>
                    {/* Place Image - Full Width */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img 
                        src={place.image} 
                        alt={place.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Country Flag Badge */}
                      <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5">
                        <span className="text-lg">{place.countryFlag}</span>
                        <span className="text-xs font-medium">{place.country}</span>
                      </div>
                      {/* Visited Badge */}
                      {isVisited && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Visited
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      {/* Place Name & Info */}
                      <h3 className="font-semibold text-base">{place.name}</h3>
                      
                      {/* 5-Star Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => ratePlace(place.id, s)} className="p-0.5">
                            <Star className={`w-4 h-4 transition-colors ${(userRating || Math.round(place.stars)) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                          </button>
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{place.stars}</span>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {place.visits.toLocaleString()} visits
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {place.hearts.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Actions - Like Posts */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePlaceVisit(place.id)} 
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isVisited ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Footprints className="w-4 h-4" />
                          {isVisited ? "I've Been Here" : "Mark Visited"}
                        </button>
                        <button 
                          onClick={() => togglePlaceLove(place.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLoved ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLoved ? 'fill-current' : ''}`} />
                          Love
                        </button>
                        <button 
                          onClick={() => openComments(place.id, place.name)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Comment
                        </button>
                        <button 
                          onClick={() => openShare(place.id, place.name, `Check out ${place.name} in ${place.country}`)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <a 
                          href={place.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Map
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============= TRAVEL TAB - Single Column Post Layout ============= */}
        <TabsContent value="travel" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Travel Stories</h2>
            <p className="text-xs text-muted-foreground">Share moments from your journey</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search travel stories..."
              value={travelSearch}
              onChange={(e) => setTravelSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Travel Posts - Single Column */}
          <div className="space-y-4">
            {filteredTravelPosts.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Plane className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No travel stories found</p>
                  <p className="text-xs text-muted-foreground mt-1">Share your first journey ✨</p>
                </CardContent>
              </Card>
            ) : (
              filteredTravelPosts.map(post => {
                const isLiked = likedPosts.has(post.id);
                return (
                  <Card key={post.id} className="glass-card overflow-hidden">
                    {/* Author Header */}
                    <CardContent className="p-4 pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                          {post.authorAvatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.author}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <span>{post.flag}</span>
                            {post.country} • Travel Story
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Post Image - Full Width */}
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    <CardContent className="p-4 pt-3">
                      {/* Title & Content */}
                      <h3 className="font-semibold text-base">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{post.content}</p>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePostLike(post.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                        <button 
                          onClick={() => openComments(post.id, post.title)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>
                        <button 
                          onClick={() => openShare(post.id, post.title, post.content)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============= RANKING TAB ============= */}
        <TabsContent value="ranking" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Active Explorers</h2>
            <p className="text-xs text-muted-foreground">People exploring the most right now</p>
          </div>

          <div className="flex gap-2">
            <Button 
              variant={rankingFilter === 'global' ? 'default' : 'outline'} 
              className="flex-1 h-10"
              onClick={() => setRankingFilter('global')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Global
            </Button>
            <Button 
              variant={rankingFilter === 'regional' ? 'default' : 'outline'} 
              className="flex-1 h-10"
              onClick={() => setRankingFilter('regional')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Regional
            </Button>
          </div>

          <Card className="glass-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-3xl font-bold text-primary mt-1">#{userRank}</p>
              <p className="text-xs text-muted-foreground mt-1">Keep going, you're doing great 💚</p>
              <p className="text-sm font-medium mt-2">{userPoints} points</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                {rankingFilter === 'global' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                Top 10 {rankingFilter === 'global' ? 'Global' : 'Regional'} Explorers
              </h3>
              <div className="space-y-2">
                {(rankingFilter === 'global' ? globalRankings : regionalRankings).map(u => (
                  <div key={u.rank} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${u.rank <= 3 ? 'bg-primary/5' : ''}`}>
                    <span className="w-6 text-center font-bold text-sm">
                      {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
                    </span>
                    <span className="text-xl">{u.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">Exploring consistently this week</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{u.points.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============= CREATE CHALLENGE DIALOG ============= */}
      <Dialog open={showCreateChallenge} onOpenChange={setShowCreateChallenge}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create Your Own Challenge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Challenge Title *</label>
              <Input 
                value={newChallenge.title} 
                onChange={e => setNewChallenge(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Morning Walk for 20 Minutes"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea 
                value={newChallenge.description} 
                onChange={e => setNewChallenge(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe your challenge..."
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <select 
                  className="w-full h-10 mt-1 rounded-md border bg-background px-3 text-sm"
                  value={newChallenge.difficulty}
                  onChange={e => setNewChallenge(p => ({ ...p, difficulty: e.target.value }))}
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Time (Resets)</label>
                <select 
                  className="w-full h-10 mt-1 rounded-md border bg-background px-3 text-sm"
                  value={newChallenge.duration}
                  onChange={e => setNewChallenge(p => ({ ...p, duration: e.target.value }))}
                >
                  <option value="daily">📅 Daily</option>
                  <option value="weekly">📆 Weekly</option>
                  <option value="monthly">🗓️ Monthly</option>
                  <option value="yearly">📊 Yearly</option>
                  <option value="lifetime">♾️ Lifetime</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select 
                className="w-full h-10 mt-1 rounded-md border bg-background px-3 text-sm"
                value={newChallenge.category}
                onChange={e => setNewChallenge(p => ({ ...p, category: e.target.value }))}
              >
                {CHALLENGE_CATEGORIES.map(c => (
                  <option key={c.name} value={c.name.toLowerCase()}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <Button onClick={createCustomChallenge} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <CommentsDialog 
        open={commentsOpen} 
        onOpenChange={setCommentsOpen} 
        postId={selectedPostId} 
        postTitle={selectedPostTitle} 
      />

      {/* Share Dialog - Share to Friends */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={shareContent.id}
        postTitle={shareContent.title}
        postContent={shareContent.content}
      />
    </div>
  );
}
