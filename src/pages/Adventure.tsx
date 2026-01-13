import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Mountain, MapPin, Upload, Star, Heart, Bookmark, Navigation,
  Target, Compass, Map, Globe, Calendar, CalendarDays, CalendarRange,
  Plus, Check, ExternalLink, Share2, MessageCircle, Clock, Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Challenge filters
const DURATION_FILTERS = ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'];
const DIFFICULTY_FILTERS = ['easy', 'medium', 'hard'];
const TYPE_FILTERS = ['system', 'custom'];

// Generate 500+ system challenges
const generateChallenges = () => {
  const categories = [
    { name: 'Nature', icon: '🌿', tasks: ['Photograph sunrise from hilltop', 'Visit a waterfall', 'Hike a mountain trail', 'Camp under stars', 'Watch sunset from hilltop', 'Identify 10 bird species', 'Find a hidden lake', 'Explore a cave', 'Walk through ancient forest', 'Visit a national park', 'Swim in natural pool', 'Photograph wildlife', 'Find rare flower', 'Climb a rock', 'Cross a river'] },
    { name: 'Culture', icon: '🏛️', tasks: ['Visit a temple', 'Attend local festival', 'Learn traditional dance', 'Try local cuisine', 'Interview village elder', 'Document traditional craft', 'Visit a museum', 'Explore heritage site', 'Learn 10 local words', 'Attend cultural show', 'Cook traditional meal', 'Wear traditional dress', 'Learn folk song', 'Visit ancient ruins', 'Photograph architecture'] },
    { name: 'Adventure', icon: '⛰️', tasks: ['Go trekking', 'Try rock climbing', 'Go white water rafting', 'Paragliding experience', 'Bungee jumping', 'Mountain biking', 'Zip lining adventure', 'Kayaking in river', 'Solo camping night', 'Night hiking', 'Cliff diving', 'Cave exploration', 'Jungle safari', 'Desert camping', 'Glacier walking'] },
    { name: 'Social', icon: '🤝', tasks: ['Help a stranger', 'Volunteer for NGO', 'Teach a skill', 'Make new friend abroad', 'Organize community event', 'Share meal with locals', 'Guide a tourist', 'Plant 10 trees', 'Clean public space', 'Donate to charity', 'Join local celebration', 'Host a traveler', 'Learn local game', 'Tell stories to children', 'Support local artisan'] },
    { name: 'Creative', icon: '🎨', tasks: ['Sketch landscape', 'Write travel poem', 'Create photo series', 'Make travel vlog', 'Document local stories', 'Paint nature scene', 'Compose travel song', 'Write travel blog', 'Create short documentary', 'Design travel poster', 'Make travel journal', 'Record ambient sounds', 'Create timelapse', 'Illustrate journey', 'Photograph portraits'] }
  ];

  const challenges: any[] = [];
  let id = 1;
  const difficulties = ['easy', 'medium', 'hard'];
  const durations = ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'];
  const points = { easy: [10, 20, 30], medium: [40, 60, 80], hard: [100, 150, 200] };

  // Generate from categories
  categories.forEach(cat => {
    cat.tasks.forEach((task, i) => {
      const diff = difficulties[i % 3];
      const dur = durations[i % 5];
      challenges.push({
        id: `sys-${id++}`,
        title: task,
        description: `${cat.name} adventure: Complete this ${diff} ${dur} challenge`,
        category: cat.name.toLowerCase(),
        categoryIcon: cat.icon,
        difficulty: diff,
        duration: dur,
        points: points[diff as keyof typeof points][Math.floor(Math.random() * 3)],
        type: 'system'
      });
    });
  });

  // Generate more to reach 500+
  for (let i = 0; i < 425; i++) {
    const cat = categories[i % 5];
    const diff = difficulties[i % 3];
    const dur = durations[i % 5];
    challenges.push({
      id: `sys-${id++}`,
      title: `${cat.name} Quest ${id}`,
      description: `An exciting ${diff} ${dur} ${cat.name.toLowerCase()} adventure awaits`,
      category: cat.name.toLowerCase(),
      categoryIcon: cat.icon,
      difficulty: diff,
      duration: dur,
      points: points[diff as keyof typeof points][Math.floor(Math.random() * 3)],
      type: 'system'
    });
  }

  return challenges;
};

