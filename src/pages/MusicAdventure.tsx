import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  MapPin, Star, Heart, Navigation, Target, Compass, Map, Globe, 
  Plus, Check, Share2, MessageCircle, Footprints, 
  Award, Plane, Sparkles, Filter, X, Clock, CalendarDays,
  RefreshCw, Users, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CommentsDialog } from '@/components/CommentsDialog';

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

  // Generate challenges from all categories
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

  // Generate more to reach 500+
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

// ============= GENERATE 200+ DISCOVER PLACES PER COUNTRY =============
const generateDiscoverPlaces = () => {
  const places: any[] = [];
  
  const countries = [
    { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'US', name: 'USA', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' }
  ];

  const placeTypes = [
    { type: 'temple', icon: '🛕', names: ['Ancient Temple', 'Sacred Shrine', 'Holy Sanctuary', 'Historic Temple', 'Prayer Hall'] },
    { type: 'mountain', icon: '⛰️', names: ['Mountain Peak', 'Highland Trail', 'Summit View', 'Alpine Path', 'Rocky Heights'] },
    { type: 'lake', icon: '🏞️', names: ['Crystal Lake', 'Serene Waters', 'Mirror Lake', 'Blue Lagoon', 'Hidden Pond'] },
    { type: 'heritage', icon: '🏛️', names: ['Heritage Site', 'Ancient Ruins', 'Cultural Landmark', 'Historic Monument', 'Old Town'] },
    { type: 'wildlife', icon: '🦁', names: ['Wildlife Reserve', 'Safari Park', 'Nature Sanctuary', 'Animal Haven', 'Zoo Park'] },
    { type: 'beach', icon: '🏖️', names: ['Golden Beach', 'Sandy Shore', 'Coastal Paradise', 'Ocean View', 'Sunset Beach'] },
    { type: 'forest', icon: '🌲', names: ['Dense Forest', 'Green Woods', 'Nature Trail', 'Woodland Path', 'Jungle Walk'] },
    { type: 'waterfall', icon: '💧', names: ['Majestic Falls', 'Cascade Point', 'Water Wonder', 'Hidden Falls', 'River Drop'] },
    { type: 'viewpoint', icon: '👁️', names: ['Scenic View', 'Panorama Point', 'Lookout Tower', 'Sky Deck', 'Vista Point'] },
    { type: 'market', icon: '🛍️', names: ['Local Market', 'Night Bazaar', 'Street Market', 'Artisan Square', 'Food Street'] }
  ];

  let id = 1;
  countries.forEach(country => {
    // Generate 8+ places per country
    for (let i = 0; i < 8; i++) {
      const typeInfo = placeTypes[i % placeTypes.length];
      const nameIndex = Math.floor(Math.random() * typeInfo.names.length);
      places.push({
        id: `place-${id++}`,
        name: `${typeInfo.names[nameIndex]} of ${country.name}`,
        country: country.name,
        countryFlag: country.flag,
        type: typeInfo.type,
        icon: typeInfo.icon,
        stars: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        visits: Math.floor(Math.random() * 10000) + 100,
        hearts: Math.floor(Math.random() * 5000),
        comments: Math.floor(Math.random() * 100),
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(country.name)}+${encodeURIComponent(typeInfo.type)}`,
        description: `A beautiful ${typeInfo.type} destination in ${country.name}`
      });
    }
  });

  return places;
};

const DISCOVER_PLACES = generateDiscoverPlaces();

// ============= TRAVEL POSTS (SEPARATE FROM DISCOVER) =============
const TRAVEL_POSTS = [
  { id: 't1', title: 'Sunrise at the Mountains', content: 'Unforgettable view at dawn 🌄', image: '🌄', author: 'TravelLover', authorAvatar: 'T', likes: 1234, comments: 145 },
  { id: 't2', title: 'Beach Paradise Found', content: 'Crystal clear waters and golden sand ✨', image: '🏖️', author: 'BeachBum', authorAvatar: 'B', likes: 2567, comments: 289 },
  { id: 't3', title: 'Ancient Temple Discovery', content: 'History comes alive in these walls 🛕', image: '🛕', author: 'HistoryBuff', authorAvatar: 'H', likes: 1845, comments: 167 },
  { id: 't4', title: 'City Lights at Night', content: 'The city never sleeps 🌃', image: '🌃', author: 'NightOwl', authorAvatar: 'N', likes: 3456, comments: 378 },
  { id: 't5', title: 'Mountain Trek Complete', content: 'Reached the summit after 8 hours! 🏔️', image: '⛰️', author: 'HikeMaster', authorAvatar: 'H', likes: 4789, comments: 523 },
  { id: 't6', title: 'Local Food Adventure', content: 'Best street food ever tasted 🍜', image: '🍜', author: 'FoodieExplorer', authorAvatar: 'F', likes: 2321, comments: 254 },
  { id: 't7', title: 'Waterfall Wonder', content: 'Nature at its finest 💧', image: '💧', author: 'NatureLover', authorAvatar: 'N', likes: 3654, comments: 398 },
  { id: 't8', title: 'Desert Safari Experience', content: 'Golden dunes as far as eyes can see 🏜️', image: '🏜️', author: 'DesertRider', authorAvatar: 'D', likes: 2432, comments: 276 },
  { id: 't9', title: 'Northern Lights Magic', content: 'Once in a lifetime experience 🌌', image: '🌌', author: 'AuroraChaser', authorAvatar: 'A', likes: 5678, comments: 612 },
  { id: 't10', title: 'Village Life Captured', content: 'Simple living, high thinking 🏘️', image: '🏘️', author: 'RuralExplorer', authorAvatar: 'R', likes: 1987, comments: 198 },
];

// ============= COMPONENT =============
export default function MusicAdventure() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges');
  
  // Accordion filter states
  const [sourceFilter, setSourceFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
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
    
    // Check for challenge resets
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
    
    // Check if we need to reset daily challenges
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
      
      // Remove completed challenges that match reset durations
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
  const getFilteredChallenges = () => {
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
  };

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
        toast.success('✓ Marked as Visited! +1⭐');
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

  const shareContent = (title: string) => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
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

  const filteredChallenges = getFilteredChallenges();

  return (
    <div className="space-y-4 pb-20">
      {/* ============= CLEAN HEADER (NO MEDALS/RANKING AT TOP) ============= */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Adventure Zone
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explore challenges, discover places, and share your journey
        </p>
      </div>

      {/* ============= MAIN TABS (BELOW BANNER) ============= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50">
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
            {/* Source Filter: System / Custom ^ */}
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

            {/* Difficulty Filter: Easy / Medium / Hard ^ */}
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
                      className={`h-8 text-xs capitalize ${d === 'easy' ? 'hover:border-green-500' : d === 'medium' ? 'hover:border-yellow-500' : d === 'hard' ? 'hover:border-red-500' : ''}`}
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

            {/* Time Filter: Daily / Weekly / Monthly / Yearly / Lifetime ^ */}
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

          {/* Challenge Cards */}
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-2">
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
                            
                            {/* Tags */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <Badge variant="outline" className={`text-[10px] capitalize ${challenge.difficulty === 'easy' ? 'border-green-500/50 text-green-600' : challenge.difficulty === 'medium' ? 'border-yellow-500/50 text-yellow-600' : 'border-red-500/50 text-red-600'}`}>
                                {challenge.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] capitalize">{challenge.duration}</Badge>
                              <Badge variant="secondary" className="text-[10px] capitalize">{challenge.category}</Badge>
                            </div>
                            
                            {/* Social Actions (Like Posts) */}
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
                                onClick={() => shareContent(challenge.title)} 
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
          </ScrollArea>
        </TabsContent>

        {/* ============= DISCOVER TAB (200+ PLACES, 5⭐ RATING) ============= */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Discover Beautiful Places</h2>
            <p className="text-xs text-muted-foreground">Places worth remembering around the world • {DISCOVER_PLACES.length}+ places</p>
          </div>

          {/* Place Cards - Grid Layout (Different from Posts) */}
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-2 gap-3 pr-2">
              {DISCOVER_PLACES.slice(0, 50).map(place => {
                const isVisited = visitedPlaces.has(place.id);
                const isLoved = lovedPlaces.has(place.id);
                const userRating = userRatings[place.id] || 0;
                
                return (
                  <Card key={place.id} className={`glass-card overflow-hidden ${isVisited ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                    <CardContent className="p-3">
                      {/* Header with Icon & Flag */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{place.icon}</span>
                        <span className="text-sm">{place.countryFlag}</span>
                      </div>
                      
                      {/* Info */}
                      <p className="font-medium text-xs line-clamp-1">{place.name}</p>
                      <p className="text-[10px] text-muted-foreground">{place.country}</p>
                      
                      {/* 5-Star Rating System */}
                      <div className="flex items-center gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => ratePlace(place.id, s)} className="p-0.5">
                            <Star className={`w-3.5 h-3.5 transition-colors ${(userRating || Math.round(place.stars)) >= s ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                          </button>
                        ))}
                        <span className="text-[9px] text-muted-foreground ml-1">{place.stars}</span>
                      </div>
                      
                      {/* Visit Count */}
                      <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {place.visits.toLocaleString()} visits
                      </p>
                      
                      {/* Actions (Like Posts) */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                        <button 
                          onClick={() => togglePlaceVisit(place.id)} 
                          className={`flex items-center gap-1 text-[10px] ${isVisited ? 'text-green-500' : 'text-muted-foreground'}`}
                        >
                          <Footprints className="w-3 h-3" />
                          {isVisited ? '✓ Visited' : 'Visit'}
                        </button>
                        <button 
                          onClick={() => togglePlaceLove(place.id)} 
                          className={`${isLoved ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          <Heart className={`w-3 h-3 ${isLoved ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => openComments(place.id, place.name)} className="text-muted-foreground">
                          <MessageCircle className="w-3 h-3" />
                        </button>
                        <button onClick={() => shareContent(place.name)} className="text-muted-foreground">
                          <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============= TRAVEL TAB (SEPARATE, POST LAYOUT) ============= */}
        <TabsContent value="travel" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Travel Stories</h2>
            <p className="text-xs text-muted-foreground">Share moments from your journey</p>
          </div>

          {/* Travel Posts - Same Layout as Regular Posts */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-2">
              {TRAVEL_POSTS.map(post => {
                const isLiked = likedPosts.has(post.id);
                return (
                  <Card key={post.id} className="glass-card">
                    <CardContent className="p-4">
                      {/* Author */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                          {post.authorAvatar}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{post.author}</p>
                          <p className="text-[10px] text-muted-foreground">Travel Story</p>
                        </div>
                      </div>
                      
                      {/* Content Image */}
                      <div className="text-6xl text-center py-8 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg mb-3">
                        {post.image}
                      </div>
                      
                      {/* Title & Content */}
                      <p className="font-semibold text-sm">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{post.content}</p>
                      
                      {/* Actions (Like Posts) */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePostLike(post.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{post.likes + (isLiked ? 1 : 0)}</span>
                        </button>
                        <button 
                          onClick={() => openComments(post.id, post.title)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comments}</span>
                        </button>
                        <button 
                          onClick={() => shareContent(post.title)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ============= RANKING TAB (SOFT & FRIENDLY, AT BOTTOM) ============= */}
        <TabsContent value="ranking" className="mt-4 space-y-4">
          <div className="text-center mb-4">
            <h2 className="font-semibold text-lg">Active Explorers</h2>
            <p className="text-xs text-muted-foreground">People exploring the most right now</p>
          </div>

          {/* Filter: Global / Regional */}
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

          {/* Your Rank Card (Always Visible) */}
          <Card className="glass-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">Your Rank</p>
              <p className="text-3xl font-bold text-primary mt-1">#{userRank}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep going, you're doing great 💚
              </p>
              <p className="text-sm font-medium mt-2">{userPoints} points</p>
            </CardContent>
          </Card>

          {/* Top 10 List */}
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
        <DialogContent className="max-w-md">
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
    </div>
  );
}
