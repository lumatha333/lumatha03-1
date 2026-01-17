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
  RefreshCw, Users, ExternalLink, Image, Video
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdventureCommentsDialog } from '@/components/AdventureCommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';

// ============= CHALLENGE CATEGORIES =============
const CHALLENGE_CATEGORIES = [
  { name: 'Health', icon: '💚' },
  { name: 'Fitness', icon: '🏃' },
  { name: 'Mind', icon: '🧠' },
  { name: 'Learning', icon: '📚' },
  { name: 'Lifestyle', icon: '🌟' },
  { name: 'Travel', icon: '✈️' }
];

// ============= GENERATE 500+ UNIQUE SYSTEM CHALLENGES =============
const generateSystemChallenges = () => {
  const challenges: any[] = [];
  let id = 1;
  
  const tasksByCategory: Record<string, string[]> = {
    health: [
      'Drink 2L of water today', 'Sleep 8 hours tonight', 'Take your vitamins', 'Eat 5 servings of fruits', 'Walk 10,000 steps',
      'Practice 10-min meditation', 'No sugar for 24 hours', 'Drink green tea twice', 'Eat a colorful salad', 'Stay hydrated every hour',
      'Stretch for 15 minutes', 'Avoid processed foods', 'Eat mindfully today', 'Take a 20-min power nap', 'Do deep breathing 5 times',
      'Drink lemon water morning', 'Eat a healthy breakfast', 'No caffeine after 2pm', 'Eat rainbow vegetables', 'Track water intake all day',
      'Eat whole grain meals', 'Take breaks every hour', 'No snacking after 8pm', 'Eat probiotic foods', 'Write 3 gratitude items',
      'Limit screen to 2hrs', 'Sleep before 10pm', 'Wake with sunrise', 'Only drink water today', 'Eat omega-3 rich food',
      'Fast for 12 hours', 'Eat 30g protein breakfast', 'No artificial sweeteners', 'Chew food 30 times', 'Sit in sunlight 15min',
      'Practice box breathing', 'Do eye exercises', 'Massage temples 5min', 'Oil pulling morning', 'Cold shower 30 seconds',
      'Eat fermented foods', 'No alcohol today', 'Herbal tea before bed', 'Walk after meals', 'Stand every 30 minutes',
      'Foam roll muscles', 'Practice good posture', 'Hydrate before meals', 'Eat slowly mindfully', 'Digital sunset at 9pm'
    ],
    fitness: [
      'Complete 30 pushups', 'Run for 30 minutes', 'Do 50 bodyweight squats', 'Plank for 3 minutes total', 'Jump rope 200 times',
      'Complete yoga session', 'Do HIIT workout 20min', 'Swim 20 laps', 'Cycle 10km distance', 'Strength train upper body',
      'Core workout 15 minutes', 'Complete leg day routine', 'Upper body circuit', 'Flexibility stretching', 'Dance workout 30min',
      'Climb 20 flights stairs', 'Morning jog 3km', 'Evening walk 5km', 'Bodyweight circuit 3x', 'Complete 50 burpees',
      '100 mountain climbers', 'Walking lunges 3 sets', 'Arm workout routine', 'Back exercises 4 sets', 'Cardio blast 25min',
      'Balance training 10min', 'Resistance band workout', '50 kettlebell swings', 'Boxing workout 20min', 'Pilates full session',
      'Dead hang 2 minutes', 'Calf raises 100 total', 'Wall sits 5 minutes', 'Bear crawls 50 meters', 'Handstand practice',
      'Sprint intervals 10x', 'Pull-ups 3 sets max', 'Dips 30 total', 'Jumping jacks 200', 'High knees 3 minutes',
      'Bicycle crunches 100', 'Russian twists 60', 'Leg raises 50', 'Superman holds 5x30s', 'Glute bridges 50',
      'Side planks 2min each', 'Skipping 10 minutes', 'Rowing 2000m', 'Battle ropes 5 minutes', 'TRX workout 30min'
    ],
    mind: [
      'Journal for 15 minutes', 'Practice mindfulness walk', 'Solve a crossword puzzle', 'Learn a new skill today', 'Read for 45 minutes',
      'Digital detox 2 hours', 'Write gratitude journal', 'Visualization 10 minutes', 'Complete brain teaser', 'Play memory game 15min',
      'Self-reflection journaling', 'Set 3 weekly goals', 'Positive affirmations 10', 'Stress relief techniques', 'Creative thinking task',
      'Solve logic puzzle', 'Mind mapping session', 'Focus training 25min', 'Attention exercise 15min', 'Mental clarity meditation',
      'Emotional check-in journal', 'Self-discovery writing', 'Thought journaling 20min', 'Cognitive exercise set', 'Mental rest break',
      'Breathing meditation 15min', 'Body scan meditation', 'Loving kindness practice', 'Walking meditation 20min', 'Silent reflection hour',
      'Learn 20 new words', 'Practice a new language', 'Memorize a poem', 'Mental math practice', 'Observe without judgment',
      'Write future letter', 'Analyze a dream', 'Practice active listening', 'Mindful eating exercise', 'Gratitude meditation',
      'Creativity journaling', 'Problem solving exercise', 'Read philosophy article', 'Practice non-reaction', 'Mindful breathing 20min',
      'Stream of consciousness', 'Visual imagination 15min', 'Practice empathy exercise', 'Declutter mind dump', 'Evening reflection ritual'
    ],
    learning: [
      'Learn 15 vocabulary words', 'Watch TED talk & notes', 'Complete online course lesson', 'Read educational article', 'Practice new skill 1hr',
      'Language lesson 30min', 'Study focus session 2hr', 'Complete coding tutorial', 'Research interesting topic', 'Write detailed notes',
      'Learn basic coding concept', 'Study history chapter', 'Learn science facts', 'Financial literacy reading', 'Photography technique',
      'Music theory lesson', 'Art technique practice', 'Cook new recipe', 'DIY project complete', 'Creative writing practice',
      'Public speaking practice', 'Leadership reading', 'Communication skill work', 'Time management technique', 'Productivity method learn',
      'Excel new formula', 'Design principle study', 'Marketing concept learn', 'Business case study', 'Technical skill practice',
      'Learn chess strategy', 'Study geography facts', 'Practice instrument 30min', 'Calligraphy practice', 'Learn new software',
      'Study psychology concept', 'Economics basics read', 'Philosophy text study', 'Learn meditation type', 'Cultural learning',
      'Watch documentary & notes', 'Podcast learning 1 hour', 'Audiobook chapter', 'Memory technique practice', 'Speed reading exercise',
      'Learn origami pattern', 'Study architecture basics', 'Astronomy facts learn', 'Learn first aid skill', 'Environmental science read'
    ],
    lifestyle: [
      'Morning routine complete', 'Organize one room area', 'Plan entire week ahead', 'Connect with old friend', 'Random act of kindness',
      'Try new restaurant', 'Cook completely new dish', 'Declutter one drawer', 'Update wardrobe piece', 'Create daily routine',
      'Monthly budget review', 'Social media cleanup', 'Plant something new', 'Complete self-care ritual', 'Evening routine establish',
      'Morning ritual perfect', 'Weekend plan complete', 'Hobby time 2 hours', 'Quality family time', 'Friend meetup organize',
      'Nature walk 1 hour', 'Watch sunset mindfully', 'Plan a picnic day', 'Movie night organize', 'Game night host',
      'Start book club', 'Coffee date arrange', 'Shop consciously', 'Meal prep Sunday', 'Home improvement task',
      'Write thank you note', 'Call family member', 'Help a neighbor', 'Donate unused items', 'Clean digital files',
      'Update passwords', 'Backup important files', 'Organize photos', 'Plan dream trip', 'Create vision board',
      'Write bucket list', 'Set monthly goals', 'Track expenses today', 'No shopping challenge', 'Minimalism practice',
      'Capsule wardrobe plan', 'Sustainable swap make', 'Zero waste day try', 'Local business support', 'Handwritten letter send'
    ],
    travel: [
      'Visit local landmark', 'Explore new neighborhood', 'Try authentic local cuisine', 'Take scenic photographs', 'Talk to local residents',
      'Visit local museum', 'Explore city park', 'Historical site exploration', 'Beach day adventure', 'Mountain hiking trip',
      'City walking tour 3hrs', 'Cultural experience attend', 'Local market exploration', 'Visit religious site', 'Art gallery visit',
      'Nature reserve walk', 'Waterfall expedition', 'Sunrise spot discovery', 'Sunset viewpoint visit', 'Hidden gem find',
      'Food tour experience', 'Night market explore', 'Street food adventure', 'Local festival attend', 'Traditional event join',
      'Boat ride experience', 'Cable car journey', 'Scenic train ride', 'Road trip day', 'Camping night out',
      'Star gazing location', 'Bird watching spot', 'Botanical garden visit', 'Zoo exploration', 'Aquarium visit',
      'Castle exploration', 'Ancient ruins visit', 'Bridge walk famous', 'Tower climb', 'Underground tour',
      'Wine region visit', 'Coffee plantation tour', 'Farm visit experience', 'Fishing village explore', 'Island hopping',
      'Desert experience', 'Rainforest walk', 'Glacier viewing', 'Hot springs visit', 'Northern lights chase'
    ]
  };

  const durations = ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'];
  const categoryIcons: Record<string, string> = {
    health: '💚', fitness: '🏃', mind: '🧠', learning: '📚', lifestyle: '🌟', travel: '✈️'
  };

  // Add all base challenges (300 total - 50 per category)
  Object.entries(tasksByCategory).forEach(([category, tasks]) => {
    tasks.forEach((task, i) => {
      const dur = durations[i % 5];
      challenges.push({
        id: `sys-${id++}`,
        title: task,
        description: `Complete this ${category} challenge`,
        category,
        categoryIcon: categoryIcons[category],
        duration: dur,
        type: 'system',
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString()
      });
    });
  });

  // Generate 200 more unique challenges
  const extraChallenges = [
    { cat: 'health', tasks: ['Drink herbal infusion', 'Practice qi gong', 'Do lymphatic drainage', 'Try acupressure points', 'Practice earthing barefoot', 'Use blue light glasses', 'Try intermittent fasting', 'Eat anti-inflammatory foods', 'Practice nasal breathing', 'Do facial exercises', 'Try contrast therapy', 'Practice tongue scraping', 'Use essential oils', 'Try sound healing', 'Practice dry brushing', 'Do neck stretches', 'Try reflexology points', 'Practice eye yoga', 'Use meditation app', 'Try sensory deprivation', 'Practice gratitude walk', 'Do spinal twists', 'Try mushroom coffee', 'Practice humming meditation', 'Do jaw exercises', 'Try grounding exercises', 'Practice breathwork', 'Do wrist stretches', 'Try aromatherapy session', 'Practice self-massage', 'Do ankle mobility', 'Try cold exposure', 'Practice sun salutations'] },
    { cat: 'fitness', tasks: ['Try animal flow', 'Practice mobility drills', 'Do tabata workout', 'Try functional training', 'Practice parkour basics', 'Do flexibility routine', 'Try crossfit WOD', 'Practice gymnastics holds', 'Do agility ladder', 'Try plyometric jumps', 'Practice martial arts', 'Do isometric holds', 'Try outdoor bootcamp', 'Practice calisthenics', 'Do suspension training', 'Try aqua aerobics', 'Practice rock climbing', 'Do sprint training', 'Try obstacle course', 'Practice kickboxing', 'Do strongman exercise', 'Try aerial yoga', 'Practice acro yoga', 'Do powerlifting set', 'Try Olympic lifts', 'Practice stretching routine', 'Do bodybuilding split', 'Try endurance run', 'Practice interval training', 'Do compound movements', 'Try circuit training', 'Practice muscle ups', 'Do pistol squat work'] },
    { cat: 'mind', tasks: ['Practice noting meditation', 'Try transcendental meditation', 'Do progressive relaxation', 'Practice yoga nidra', 'Try binaural beats session', 'Practice concentration meditation', 'Do contemplation exercise', 'Try zen meditation', 'Practice insight meditation', 'Do mantra repetition', 'Try chakra meditation', 'Practice object meditation', 'Do candle gazing', 'Try third eye focus', 'Practice heart meditation', 'Do color visualization', 'Try music meditation', 'Practice movement meditation', 'Do nature meditation', 'Try labyrinth walking', 'Practice gratitude meditation', 'Do compassion meditation', 'Try forgiveness practice', 'Practice joy meditation', 'Do peace meditation', 'Try abundance meditation', 'Practice healing visualization', 'Do inner child work', 'Try past life meditation', 'Practice future self meeting', 'Do shadow work journal', 'Try archetypal meditation', 'Practice element meditation'] },
    { cat: 'learning', tasks: ['Learn sign language basics', 'Study quantum physics intro', 'Practice digital art', 'Learn video editing', 'Study blockchain basics', 'Practice 3D modeling', 'Learn AI fundamentals', 'Study data science intro', 'Practice web development', 'Learn mobile app basics', 'Study UX design', 'Practice graphic design', 'Learn animation basics', 'Study game development', 'Practice music production', 'Learn podcast creation', 'Study content marketing', 'Practice copywriting', 'Learn SEO basics', 'Study social media strategy', 'Practice email marketing', 'Learn analytics tools', 'Study project management', 'Practice agile methodology', 'Learn negotiation skills', 'Study sales techniques', 'Practice presentation skills', 'Learn networking strategy', 'Study personal branding', 'Practice storytelling', 'Learn conflict resolution', 'Study emotional intelligence', 'Practice decision making'] },
    { cat: 'lifestyle', tasks: ['Create morning pages', 'Practice bullet journaling', 'Do financial planning', 'Practice minimalist living', 'Create capsule wardrobe', 'Practice slow living', 'Do digital minimalism', 'Practice intentional living', 'Create life audit', 'Practice essentialism', 'Do values clarification', 'Practice boundary setting', 'Create life purpose statement', 'Practice saying no', 'Do relationship audit', 'Practice active rest', 'Create weekly review', 'Practice time blocking', 'Do energy audit', 'Practice batching tasks', 'Create systems thinking', 'Practice habit stacking', 'Do environment design', 'Practice temptation bundling', 'Create accountability system', 'Practice implementation intentions', 'Do identity-based habits', 'Practice keystone habits', 'Create trigger plan', 'Practice pre-commitment', 'Do friction reduction', 'Practice reward scheduling', 'Create habit scorecard'] },
    { cat: 'travel', tasks: ['Try local homestay', 'Practice travel sketching', 'Do volunteer tourism', 'Practice slow travel', 'Try workation setup', 'Practice cultural immersion', 'Do eco-tourism activity', 'Practice responsible travel', 'Try adventure travel', 'Practice solo exploration', 'Do budget backpacking', 'Practice luxury travel hack', 'Try glamping experience', 'Practice digital nomad life', 'Do travel photography', 'Practice travel journaling', 'Try culinary tourism', 'Practice wellness travel', 'Do heritage exploration', 'Practice pilgrimage route', 'Try wildlife safari', 'Practice marine exploration', 'Do mountain expedition', 'Practice river journey', 'Try desert adventure', 'Practice arctic exploration', 'Do tropical discovery', 'Practice countryside tour', 'Try urban exploration', 'Practice architectural tour', 'Do art tourism', 'Practice music tourism', 'Try sports tourism'] }
  ];

  extraChallenges.forEach(({ cat, tasks }) => {
    tasks.forEach((task, i) => {
      challenges.push({
        id: `sys-${id++}`,
        title: task,
        description: `${cat.charAt(0).toUpperCase() + cat.slice(1)} adventure awaits`,
        category: cat,
        categoryIcon: categoryIcons[cat],
        duration: durations[i % 5],
        type: 'system',
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString()
      });
    });
  });

  return challenges;
};