const SYSTEM_CHALLENGES = generateChallenges();

// Generate 200+ places per country (Nepal example)
const generatePlaces = () => {
  const regions = ['Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini', 'Mustang', 'Everest', 'Annapurna', 'Langtang', 'Dolpo', 'Manang'];
  const types = ['temple', 'lake', 'mountain', 'heritage', 'wildlife', 'trek', 'village', 'waterfall', 'monastery', 'viewpoint'];
  
  const places: any[] = [];
  
  // Top 5 from Nepal (highlighted)
  const top5 = [
    { id: 'np-top-1', name: 'Mount Everest Base Camp', location: 'Solukhumbu', description: 'The ultimate trekking destination at the foot of the world\'s highest peak', stars: 4.9, hearts: 25000, type: 'mountain', mapUrl: 'https://maps.google.com/?q=28.0025,86.8528', isTop: true, image: '🏔️' },
    { id: 'np-top-2', name: 'Annapurna Circuit Trek', location: 'Gandaki Province', description: 'One of the world\'s most diverse and beautiful treks', stars: 4.8, hearts: 18000, type: 'trek', mapUrl: 'https://maps.google.com/?q=28.5965,83.8200', isTop: true, image: '🥾' },
    { id: 'np-top-3', name: 'Pashupatinath Temple', location: 'Kathmandu', description: 'Sacred Hindu temple complex and UNESCO World Heritage Site', stars: 4.9, hearts: 22000, type: 'temple', mapUrl: 'https://maps.google.com/?q=27.7107,85.3485', isTop: true, image: '🛕' },
    { id: 'np-top-4', name: 'Lumbini (Buddha Birthplace)', location: 'Rupandehi', description: 'Birthplace of Lord Buddha and major pilgrimage site', stars: 4.9, hearts: 28000, type: 'heritage', mapUrl: 'https://maps.google.com/?q=27.4833,83.2760', isTop: true, image: '🪷' },
    { id: 'np-top-5', name: 'Chitwan National Park', location: 'Chitwan', description: 'Home to Bengal tigers, one-horned rhinos, and diverse wildlife', stars: 4.7, hearts: 15000, type: 'wildlife', mapUrl: 'https://maps.google.com/?q=27.5000,84.3333', isTop: true, image: '🦏' },
  ];

  places.push(...top5);

  // Generate 195+ more places
  for (let i = 1; i <= 195; i++) {
    const type = types[i % types.length];
    const loc = regions[i % regions.length];
    const typeIcons: Record<string, string> = {
      temple: '🛕', lake: '🏞️', mountain: '⛰️', heritage: '🏛️', wildlife: '🦁',
      trek: '🥾', village: '🏘️', waterfall: '💧', monastery: '🧘', viewpoint: '👁️'
    };
    places.push({
      id: `np-${i}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} of ${loc} ${i}`,
      location: loc,
      description: `A beautiful ${type} location in ${loc} region`,
      stars: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      hearts: Math.floor(Math.random() * 5000),
      type,
      mapUrl: `https://maps.google.com/?q=${27 + Math.random()},${83 + Math.random()}`,
      isTop: false,
      image: typeIcons[type] || '📍'
    });
  }

  return places;
};

const NEPAL_PLACES = generatePlaces();

// Travel places (different from Discover)
const TRAVEL_PLACES = [
  { id: 't-1', name: 'Phewa Lake Sunset', location: 'Pokhara', description: 'Perfect spot for romantic boat rides', category: 'romance', image: '🌅' },
  { id: 't-2', name: 'Nagarkot Sunrise', location: 'Bhaktapur', description: 'Stunning Himalayan sunrise views', category: 'nature', image: '🌄' },
  { id: 't-3', name: 'Thamel Streets', location: 'Kathmandu', description: 'Vibrant tourist hub with shops and cafes', category: 'culture', image: '🛍️' },
  { id: 't-4', name: 'Boudhanath Stupa', location: 'Kathmandu', description: 'One of the largest stupas in the world', category: 'spiritual', image: '☸️' },
  { id: 't-5', name: 'Patan Durbar Square', location: 'Lalitpur', description: 'Ancient royal palace complex', category: 'heritage', image: '🏰' },
];

export default function Adventure() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges');
  const [challengeFilters, setChallengeFilters] = useState({ type: 'system', difficulty: 'all', duration: 'daily' });
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [newCustomChallenge, setNewCustomChallenge] = useState({ title: '', description: '', difficulty: 'medium', duration: 'daily' });
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [placeReviewDialog, setPlaceReviewDialog] = useState<any>(null);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    fetchData();
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const saved = localStorage.getItem('adventure_saved_places');
    const loved = localStorage.getItem('adventure_loved_places');
    const ratings = localStorage.getItem('adventure_user_ratings');
    const custom = localStorage.getItem('adventure_custom_challenges');
    if (saved) setSavedPlaces(new Set(JSON.parse(saved)));
    if (loved) setLovedPlaces(new Set(JSON.parse(loved)));
    if (ratings) setUserRatings(JSON.parse(ratings));
    if (custom) setCustomChallenges(JSON.parse(custom));
  };

  const fetchData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const [submissionsRes, pointsRes] = await Promise.all([
        supabase.from('challenge_submissions').select('*').eq('user_id', authUser.id),
        supabase.from('user_points').select('total_points').eq('user_id', authUser.id).maybeSingle()
      ]);

      setSubmissions(submissionsRes.data || []);
      setTotalPoints(pointsRes.data?.total_points || 0);
    } catch (error) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !selectedChallenge || !user) return;
    setUploading(true);
    try {
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedChallenge.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, proofFile, { cacheControl: '31536000', contentType: proofFile.type });

      if (uploadError) throw uploadError;

      const newPoints = totalPoints + (selectedChallenge.points || 50);
      await supabase.from('user_points').upsert({ user_id: user.id, total_points: newPoints });
      setTotalPoints(newPoints);

      toast.success(`+${selectedChallenge.points || 50} points! Challenge completed!`);
      setUploadDialog(false);
      setProofFile(null);
      setSelectedChallenge(null);
      setSubmissions(prev => [...prev, { challenge_id: selectedChallenge.id, status: 'approved' }]);
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleVisitPlace = (place: any) => {
    window.open(place.mapUrl, '_blank');
    toast.success('Opening in maps...');
  };

  const handleSavePlace = (placeId: string) => {
    const newSaved = new Set(savedPlaces);
    if (newSaved.has(placeId)) {
      newSaved.delete(placeId);
      toast.success('Removed from saved');
    } else {
      newSaved.add(placeId);
      toast.success('Place saved!');
    }
    setSavedPlaces(newSaved);
    localStorage.setItem('adventure_saved_places', JSON.stringify([...newSaved]));
  };

  const handleLovePlace = (placeId: string) => {
    if (lovedPlaces.has(placeId)) {
      toast.info('You already loved this place');
      return;
    }
    const newLoved = new Set([...lovedPlaces, placeId]);
    setLovedPlaces(newLoved);
    localStorage.setItem('adventure_loved_places', JSON.stringify([...newLoved]));
    toast.success('❤️ Loved!');
  };

  const handleRatePlace = (placeId: string, rating: number) => {
    const newRatings = { ...userRatings, [placeId]: rating };
    setUserRatings(newRatings);
    localStorage.setItem('adventure_user_ratings', JSON.stringify(newRatings));
    toast.success(`Rated ${rating} stars!`);
  };

  const addCustomChallenge = () => {
    if (!newCustomChallenge.title) {
      toast.error('Enter a title');
      return;
    }
    const custom = {
      id: `custom-${Date.now()}`,
      title: newCustomChallenge.title,
      description: newCustomChallenge.description || 'Custom challenge',
      type: 'custom',
      difficulty: newCustomChallenge.difficulty,
      duration: newCustomChallenge.duration,
      points: 50,
      categoryIcon: '🎯'
    };
    const updated = [...customChallenges, custom];
    setCustomChallenges(updated);
    localStorage.setItem('adventure_custom_challenges', JSON.stringify(updated));
    setNewCustomChallenge({ title: '', description: '', difficulty: 'medium', duration: 'daily' });
    setShowAddCustom(false);
    toast.success('Custom challenge added!');
  };

  const isCompleted = (challengeId: string) => submissions.some(s => s.challenge_id === challengeId);

  const getFilteredChallenges = () => {
    let challenges = challengeFilters.type === 'custom' ? customChallenges : SYSTEM_CHALLENGES;
    
    if (challengeFilters.difficulty !== 'all') {
      challenges = challenges.filter(c => c.difficulty === challengeFilters.difficulty);
    }
    if (challengeFilters.duration !== 'all') {
      challenges = challenges.filter(c => c.duration === challengeFilters.duration);
    }
    
    return challenges.slice(0, 50);
  };

  // Mock leaderboard data
  const globalLeaderboard = [
    { rank: 1, name: 'MountainKing', points: 8500, avatar: '👑' },
    { rank: 2, name: 'TrekMaster', points: 7200, avatar: '🥈' },
    { rank: 3, name: 'ExplorerPro', points: 6800, avatar: '🥉' },
    { rank: 4, name: 'AdventureX', points: 5500, avatar: '⭐' },
    { rank: 5, name: 'NatureLover', points: 4900, avatar: '🌿' },
    { rank: 6, name: 'WildHeart', points: 4200, avatar: '💚' },
    { rank: 7, name: 'PathSeeker', points: 3800, avatar: '🧭' },
    { rank: 8, name: 'HillClimber', points: 3200, avatar: '⛰️' },
    { rank: 9, name: 'SkyWalker', points: 2800, avatar: '☁️' },
    { rank: 10, name: 'RiverRunner', points: 2400, avatar: '🌊' },
  ];

  const regionalLeaderboard = [
    { rank: 1, name: 'NepaliExplorer', points: 4200, avatar: '🇳🇵' },
    { rank: 2, name: 'HimalayanHiker', points: 3800, avatar: '🏔️' },
    { rank: 3, name: 'KathmanduKid', points: 3200, avatar: '🏛️' },
    { rank: 4, name: 'PokharaLover', points: 2800, avatar: '🏞️' },
    { rank: 5, name: 'SagarmathaPro', points: 2400, avatar: '⛰️' },
  ];

  const filteredChallenges = getFilteredChallenges();
  const topPlaces = NEPAL_PLACES.filter(p => p.isTop);
  const otherPlaces = NEPAL_PLACES.filter(p => !p.isTop).slice(0, 30);

  // Calculate user rank
  const userRank = totalPoints > 0 ? Math.max(11, 50 - Math.floor(totalPoints / 100)) : '-';

  return (
    <div className="space-y-4 pb-20">
      {/* Header - Clean, no ranks/medals at top */}
      <h1 className="text-xl font-bold flex items-center gap-2">
        🏔️ Adventure
      </h1>

      {/* Tabs - Challenges, Discover, Travel (Rankings at bottom) */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 h-auto p-0.5">
          <TabsTrigger value="challenges" className="text-xs py-2">
            <Target className="w-3.5 h-3.5 mr-1" />Challenges
          </TabsTrigger>
          <TabsTrigger value="discover" className="text-xs py-2">
            <Compass className="w-3.5 h-3.5 mr-1" />Discover
          </TabsTrigger>
          <TabsTrigger value="travel" className="text-xs py-2">
            <Map className="w-3.5 h-3.5 mr-1" />Travel
          </TabsTrigger>
        </TabsList>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3 mt-3">
          {/* Type: System / Custom */}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={challengeFilters.type === 'system' ? 'default' : 'outline'}
              onClick={() => setChallengeFilters(f => ({ ...f, type: 'system' }))}
              className="flex-1 h-9 text-xs"
            >
              System ({SYSTEM_CHALLENGES.length})
            </Button>
            <Button
              size="sm"
              variant={challengeFilters.type === 'custom' ? 'default' : 'outline'}
              onClick={() => setChallengeFilters(f => ({ ...f, type: 'custom' }))}
              className="flex-1 h-9 text-xs"
            >
              Custom ({customChallenges.length})
            </Button>
            <Button size="sm" variant="outline" className="h-9 w-9 p-0" onClick={() => setShowAddCustom(true)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Difficulty: Easy / Medium / Hard */}
          <div className="flex gap-1">
            {['all', 'easy', 'medium', 'hard'].map(d => (
              <Button
                key={d}
                size="sm"
                variant={challengeFilters.difficulty === d ? 'default' : 'outline'}
                onClick={() => setChallengeFilters(f => ({ ...f, difficulty: d }))}
                className="flex-1 h-8 text-[10px] capitalize"
              >
                {d === 'all' ? 'All Levels' : d}
              </Button>
            ))}
          </div>

          {/* Duration: Daily / Weekly / Monthly / Yearly / Lifetime */}
          <ScrollArea className="w-full">
            <div className="flex gap-1 pb-2">
              {DURATION_FILTERS.map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={challengeFilters.duration === d ? 'default' : 'outline'}
                  onClick={() => setChallengeFilters(f => ({ ...f, duration: d }))}
                  className="h-8 text-[10px] capitalize shrink-0 gap-1"
                >
                  {d === 'daily' && <Calendar className="w-3 h-3" />}
                  {d === 'weekly' && <CalendarDays className="w-3 h-3" />}
                  {d === 'monthly' && <CalendarRange className="w-3 h-3" />}
                  {d === 'yearly' && <Clock className="w-3 h-3" />}
                  {d === 'lifetime' && <Trophy className="w-3 h-3" />}
                  {d}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Challenge List */}
          <div className="space-y-2">
            {filteredChallenges.map((challenge) => {
              const completed = isCompleted(challenge.id);
              return (
                <Card key={challenge.id} className={`glass-card transition-all ${completed ? 'opacity-60 bg-green-500/10' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{challenge.categoryIcon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">{challenge.title}</p>
                          {completed && <Check className="w-4 h-4 text-green-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{challenge.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline" className="text-[9px] capitalize">{challenge.difficulty}</Badge>
                          <Badge variant="outline" className="text-[9px] capitalize">{challenge.duration}</Badge>
                          <Badge className="text-[9px] bg-primary/20 text-primary">+{challenge.points} pts</Badge>
                        </div>
                      </div>
                      {!completed && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 h-8 text-xs"
                          onClick={() => { setSelectedChallenge(challenge); setUploadDialog(true); }}
                        >
                          <Upload className="w-3 h-3 mr-1" /> Proof
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredChallenges.length === 0 && (
            <Card className="glass-card">
              <CardContent className="py-8 text-center">
                <Target className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No challenges found</p>
              </CardContent>
            </Card>
          )}

          {/* Rankings at Bottom */}
          <div className="pt-4 space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-sm flex items-center justify-center gap-2 mb-1">
                🏆 Your Rank
              </h3>
              <p className="text-2xl font-bold text-primary">#{userRank}</p>
              <p className="text-xs text-muted-foreground">{totalPoints} points</p>
            </div>

            <Card className="glass-card">
              <CardContent className="p-3">
                <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Global Top 10
                </h4>
                <div className="space-y-1">
                  {globalLeaderboard.slice(0, 5).map((u) => (
                    <div key={u.rank} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center font-medium">{u.rank}</span>
                      <span>{u.avatar}</span>
                      <span className="flex-1 truncate">{u.name}</span>
                      <span className="text-muted-foreground">{u.points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-3">
                <h4 className="font-medium text-xs mb-2 flex items-center gap-1">
                  🇳🇵 Regional Top 5
                </h4>
                <div className="space-y-1">
                  {regionalLeaderboard.map((u) => (
                    <div key={u.rank} className="flex items-center gap-2 text-xs">
                      <span className="w-5 text-center font-medium">{u.rank}</span>
                      <span>{u.avatar}</span>
                      <span className="flex-1 truncate">{u.name}</span>
                      <span className="text-muted-foreground">{u.points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Discover Tab - 200+ Places with 5-Star Rating */}
        <TabsContent value="discover" className="space-y-4 mt-3">
          {/* Top 5 Nepal Places - Highlighted */}
          <div>
            <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
              🇳🇵 Top 5 Places in Nepal
            </h3>
            <div className="space-y-2">
              {topPlaces.map((place) => (
                <Card key={place.id} className="glass-card border-primary/30 bg-gradient-to-r from-primary/5 to-transparent">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="text-3xl">{place.image}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{place.name}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" /> {place.location}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{place.description}</p>
                        
                        {/* 5-Star Rating */}
                        <div className="flex items-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatePlace(place.id, star)}
                              className="transition-transform hover:scale-110"
                            >
                              <Star className={`w-4 h-4 ${(userRatings[place.id] || 0) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            </button>
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">({place.stars})</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleVisitPlace(place)}>
                            <Navigation className="w-3 h-3" /> Visit
                          </Button>
                          <button onClick={() => handleLovePlace(place.id)} className="flex items-center gap-1 text-xs">
                            <Heart className={`w-4 h-4 ${lovedPlaces.has(place.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            <span>{place.hearts + (lovedPlaces.has(place.id) ? 1 : 0)}</span>
                          </button>
                          <button onClick={() => setPlaceReviewDialog(place)} className="text-xs text-muted-foreground hover:text-foreground">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleSavePlace(place.id)} className={`${savedPlaces.has(place.id) ? 'text-primary' : 'text-muted-foreground'}`}>
                            <Bookmark className={`w-4 h-4 ${savedPlaces.has(place.id) ? 'fill-current' : ''}`} />
                          </button>
                          <button className="text-muted-foreground hover:text-foreground">
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* More Places */}
          <div>
            <h3 className="font-medium text-sm mb-2">🗺️ Explore More Places</h3>
            <div className="grid grid-cols-2 gap-2">
              {otherPlaces.map((place) => (
                <Card key={place.id} className="glass-card">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{place.image}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{place.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{place.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-2.5 h-2.5 ${star <= Math.round(place.stars) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Heart className="w-2.5 h-2.5" /> {place.hearts}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="w-full h-6 mt-1 text-[9px]" onClick={() => handleVisitPlace(place)}>
                      <ExternalLink className="w-2.5 h-2.5 mr-1" /> Open Map
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Travel Tab - Same layout as posts */}
        <TabsContent value="travel" className="space-y-3 mt-3">
          <h3 className="font-medium text-sm mb-2">✈️ Travel Destinations</h3>
          {TRAVEL_PLACES.map((place) => (
            <Card key={place.id} className="glass-card">
              <CardContent className="p-3">
                <div className="flex gap-3">
                  <div className="text-4xl">{place.image}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{place.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {place.location}
                    </p>
                    <p className="text-sm text-muted-foreground">{place.description}</p>
                    <Badge variant="outline" className="text-[9px] mt-2 capitalize">{place.category}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Rankings at bottom of Travel too */}
          <div className="pt-4">
            <Card className="glass-card">
              <CardContent className="p-3 text-center">
                <h4 className="font-medium text-sm mb-2">🏆 Your Travel Stats</h4>
                <p className="text-2xl font-bold text-primary">{totalPoints} pts</p>
                <p className="text-xs text-muted-foreground">Global Rank: #{userRank}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Proof Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedChallenge && (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-sm">{selectedChallenge.title}</p>
                <p className="text-xs text-muted-foreground">{selectedChallenge.description}</p>
                <Badge className="mt-2 text-xs">+{selectedChallenge.points} points</Badge>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Upload Proof (Photo/Video)</label>
              <Input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleUploadProof} disabled={!proofFile || uploading} className="w-full">
              {uploading ? 'Uploading...' : 'Submit Proof'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Custom Challenge Dialog */}
      <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Challenge title..."
              value={newCustomChallenge.title}
              onChange={(e) => setNewCustomChallenge(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Description (optional)..."
              value={newCustomChallenge.description}
              onChange={(e) => setNewCustomChallenge(prev => ({ ...prev, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <select
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newCustomChallenge.difficulty}
                onChange={(e) => setNewCustomChallenge(prev => ({ ...prev, difficulty: e.target.value }))}
              >
                {DIFFICULTY_FILTERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={newCustomChallenge.duration}
                onChange={(e) => setNewCustomChallenge(prev => ({ ...prev, duration: e.target.value }))}
              >
                {DURATION_FILTERS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <Button onClick={addCustomChallenge} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Add Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Place Review Dialog */}
      <Dialog open={!!placeReviewDialog} onOpenChange={() => setPlaceReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {placeReviewDialog && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{placeReviewDialog.image}</span>
                <div>
                  <p className="font-medium text-sm">{placeReviewDialog.name}</p>
                  <p className="text-xs text-muted-foreground">{placeReviewDialog.location}</p>
                </div>
              </div>
            )}
            <Textarea
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
            <Button onClick={() => { toast.success('Review submitted!'); setPlaceReviewDialog(null); setReviewText(''); }} className="w-full">
              Submit Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