const SYSTEM_CHALLENGES = generateSystemChallenges();

// ============= 200 COUNTRIES WITH 5 GENUINE PLACES EACH =============
const ALL_COUNTRIES = [
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', places: ['Mount Everest Base Camp', 'Pashupatinath Temple', 'Boudhanath Stupa', 'Phewa Lake Pokhara', 'Chitwan National Park'] },
  { code: 'IN', name: 'India', flag: '🇮🇳', places: ['Taj Mahal', 'Varanasi Ghats', 'Jaipur Hawa Mahal', 'Kerala Backwaters', 'Golden Temple Amritsar'] },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', places: ['Mount Fuji', 'Fushimi Inari Shrine', 'Tokyo Tower', 'Kyoto Bamboo Grove', 'Hiroshima Peace Memorial'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', places: ['Eiffel Tower', 'Louvre Museum', 'Mont Saint-Michel', 'French Riviera Nice', 'Palace of Versailles'] },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', places: ['Colosseum Rome', 'Venice Canals', 'Amalfi Coast', 'Florence Duomo', 'Cinque Terre'] },
  { code: 'US', name: 'USA', flag: '🇺🇸', places: ['Grand Canyon', 'Statue of Liberty', 'Yellowstone Park', 'Golden Gate Bridge', 'Times Square NYC'] },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', places: ['Sydney Opera House', 'Great Barrier Reef', 'Uluru', 'Great Ocean Road', 'Bondi Beach'] },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', places: ['Grand Palace Bangkok', 'Phi Phi Islands', 'Wat Arun Temple', 'Chiang Mai Temples', 'James Bond Island'] },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', places: ['Pyramids of Giza', 'Valley of the Kings', 'Abu Simbel Temples', 'Karnak Temple', 'Red Sea Hurghada'] },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', places: ['Christ the Redeemer', 'Iguazu Falls', 'Copacabana Beach', 'Amazon Rainforest', 'Sugarloaf Mountain'] },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', places: ['Sagrada Familia', 'Alhambra Granada', 'Park Güell', 'Plaza de España Seville', 'La Rambla Barcelona'] },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', places: ['Big Ben Parliament', 'Tower of London', 'Stonehenge', 'Edinburgh Castle', 'Buckingham Palace'] },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', places: ['Brandenburg Gate', 'Neuschwanstein Castle', 'Cologne Cathedral', 'Black Forest', 'Berlin Wall Memorial'] },
  { code: 'CN', name: 'China', flag: '🇨🇳', places: ['Great Wall of China', 'Forbidden City', 'Terracotta Army', 'Li River Guilin', 'The Bund Shanghai'] },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', places: ['Acropolis Athens', 'Santorini', 'Mykonos', 'Delphi', 'Meteora Monasteries'] },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', places: ['Hagia Sophia', 'Cappadocia', 'Pamukkale', 'Blue Mosque', 'Ephesus Ancient City'] },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', places: ['Burj Khalifa', 'Sheikh Zayed Mosque', 'Palm Jumeirah', 'Dubai Mall', 'Dubai Marina'] },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', places: ['Table Mountain', 'Kruger National Park', 'Cape of Good Hope', 'Garden Route', 'Robben Island'] },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', places: ['Chichen Itza', 'Cancun Beaches', 'Teotihuacan', 'Tulum Ruins', 'Guanajuato City'] },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', places: ['Niagara Falls', 'Banff National Park', 'CN Tower Toronto', 'Lake Louise', 'Vancouver Stanley Park'] },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', places: ['Red Square Moscow', 'Hermitage Museum', 'Saint Basil Cathedral', 'Lake Baikal', 'Peterhof Palace'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', places: ['Iguazu Falls Argentina', 'Buenos Aires Obelisk', 'Perito Moreno Glacier', 'Mendoza Vineyards', 'Ushuaia End of World'] },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', places: ['Machu Picchu', 'Cusco Historic Center', 'Rainbow Mountain', 'Lake Titicaca', 'Nazca Lines'] },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', places: ['Milford Sound', 'Hobbiton Movie Set', 'Queenstown', 'Bay of Islands', 'Rotorua Geothermal'] },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', places: ['Bali Rice Terraces', 'Borobudur Temple', 'Komodo Island', 'Raja Ampat', 'Mount Bromo'] },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', places: ['Ha Long Bay', 'Hoi An Ancient Town', 'Cu Chi Tunnels', 'Sapa Rice Terraces', 'Mekong Delta'] },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', places: ['Petronas Towers', 'Langkawi Island', 'Batu Caves', 'Georgetown Penang', 'Mount Kinabalu'] },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', places: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Orchard Road', 'Merlion Park'] },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', places: ['Boracay Beach', 'Chocolate Hills Bohol', 'Palawan Underground River', 'Banaue Rice Terraces', 'Mayon Volcano'] },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', places: ['Gyeongbokgung Palace', 'Jeju Island', 'Bukchon Hanok Village', 'DMZ Tour', 'Namsan Tower Seoul'] },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', places: ['Victoria Peak', 'Star Ferry Harbor', 'Tian Tan Buddha', 'Temple Street Market', 'Hong Kong Disneyland'] },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', places: ['Taipei 101', 'Jiufen Old Street', 'Sun Moon Lake', 'Taroko Gorge', 'Alishan Mountain'] },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', places: ['Angkor Wat', 'Bayon Temple', 'Ta Prohm Temple', 'Phnom Penh Palace', 'Tonle Sap Lake'] },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', places: ['Bagan Temples', 'Shwedagon Pagoda', 'Inle Lake', 'Mandalay Hill', 'Golden Rock Pagoda'] },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', places: ['Luang Prabang', 'Kuang Si Falls', 'Pak Ou Caves', 'Vientiane That Luang', 'Plain of Jars'] },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', places: ['Sigiriya Rock Fortress', 'Temple of Tooth', 'Ella Nine Arch Bridge', 'Galle Fort', 'Yala National Park'] },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻', places: ['Male Atoll', 'Underwater Restaurant', 'Bioluminescent Beach', 'Manta Ray Point', 'Banana Reef'] },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹', places: ['Tiger Nest Monastery', 'Punakha Dzong', 'Buddha Dordenma', 'Thimphu Tashichho Dzong', 'Dochula Pass'] },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', places: ['Badshahi Mosque', 'Hunza Valley', 'Fairy Meadows', 'Mohenjo Daro', 'Faisal Mosque'] },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', places: ['Sundarbans Mangroves', 'Lalbagh Fort', 'Cox Bazar Beach', 'Sixty Dome Mosque', 'Paharpur Ruins'] },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫', places: ['Blue Mosque Mazar', 'Bamiyan Valley', 'Band-e-Amir Lakes', 'Kabul Museum', 'Citadel of Herat'] },
  { code: 'IR', name: 'Iran', flag: '🇮🇷', places: ['Persepolis', 'Nasir al-Mulk Mosque', 'Isfahan Square', 'Golestan Palace', 'Yazd Old Town'] },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶', places: ['Erbil Citadel', 'Babylon Ruins', 'Imam Hussein Shrine', 'Ziggurat of Ur', 'Baghdad Museum'] },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', places: ['Mecca Grand Mosque', 'Medina Prophet Mosque', 'Mada in Saleh', 'Edge of the World', 'Jeddah Old Town'] },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', places: ['Petra Treasury', 'Dead Sea', 'Wadi Rum Desert', 'Jerash Ruins', 'Amman Citadel'] },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', places: ['Western Wall', 'Dead Sea Israel', 'Tel Aviv Beach', 'Masada Fortress', 'Sea of Galilee'] },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸', places: ['Church of Nativity', 'Dome of the Rock', 'Jericho', 'Hebron Old City', 'Ramallah Cultural Palace'] },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', places: ['Baalbek Temples', 'Jeita Grotto', 'Byblos Ancient City', 'Beirut Corniche', 'Cedars of God'] },
  { code: 'SY', name: 'Syria', flag: '🇸🇾', places: ['Damascus Old City', 'Palmyra Ruins', 'Aleppo Citadel', 'Krak des Chevaliers', 'Umayyad Mosque'] },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', places: ['Sultan Qaboos Mosque', 'Wahiba Sands', 'Wadi Shab', 'Nizwa Fort', 'Musandam Fjords'] },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪', places: ['Shibam Mud Towers', 'Socotra Island', 'Sanaa Old City', 'Aden Harbor', 'Dar al-Hajar Palace'] },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', places: ['Museum of Islamic Art', 'The Pearl Qatar', 'Souq Waqif', 'Katara Cultural Village', 'Aspire Tower'] },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', places: ['Bahrain Fort', 'Al Fateh Mosque', 'Tree of Life', 'Manama Souq', 'Bahrain World Trade Center'] },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', places: ['Kuwait Towers', 'Grand Mosque Kuwait', 'Liberation Tower', 'Souq Al-Mubarakiya', 'Failaka Island'] },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', places: ['Paphos Archaeological', 'Kyrenia Castle', 'Troodos Mountains', 'Limassol Marina', 'Ayia Napa Beaches'] },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪', places: ['Tbilisi Old Town', 'Gergeti Trinity Church', 'Uplistsikhe Cave Town', 'Batumi Boulevard', 'Vardzia Cave Monastery'] },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲', places: ['Tatev Monastery', 'Geghard Monastery', 'Lake Sevan', 'Yerevan Cascade', 'Noravank Monastery'] },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', places: ['Flame Towers Baku', 'Old City Baku', 'Gobustan Rock Art', 'Heydar Aliyev Center', 'Yanar Dag Fire Mountain'] },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', places: ['Astana Bayterek Tower', 'Charyn Canyon', 'Big Almaty Lake', 'Khan Shatyr', 'Turkestan Mausoleum'] },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', places: ['Registan Square', 'Samarkand Mosques', 'Bukhara Old Town', 'Khiva Ichan-Kala', 'Tashkent Metro Stations'] },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲', places: ['Darvaza Gas Crater', 'Ashgabat White City', 'Ancient Merv', 'Neutrality Monument', 'Yangykala Canyon'] },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', places: ['Iskanderkul Lake', 'Pamir Highway', 'Dushanbe Rudaki Park', 'Seven Lakes Fann', 'Hisor Fortress'] },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', places: ['Issyk-Kul Lake', 'Burana Tower', 'Ala Archa Park', 'Song Kol Lake', 'Tash Rabat Caravanserai'] },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳', places: ['Genghis Khan Statue', 'Gobi Desert', 'Ulaanbaatar Square', 'Khuvsgul Lake', 'Terelj National Park'] },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', places: ['Wawel Castle Krakow', 'Warsaw Old Town', 'Wieliczka Salt Mine', 'Auschwitz Memorial', 'Malbork Castle'] },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', places: ['Prague Castle', 'Charles Bridge', 'Old Town Square Prague', 'Cesky Krumlov', 'Karlovy Vary Spas'] },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', places: ['Schönbrunn Palace', 'Hallstatt Village', 'Vienna State Opera', 'Salzburg Old Town', 'Belvedere Palace'] },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', places: ['Parliament Budapest', 'Buda Castle', 'Chain Bridge', 'Fishermans Bastion', 'Széchenyi Baths'] },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', places: ['Bratislava Castle', 'High Tatras Mountains', 'Spiš Castle', 'Bojnice Castle', 'Vlkolínec Village'] },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', places: ['Bran Castle', 'Peles Castle', 'Parliament Palace Bucharest', 'Transfagarasan Road', 'Painted Monasteries'] },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', places: ['Rila Monastery', 'Sofia Alexander Nevsky', 'Plovdiv Old Town', 'Seven Rila Lakes', 'Veliko Tarnovo'] },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', places: ['Dubrovnik Walls', 'Plitvice Lakes', 'Split Diocletian Palace', 'Hvar Island', 'Zagreb Cathedral'] },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', places: ['Lake Bled', 'Ljubljana Castle', 'Postojna Cave', 'Predjama Castle', 'Triglav National Park'] },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸', places: ['Belgrade Fortress', 'Novi Sad Petrovaradin', 'Studenica Monastery', 'Đavolja Varoš', 'Tara National Park'] },
  { code: 'BA', name: 'Bosnia Herzegovina', flag: '🇧🇦', places: ['Mostar Old Bridge', 'Sarajevo Bascarsija', 'Kravice Waterfalls', 'Blagaj Tekke', 'Jajce Waterfall'] },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪', places: ['Kotor Bay', 'Budva Old Town', 'Sveti Stefan', 'Durmitor National Park', 'Ostrog Monastery'] },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰', places: ['Lake Ohrid', 'Skopje Old Bazaar', 'Matka Canyon', 'St Naum Monastery', 'Kokino Observatory'] },
  { code: 'AL', name: 'Albania', flag: '🇦🇱', places: ['Albanian Riviera', 'Berat White City', 'Blue Eye Spring', 'Gjirokaster Castle', 'Tirana Skanderbeg Square'] },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰', places: ['Pristina Newborn', 'Prizren Old Town', 'Visoki Dečani Monastery', 'Germia Park', 'Mirusha Waterfalls'] },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', places: ['Saint Sophia Cathedral', 'Lviv Old Town', 'Kyiv Pechersk Lavra', 'Carpathian Mountains', 'Odessa Steps'] },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾', places: ['Mir Castle', 'Nesvizh Palace', 'Minsk Victory Square', 'Belovezhskaya Pushcha', 'Brest Fortress'] },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩', places: ['Orheiul Vechi Monastery', 'Milestii Mici Winery', 'Chisinau Cathedral', 'Soroca Fortress', 'Tipova Monastery'] },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', places: ['Vilnius Old Town', 'Trakai Island Castle', 'Hill of Crosses', 'Curonian Spit', 'Kaunas Castle'] },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', places: ['Riga Old Town', 'Jurmala Beach', 'Rundale Palace', 'Sigulda Castles', 'Gauja National Park'] },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', places: ['Tallinn Old Town', 'Lahemaa National Park', 'Alexander Nevsky Cathedral', 'Saaremaa Island', 'Tartu University'] },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', places: ['Helsinki Cathedral', 'Santa Claus Village', 'Suomenlinna Fortress', 'Northern Lights Lapland', 'Olavinlinna Castle'] },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', places: ['Stockholm Old Town', 'Vasa Museum', 'ABBA Museum', 'Drottningholm Palace', 'Kiruna Ice Hotel'] },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', places: ['Geirangerfjord', 'Trolltunga Rock', 'Bergen Bryggen', 'Oslo Viking Ship', 'Preikestolen Pulpit Rock'] },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', places: ['Nyhavn Copenhagen', 'Tivoli Gardens', 'Little Mermaid', 'Kronborg Castle', 'Legoland Billund'] },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', places: ['Blue Lagoon', 'Golden Circle', 'Hallgrimskirkja', 'Jökulsárlón Glacier', 'Seljalandsfoss Waterfall'] },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', places: ['Cliffs of Moher', 'Dublin Temple Bar', 'Ring of Kerry', 'Giants Causeway', 'Blarney Castle'] },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', places: ['Amsterdam Canals', 'Van Gogh Museum', 'Keukenhof Gardens', 'Anne Frank House', 'Kinderdijk Windmills'] },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', places: ['Grand Place Brussels', 'Bruges Canals', 'Atomium', 'Ghent Historic Center', 'Antwerp Cathedral'] },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', places: ['Luxembourg Old Town', 'Vianden Castle', 'Bock Casemates', 'Mullerthal Trail', 'Grand Ducal Palace'] },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', places: ['Matterhorn Zermatt', 'Lake Geneva', 'Jungfraujoch', 'Lucerne Chapel Bridge', 'Rhine Falls'] },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮', places: ['Vaduz Castle', 'Malbun Ski Resort', 'Kunstmuseum', 'Red House Vaduz', 'Gutenberg Castle'] },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨', places: ['Monte Carlo Casino', 'Prince Palace Monaco', 'Oceanographic Museum', 'Monaco Grand Prix Track', 'Jardin Exotique'] },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲', places: ['Three Towers San Marino', 'Guaita Tower', 'Piazza della Libertà', 'Basilica di San Marino', 'Monte Titano'] },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦', places: ['St Peters Basilica', 'Sistine Chapel', 'Vatican Museums', 'St Peters Square', 'Apostolic Palace'] },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', places: ['Valletta Old Town', 'Blue Grotto', 'Mdina Silent City', 'Gozo Island', 'Hagar Qim Temples'] },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', places: ['Sintra Palace', 'Porto Ribeira', 'Belém Tower', 'Algarve Beaches', 'Pena Palace'] },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩', places: ['Vallnord Ski', 'Caldea Spa', 'Andorra la Vella', 'Sant Joan de Caselles', 'Madriu Valley'] },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', places: ['Marrakech Medina', 'Chefchaouen Blue City', 'Sahara Desert Merzouga', 'Fes El Bali', 'Hassan II Mosque'] },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', places: ['Casbah of Algiers', 'Timgad Roman Ruins', 'Sahara Tassili nAjjer', 'Constantine Bridges', 'Djémila Ruins'] },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', places: ['Carthage Ruins', 'Sidi Bou Said', 'El Jem Amphitheatre', 'Djerba Island', 'Sahara Star Wars Sites'] },
  { code: 'LY', name: 'Libya', flag: '🇱🇾', places: ['Leptis Magna', 'Sabratha Theater', 'Ghadames Old Town', 'Cyrene Ruins', 'Tripoli Red Castle'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', places: ['Masai Mara', 'Mount Kenya', 'Diani Beach', 'Nairobi National Park', 'Lake Nakuru Flamingos'] },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', places: ['Mount Kilimanjaro', 'Serengeti Migration', 'Zanzibar Beach', 'Ngorongoro Crater', 'Stone Town'] },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', places: ['Bwindi Gorillas', 'Murchison Falls', 'Source of Nile', 'Queen Elizabeth Park', 'Lake Bunyonyi'] },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', places: ['Volcanoes Gorilla Park', 'Kigali Memorial', 'Lake Kivu', 'Nyungwe Forest', 'Akagera Safari'] },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', places: ['Lalibela Churches', 'Simien Mountains', 'Danakil Depression', 'Axum Obelisks', 'Blue Nile Falls'] },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', places: ['Cape Coast Castle', 'Kakum National Park', 'Accra Independence Square', 'Mole National Park', 'Lake Volta'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', places: ['Lagos Beach', 'Zuma Rock', 'Yankari Game Reserve', 'Olumo Rock', 'Nike Art Gallery'] },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', places: ['Goree Island', 'Lake Retba Pink Lake', 'Dakar Monuments', 'Djoudj Bird Sanctuary', 'Saint-Louis Island'] },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲', places: ['Mount Cameroon', 'Waza National Park', 'Kribi Beaches', 'Limbe Wildlife', 'Reunification Monument'] },
  { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮', places: ['Basilica Yamoussoukro', 'Grand Bassam', 'Tai National Park', 'Assinie Beach', 'Man Mountains'] },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬', places: ['Avenue of Baobabs', 'Lemur Island', 'Tsingy de Bemaraha', 'Isalo National Park', 'Nosy Be Island'] },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺', places: ['Le Morne Brabant', 'Chamarel Seven Colors', 'Port Louis Waterfront', 'Ile aux Cerfs', 'Black River Gorges'] },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨', places: ['Anse Source dArgent', 'Vallée de Mai', 'Victoria Clock Tower', 'Praslin Island', 'Morne Seychellois'] },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦', places: ['Sossusvlei Dunes', 'Etosha National Park', 'Fish River Canyon', 'Skeleton Coast', 'Kolmanskop Ghost Town'] },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼', places: ['Okavango Delta', 'Chobe National Park', 'Makgadikgadi Pans', 'Central Kalahari', 'Moremi Game Reserve'] },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', places: ['Victoria Falls', 'Great Zimbabwe Ruins', 'Hwange National Park', 'Matobo Hills', 'Lake Kariba'] },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', places: ['Victoria Falls Zambia', 'South Luangwa', 'Lower Zambezi', 'Lake Tanganyika', 'Kafue National Park'] },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼', places: ['Lake Malawi', 'Liwonde National Park', 'Mount Mulanje', 'Majete Wildlife', 'Zomba Plateau'] },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', places: ['Bazaruto Archipelago', 'Mozambique Island', 'Gorongosa Park', 'Tofo Beach', 'Maputo City'] },
  { code: 'AO', name: 'Angola', flag: '🇦🇴', places: ['Kalandula Falls', 'Luanda Bay', 'Quiçama Park', 'Mussulo Island', 'Tundavala Gap'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', places: ['Torres del Paine', 'Easter Island', 'Atacama Desert', 'Valparaiso Hills', 'Patagonia Glaciers'] },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', places: ['Cartagena Old Town', 'Lost City Trek', 'Medellin Commune 13', 'Tayrona Park', 'Coffee Region'] },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨', places: ['Galapagos Islands', 'Quito Historic Center', 'Cotopaxi Volcano', 'Amazon Rainforest', 'Baños Waterfalls'] },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪', places: ['Angel Falls', 'Los Roques', 'Mount Roraima', 'Canaima National Park', 'Mérida Cable Car'] },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴', places: ['Salar de Uyuni', 'La Paz Witches Market', 'Lake Titicaca Bolivia', 'Death Road', 'Tiwanaku Ruins'] },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾', places: ['Jesuit Missions Trinidad', 'Asuncion Cathedral', 'Iguazu Falls Paraguay', 'Itaipu Dam', 'Chaco Region'] },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾', places: ['Colonia del Sacramento', 'Punta del Este', 'Montevideo Rambla', 'Cabo Polonio', 'Salto Hot Springs'] },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾', places: ['Kaieteur Falls', 'Georgetown Stabroek', 'Iwokrama Rainforest', 'Shell Beach', 'Rupununi Savannah'] },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷', places: ['Paramaribo Waterfront', 'Brownsberg Nature', 'Central Suriname Reserve', 'Galibi Turtles', 'Jodensavanne'] },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷', places: ['Arenal Volcano', 'Manuel Antonio', 'Monteverde Cloud Forest', 'Tortuguero Park', 'La Fortuna Waterfall'] },
  { code: 'PA', name: 'Panama', flag: '🇵🇦', places: ['Panama Canal', 'San Blas Islands', 'Casco Viejo', 'Bocas del Toro', 'Boquete Highlands'] },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮', places: ['Granada Colonial', 'Ometepe Island', 'Leon Cathedral', 'Corn Islands', 'Masaya Volcano'] },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳', places: ['Copan Mayan Ruins', 'Roatan Island', 'Utila Diving', 'La Tigra Cloud Forest', 'Pico Bonito'] },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻', places: ['Joya de Ceren', 'El Tunco Beach', 'Ruta de las Flores', 'Santa Ana Volcano', 'Suchitoto Town'] },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹', places: ['Tikal Mayan Ruins', 'Lake Atitlan', 'Antigua Guatemala', 'Semuc Champey', 'Chichicastenango Market'] },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿', places: ['Great Blue Hole', 'Caye Caulker', 'Xunantunich Ruins', 'Actun Tunichil Cave', 'Cockscomb Jaguar'] },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲', places: ['Dunns River Falls', 'Seven Mile Beach', 'Blue Mountains', 'Bob Marley Museum', 'Luminous Lagoon'] },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺', places: ['Havana Old Town', 'Viñales Valley', 'Trinidad Colonial', 'Varadero Beach', 'El Morro Castle'] },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹', places: ['Citadelle Laferrière', 'Labadee Beach', 'Jacmel Town', 'Sans-Souci Palace', 'Bassin Bleu'] },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴', places: ['Punta Cana Beach', 'Santo Domingo Colonial', 'Los Haitises Park', 'Samana Peninsula', 'Puerto Plata'] },
  { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷', places: ['Old San Juan', 'El Yunque Rainforest', 'Bioluminescent Bays', 'Flamenco Beach', 'El Morro Fortress'] },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸', places: ['Nassau Paradise Island', 'Exuma Pigs', 'Atlantis Resort', 'Eleuthera Pink Sands', 'Andros Blue Holes'] },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧', places: ['Crane Beach', 'Harrisons Cave', 'Bridgetown Historic', 'Animal Flower Cave', 'Bathsheba Beach'] },
  { code: 'TT', name: 'Trinidad Tobago', flag: '🇹🇹', places: ['Maracas Beach', 'Caroni Bird Sanctuary', 'Pitch Lake', 'Tobago Pigeon Point', 'Asa Wright Nature'] },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', places: ['Mamanuca Islands', 'Yasawa Islands', 'Garden of the Sleeping Giant', 'Bouma Falls', 'Suva City'] },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', places: ['To Sua Ocean Trench', 'Piula Cave Pool', 'Lalomanu Beach', 'Robert Louis Stevenson Museum', 'Papapapaitai Falls'] },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', places: ['Humpback Whale Watching', 'Haapai Islands', 'Mapu a Vaea Blowholes', 'Royal Palace Nukualofa', 'Eneio Botanical Gardens'] },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', places: ['Mount Yasur Volcano', 'Blue Lagoon Espiritu', 'Champagne Beach', 'Port Vila Markets', 'Pentecost Land Diving'] },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', places: ['Marovo Lagoon', 'Munda WWII Sites', 'Skull Island', 'Kennedy Island', 'Tetepare Eco Lodge'] },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', places: ['Kokoda Track', 'Sepik River Culture', 'Tufi Diving', 'Mt Wilhelm Trek', 'Rabaul Volcano'] },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', places: ['Heart of Voh', 'Isle of Pines', 'Noumea Aquarium', 'Lifou Island', 'Blue River Park'] },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', places: ['Bora Bora Lagoon', 'Moorea Island', 'Tahiti Black Sand', 'Rangiroa Atoll', 'Fakarava UNESCO'] },
  { code: 'GL', name: 'Greenland', flag: '🇬🇱', places: ['Ilulissat Icefjord', 'Disko Bay Icebergs', 'Nuuk Capital', 'Kangerlussuaq', 'Northern Lights Greenland'] },
  { code: 'FO', name: 'Faroe Islands', flag: '🇫🇴', places: ['Mulafossur Waterfall', 'Saksun Village', 'Mykines Puffins', 'Tinganes Torshavn', 'Lake Sorvagsvatn'] },
  { code: 'SJ', name: 'Svalbard', flag: '🇳🇴', places: ['Polar Bears Svalbard', 'Longyearbyen Town', 'Svalbard Global Seed Vault', 'Midnight Sun Arctic', 'Russian Ghost Town'] },
  { code: 'AQ', name: 'Antarctica', flag: '🇦🇶', places: ['South Pole Station', 'Paradise Bay', 'Lemaire Channel', 'Penguin Colonies', 'Antarctic Peninsula'] },
];

// Generate all places with IDs and images
const generateAllPlaces = () => {
  const places: any[] = [];
  let id = 1;
  
  // High-quality image URLs for variety
  const imagePatterns = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800',
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800',
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
  ];
  
  ALL_COUNTRIES.forEach((country, countryIndex) => {
    country.places.forEach((placeName, placeIndex) => {
      const imageIndex = (countryIndex + placeIndex) % imagePatterns.length;
      places.push({
        id: `place-${id++}`,
        name: placeName,
        country: country.name,
        countryFlag: country.flag,
        image: imagePatterns[imageIndex],
        stars: (4 + Math.random()).toFixed(1),
        visits: 0,
        hearts: 0,
        comments: 0,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(placeName + ' ' + country.name)}`
      });
    });
  });
  return places;
};

const ALL_PLACES = generateAllPlaces();

// ============= COMPONENT =============
export default function MusicAdventure() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges');
  
  // Accordion filter states - removed difficulty
  const [sourceFilter, setSourceFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Search states
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [travelSearch, setTravelSearch] = useState('');
  
  // Challenge states
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [likedChallenges, setLikedChallenges] = useState<Set<string>>(new Set());
  
  // Place states - all reset to zero
  const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  
  // Travel stories - user created
  const [travelStories, setTravelStories] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', content: '', image: '' });
  
  // Dialog states
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [newChallenge, setNewChallenge] = useState({ 
    title: '', 
    description: '', 
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
  const [rankingCategory, setRankingCategory] = useState<'challenges' | 'discover' | 'travel'>('challenges');
  
  // Media viewer state
  const [mediaViewerOpen, setMediaViewerOpen] = useState(false);
  const [mediaViewerData, setMediaViewerData] = useState<{
    urls: string[];
    types: string[];
    title: string;
    id: string;
    isLiked: boolean;
  }>({ urls: [], types: [], title: '', id: '', isLiked: false });

  // Open media viewer function
  const openMediaViewer = (imageUrl: string, title: string, id: string, isLiked: boolean) => {
    setMediaViewerData({
      urls: [imageUrl],
      types: ['image'],
      title,
      id,
      isLiked
    });
    setMediaViewerOpen(true);
  };

  // Load data from localStorage - preserve likes and loves
  useEffect(() => {
    const saved = localStorage.getItem('adventure_zone_v2');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCustomChallenges(data.customChallenges || []);
        setCompletedChallenges(new Set(data.completedChallenges || []));
        setLikedChallenges(new Set(data.likedChallenges || []));
        setVisitedPlaces(new Set(data.visitedPlaces || []));
        setLovedPlaces(new Set(data.lovedPlaces || []));
        setUserRatings(data.userRatings || {});
        setTravelStories(data.travelStories || []);
        setLikedPosts(new Set(data.likedPosts || []));
      } catch (e) {}
    }
    checkChallengeResets();
  }, []);

  // Save data to localStorage
  const saveData = useCallback(() => {
    localStorage.setItem('adventure_zone_v2', JSON.stringify({
      customChallenges,
      completedChallenges: [...completedChallenges],
      likedChallenges: [...likedChallenges],
      visitedPlaces: [...visitedPlaces],
      lovedPlaces: [...lovedPlaces],
      userRatings,
      travelStories,
      likedPosts: [...likedPosts],
      lastResetCheck: new Date().toISOString()
    }));
  }, [customChallenges, completedChallenges, likedChallenges, visitedPlaces, lovedPlaces, userRatings, travelStories, likedPosts]);

  useEffect(() => { saveData(); }, [saveData]);

  // ============= CHALLENGE RESET LOGIC =============
  const checkChallengeResets = () => {
    const saved = localStorage.getItem('adventure_zone_v2');
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
    
    if (timeFilter !== 'all') {
      challenges = challenges.filter(c => c.duration === timeFilter);
    }
    
    return challenges.slice(0, 50);
  }, [sourceFilter, timeFilter, customChallenges]);

  // ============= FILTER PLACES =============
  const filteredPlaces = useMemo(() => {
    if (!discoverSearch.trim()) return ALL_PLACES.slice(0, 100);
    const search = discoverSearch.toLowerCase();
    return ALL_PLACES.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.country.toLowerCase().includes(search)
    ).slice(0, 100);
  }, [discoverSearch]);

  // ============= FILTER TRAVEL STORIES =============
  const filteredTravelStories = useMemo(() => {
    if (!travelSearch.trim()) return travelStories;
    const search = travelSearch.toLowerCase();
    return travelStories.filter(p => 
      p.title.toLowerCase().includes(search) || 
      p.content.toLowerCase().includes(search)
    );
  }, [travelSearch, travelStories]);

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
      createdAt: new Date().toISOString(),
      creatorId: user?.id // Track creator for private comments
    };
    setCustomChallenges(prev => [...prev, challenge]);
    setShowCreateChallenge(false);
    setNewChallenge({ title: '', description: '', duration: 'daily', category: 'lifestyle' });
    toast.success('Challenge created! 🎯');
  };

  const toggleChallengeComplete = (id: string) => {
    setCompletedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        toast.info('Challenge uncompleted');
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

  // ============= TRAVEL STORY ACTIONS =============
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('posts-media').getPublicUrl(fileName);
      setNewStory(prev => ({ ...prev, image: data.publicUrl }));
      toast.success('Image uploaded! 📸');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };
  
  const createTravelStory = () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }
    if (!newStory.image) {
      toast.error('Please upload an image for your story');
      return;
    }
    const story = {
      id: `story-${Date.now()}`,
      ...newStory,
      image: newStory.image,
      author: profile?.name || 'You',
      authorAvatar: profile?.name?.[0] || 'U',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      creatorId: user?.id
    };
    setTravelStories(prev => [story, ...prev]);
    setShowCreateStory(false);
    setNewStory({ title: '', content: '', image: '' });
    toast.success('Travel story shared! ✈️');
  };

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

// ============= RANKING DATA - GENUINE SYSTEM (NO FAKE BOTS) =============
  const calculateUserRank = () => {
    if (rankingCategory === 'challenges') {
      return completedChallenges.size === 0 ? 'Unranked' : 1; // Only real user at their rank
    } else if (rankingCategory === 'discover') {
      return visitedPlaces.size === 0 ? 'Unranked' : 1;
    } else {
      // Travel ranking based on heart/likes received on travel stories
      const totalLikes = travelStories.reduce((sum, story) => sum + (likedPosts.has(story.id) ? 1 : 0), 0);
      return totalLikes === 0 ? 'Unranked' : 1;
    }
  };

  const userPoints = rankingCategory === 'challenges' 
    ? completedChallenges.size * 50 
    : rankingCategory === 'discover'
    ? visitedPlaces.size * 30
    : likedPosts.size * 20; // Travel points from hearts

  // Empty rankings - genuine system, no fake bots
  // Rankings will be populated with real users when database integration is added
  const globalRankings: { rank: number; name: string; points: number; emoji: string }[] = [];
  const regionalRankings: { rank: number; name: string; points: number; emoji: string }[] = [];

  const userRank = calculateUserRank();

  return (
    <div className="min-h-screen pb-24 overflow-y-auto scroll-smooth overscroll-behavior-y-contain">
      {/* ============= SUBSECTION HEADER - Like Home ============= */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Compass className="w-5 h-5 text-primary" />
        <span className="font-semibold text-base">Adventure</span>
      </div>

      {/* ============= MAIN TABS ============= */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-3 mt-2">
        <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted/50 sticky top-12 z-10">
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
          {/* Accordion Filters - Source & Time only */}
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
                  {/* + Button for Custom Challenge */}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs border-dashed border-primary/50"
                    onClick={() => setShowCreateChallenge(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create
                  </Button>
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
                      {t === 'all' && '🕐 All'}
                      {t === 'daily' && '📅 Daily'}
                      {t === 'weekly' && '📆 Weekly'}
                      {t === 'monthly' && '🗓️ Monthly'}
                      {t === 'yearly' && '📊 Yearly'}
                      {t === 'lifetime' && '♾️ Lifetime'}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Challenge Cards - Single Column */}
          <div className="space-y-3">
            {filteredChallenges.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No challenges found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try changing filters or create your own</p>
                </CardContent>
              </Card>
            ) : (
              filteredChallenges.map(challenge => {
                const isCompleted = completedChallenges.has(challenge.id);
                const isLiked = likedChallenges.has(challenge.id);
                const isCustom = challenge.type === 'custom';
                const isOwner = isCustom && challenge.creatorId === user?.id;
                
                return (
                  <Card key={challenge.id} className={`glass-card overflow-hidden transition-all ${isCompleted ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{challenge.categoryIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm">{challenge.title}</h3>
                            {isCustom && <Badge variant="outline" className="text-[9px]">Custom</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{challenge.description}</p>
                          <div className="flex gap-1.5 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] capitalize">{challenge.duration}</Badge>
                            <Badge variant="outline" className="text-[10px] capitalize">{challenge.category}</Badge>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleChallengeComplete(challenge.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-green-500 text-white' : 'bg-muted hover:bg-primary/20'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Actions - Like, Comment, Share */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => toggleChallengeLike(challenge.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{likedChallenges.has(challenge.id) ? 1 : 0}</span>
                        </button>
                        {/* Comments - System challenges public, Custom only for owner */}
                        {(!isCustom || isOwner) && (
                          <button 
                            onClick={() => openComments(challenge.id, challenge.title)} 
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Comment</span>
                          </button>
                        )}
                        <button 
                          onClick={() => openShare(challenge.id, challenge.title, challenge.description)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============= DISCOVER TAB - 200 Countries x 5 Places ============= */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search 1000+ places..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {ALL_PLACES.length} places from {ALL_COUNTRIES.length} countries
          </p>

          {/* Places - Single Column Layout */}
          <div className="space-y-4">
            {filteredPlaces.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No places found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
                </CardContent>
              </Card>
            ) : (
              filteredPlaces.map(place => {
                const isVisited = visitedPlaces.has(place.id);
                const isLoved = lovedPlaces.has(place.id);
                const myRating = userRatings[place.id];
                
                return (
                  <Card key={place.id} className="glass-card overflow-hidden">
                    {/* Full Width Image - Clickable for fullscreen */}
                    <div 
                      className="aspect-video w-full overflow-hidden relative cursor-pointer"
                      onClick={() => openMediaViewer(place.image, place.name, place.id, lovedPlaces.has(place.id))}
                    >
                      <img 
                        src={place.image} 
                        alt={place.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {isVisited && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
                          ✓ Visited
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      {/* Place Info */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-base">{place.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <span className="text-sm">{place.countryFlag}</span>
                            {place.country}
                          </p>
                        </div>
                        <a 
                          href={place.mapUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Map
                        </a>
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(star => (
                            <button 
                              key={star} 
                              onClick={() => ratePlace(place.id, star)}
                              className={`transition-colors ${(myRating || 0) >= star ? 'text-yellow-500' : 'text-muted-foreground/30'}`}
                            >
                              <Star className={`w-4 h-4 ${(myRating || 0) >= star ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {myRating ? `Your: ${myRating}⭐` : `Avg: ${place.stars}⭐`}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePlaceVisit(place.id)} 
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isVisited ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Footprints className="w-4 h-4" />
                          {isVisited ? "Visited" : "Mark Visit"}
                        </button>
                        <button 
                          onClick={() => togglePlaceLove(place.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLoved ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLoved ? 'fill-current' : ''}`} />
                          <span>{isLoved ? 1 : 0}</span>
                        </button>
                        <button 
                          onClick={() => openComments(place.id, place.name)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openShare(place.id, place.name, `Check out ${place.name} in ${place.country}`)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ============= TRAVEL TAB - User Stories ============= */}
        <TabsContent value="travel" className="mt-4 space-y-4">
          {/* Create Story Button */}
          <Card 
            className="glass-card border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer" 
            onClick={() => setShowCreateStory(true)}
          >
            <CardContent className="py-4 flex items-center justify-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              <div className="text-center">
                <p className="font-medium text-sm">Share Your Travel Story</p>
                <p className="text-[10px] text-muted-foreground">Upload photos and memories from your journey</p>
              </div>
            </CardContent>
          </Card>

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

          {/* Travel Stories - Single Column */}
          <div className="space-y-4">
            {filteredTravelStories.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Plane className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No travel stories yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Share your first journey ✨</p>
                </CardContent>
              </Card>
            ) : (
              filteredTravelStories.map(post => {
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
                          <p className="text-[10px] text-muted-foreground">Travel Story</p>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Post Image - Full Width, Clickable for fullscreen */}
                    <div 
                      className="aspect-[4/3] w-full overflow-hidden cursor-pointer"
                      onClick={() => openMediaViewer(post.image, post.title, post.id, likedPosts.has(post.id))}
                    >
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
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
                          <span>{isLiked ? 1 : 0}</span>
                        </button>
                        <button 
                          onClick={() => openComments(post.id, post.title)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Comment
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
          {/* Main Categories with ^ separator style */}
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground font-medium">🌟 MAIN ADVENTURE CATEGORIES</p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={() => setRankingCategory('challenges')}
                className={`text-sm font-semibold transition-colors ${rankingCategory === 'challenges' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Challenges
              </button>
              <span className="text-muted-foreground">^</span>
              <button 
                onClick={() => setRankingCategory('discover')}
                className={`text-sm font-semibold transition-colors ${rankingCategory === 'discover' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Discover
              </button>
              <span className="text-muted-foreground">^</span>
              <button 
                onClick={() => setRankingCategory('travel')}
                className={`text-sm font-semibold transition-colors ${rankingCategory === 'travel' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Travel
              </button>
            </div>
          </div>

          {/* Scope Categories with ^ separator style */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground font-medium">🌍 SCOPE</p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => setRankingFilter('global')}
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${rankingFilter === 'global' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Globe className="w-4 h-4" />
                Global
              </button>
              <span className="text-muted-foreground">^</span>
              <button 
                onClick={() => setRankingFilter('regional')}
                className={`text-sm font-semibold transition-colors flex items-center gap-1.5 ${rankingFilter === 'regional' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <MapPin className="w-4 h-4" />
                Regional
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {rankingFilter === 'global' ? 'From everywhere' : 'Near you'}
            </p>
          </div>

          {/* Your Rank Card */}
          <Card className="glass-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your {rankingCategory === 'challenges' ? 'Challenges' : rankingCategory === 'discover' ? 'Discover' : 'Travel ❤️'} Rank
              </p>
              <p className={`text-3xl font-bold mt-1 ${userRank === 'Unranked' ? 'text-muted-foreground' : 'text-primary'}`}>
                {userRank === 'Unranked' ? 'Unranked' : `#${userRank}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {userRank === 'Unranked' 
                  ? rankingCategory === 'challenges' 
                    ? 'Complete challenges to get ranked!'
                    : rankingCategory === 'discover'
                    ? 'Visit places to get ranked!'
                    : 'Get ❤️ hearts on travel stories to rank!'
                  : 'You\'re on the leaderboard! 💚'
                }
              </p>
              <p className="text-sm font-medium mt-2">
                {userPoints} {rankingCategory === 'travel' ? 'hearts' : 'points'}
              </p>
            </CardContent>
          </Card>

          {/* Top 10 Rankings - Genuine system (empty until real users participate) */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                {rankingFilter === 'global' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                Top 10 {rankingFilter === 'global' ? 'Global' : 'Regional'} • {
                  rankingCategory === 'challenges' ? 'Challenges' : 
                  rankingCategory === 'discover' ? 'Discover' : 
                  'Travel ❤️'
                }
              </h3>
              
              {(rankingFilter === 'global' ? globalRankings : regionalRankings).length === 0 ? (
                <div className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium text-muted-foreground">No rankings yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Be the first to climb the leaderboard!
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 max-w-[200px] mx-auto">
                    {rankingCategory === 'challenges' 
                      ? 'Complete challenges to earn points and rank up' 
                      : rankingCategory === 'discover'
                      ? 'Visit and rate places to earn points'
                      : 'Share travel stories and get hearts to rank'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(rankingFilter === 'global' ? globalRankings : regionalRankings).map(u => (
                    <div key={u.rank} className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${u.rank <= 3 ? 'bg-primary/5' : ''}`}>
                      <span className="w-6 text-center font-bold text-sm">
                        {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
                      </span>
                      <span className="text-xl">{u.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {rankingCategory === 'travel' ? 'Story creator' : 'Active explorer'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        {rankingCategory === 'travel' && <Heart className="w-3 h-3 text-red-500 fill-current" />}
                        {u.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
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
              Create Challenge
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
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
            </div>
            <Button onClick={createCustomChallenge} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Create Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============= CREATE TRAVEL STORY DIALOG ============= */}
      <Dialog open={showCreateStory} onOpenChange={setShowCreateStory}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Share Travel Story
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input 
                value={newStory.title} 
                onChange={e => setNewStory(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Sunrise at the Mountains"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Story *</label>
              <Textarea 
                value={newStory.content} 
                onChange={e => setNewStory(p => ({ ...p, content: e.target.value }))}
                placeholder="Share your travel experience..."
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Upload Photo *</label>
              <div className="mt-1 space-y-2">
                {newStory.image ? (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={newStory.image} alt="Preview" className="w-full h-40 object-cover" />
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      className="absolute top-2 right-2 h-7 text-xs"
                      onClick={() => setNewStory(p => ({ ...p, image: '' }))}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                        <p className="text-xs text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Image className="w-8 h-8 text-primary/50" />
                        <p className="text-xs text-muted-foreground">Click to upload photo</p>
                        <p className="text-[10px] text-muted-foreground">JPG, PNG, WEBP up to 10MB</p>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>
            <Button onClick={createTravelStory} className="w-full" disabled={uploadingImage || !newStory.image}>
              <Plane className="w-4 h-4 mr-2" />
              Share Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog - Now saves to database properly */}
      <AdventureCommentsDialog 
        open={commentsOpen} 
        onOpenChange={setCommentsOpen} 
        itemId={selectedPostId} 
        itemTitle={selectedPostTitle}
        itemType={selectedPostId.startsWith('sys-') || selectedPostId.startsWith('custom-') ? 'challenge' : selectedPostId.startsWith('story-') ? 'travel' : 'place'}
      />

      {/* Share Dialog - Share to Friends */}
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        postId={shareContent.id}
        postTitle={shareContent.title}
        postContent={shareContent.content}
      />

      {/* Full Screen Media Viewer */}
      <FullScreenMediaViewer
        open={mediaViewerOpen}
        onOpenChange={setMediaViewerOpen}
        mediaUrls={mediaViewerData.urls}
        mediaTypes={mediaViewerData.types}
        title={mediaViewerData.title}
        isLiked={mediaViewerData.isLiked}
        onLike={() => {
          const id = mediaViewerData.id;
          if (id.startsWith('place-')) {
            togglePlaceLove(id);
          } else if (id.startsWith('story-')) {
            togglePostLike(id);
          }
          setMediaViewerData(prev => ({ ...prev, isLiked: !prev.isLiked }));
        }}
        onComment={() => {
          setMediaViewerOpen(false);
          openComments(mediaViewerData.id, mediaViewerData.title);
        }}
        onShare={() => {
          setMediaViewerOpen(false);
          openShare(mediaViewerData.id, mediaViewerData.title, `Check out ${mediaViewerData.title}`);
        }}
      />
    </div>
  );
}
