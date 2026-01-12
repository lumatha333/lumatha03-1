import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Mountain, Trophy, MapPin, Upload, Star, Heart, Bookmark, Navigation,
  Award, TrendingUp, Target, Compass, Map, Globe, Flag,
  Calendar, CalendarDays, CalendarRange, Zap, Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Challenge categories - System + Custom, Easy/Medium/Hard, Daily/Weekly/Monthly/Yearly/Lifetime
const CHALLENGE_FILTERS = {
  type: ['system', 'custom'],
  difficulty: ['easy', 'medium', 'hard'],
  duration: ['daily', 'weekly', 'monthly', 'yearly', 'lifetime']
};

// Generate 500+ system challenges
const generateChallenges = () => {
  const categories = [
    { name: 'Nature', tasks: ['Photograph sunrise', 'Visit a waterfall', 'Hike a mountain trail', 'Camp under stars', 'Watch sunset from hilltop', 'Identify 10 bird species', 'Find a hidden lake', 'Explore a cave', 'Walk through a forest', 'Visit a national park'] },
    { name: 'Culture', tasks: ['Visit a temple', 'Attend a local festival', 'Learn traditional dance', 'Try local cuisine', 'Interview an elder', 'Document traditional craft', 'Visit a museum', 'Explore heritage site', 'Learn 10 local words', 'Attend cultural show'] },
    { name: 'Adventure', tasks: ['Go trekking', 'Try rock climbing', 'Go rafting', 'Paragliding experience', 'Bungee jumping', 'Mountain biking', 'Zip lining', 'Kayaking', 'Camping alone', 'Night hiking'] },
    { name: 'Social', tasks: ['Help a stranger', 'Volunteer for NGO', 'Teach a skill', 'Make a new friend', 'Organize community event', 'Share a meal with locals', 'Guide a tourist', 'Plant a tree', 'Clean a public space', 'Donate to charity'] },
    { name: 'Creative', tasks: ['Sketch a landscape', 'Write travel poem', 'Create photo series', 'Make travel vlog', 'Document local stories', 'Paint nature scene', 'Compose travel song', 'Write travel blog', 'Create documentary', 'Design travel poster'] }
  ];

  const challenges: any[] = [];
  let id = 1;

  const difficulties = ['easy', 'medium', 'hard'];
  const durations = ['daily', 'weekly', 'monthly', 'yearly', 'lifetime'];
  const points = { easy: [10, 20, 30], medium: [40, 60, 80], hard: [100, 150, 200] };

  categories.forEach(cat => {
    cat.tasks.forEach((task, i) => {
      const diff = difficulties[i % 3];
      const dur = durations[i % 5];
      challenges.push({
        id: `sys-${id++}`,
        title: task,
        description: `${cat.name} challenge: ${task}`,
        category: cat.name.toLowerCase(),
        difficulty: diff,
        duration: dur,
        points: points[diff as keyof typeof points][Math.floor(Math.random() * 3)],
        type: 'system'
      });
    });
  });

  // Add more to reach 500+
  for (let i = 0; i < 450; i++) {
    const cat = categories[i % 5];
    const diff = difficulties[i % 3];
    const dur = durations[i % 5];
    challenges.push({
      id: `sys-${id++}`,
      title: `${cat.name} Challenge ${id}`,
      description: `A ${diff} ${dur} ${cat.name.toLowerCase()} challenge`,
      category: cat.name.toLowerCase(),
      difficulty: diff,
      duration: dur,
      points: points[diff as keyof typeof points][Math.floor(Math.random() * 3)],
      type: 'system'
    });
  }

  return challenges;
};

const SYSTEM_CHALLENGES = generateChallenges();

// 200+ places per country (mock data for Nepal with 200 places)
const generatePlaces = (country: string) => {
  const types = ['temple', 'lake', 'mountain', 'heritage', 'wildlife', 'trek', 'village', 'waterfall'];
  const locations = ['Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini', 'Mustang', 'Everest', 'Annapurna', 'Langtang'];
  
  const places: any[] = [];
  
  // Top 5 from Nepal (highlighted)
  const top5 = [
    { id: 'np-top-1', name: 'Mount Everest Base Camp', location: 'Solukhumbu', stars: 4.9, hearts: 25000, type: 'mountain', mapUrl: 'https://maps.google.com/?q=28.0025,86.8528', isTop: true },
    { id: 'np-top-2', name: 'Annapurna Circuit Trek', location: 'Gandaki', stars: 4.8, hearts: 18000, type: 'trek', mapUrl: 'https://maps.google.com/?q=28.5965,83.8200', isTop: true },
    { id: 'np-top-3', name: 'Pashupatinath Temple', location: 'Kathmandu', stars: 4.9, hearts: 22000, type: 'temple', mapUrl: 'https://maps.google.com/?q=27.7107,85.3485', isTop: true },
    { id: 'np-top-4', name: 'Lumbini (Buddha Birthplace)', location: 'Rupandehi', stars: 4.9, hearts: 28000, type: 'heritage', mapUrl: 'https://maps.google.com/?q=27.4833,83.2760', isTop: true },
    { id: 'np-top-5', name: 'Chitwan National Park', location: 'Chitwan', stars: 4.7, hearts: 15000, type: 'wildlife', mapUrl: 'https://maps.google.com/?q=27.5000,84.3333', isTop: true },
  ];

  places.push(...top5);

  // Generate 195+ more places
  for (let i = 1; i <= 195; i++) {
    const type = types[i % types.length];
    const loc = locations[i % locations.length];
    places.push({
      id: `np-${i}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} of ${loc} ${i}`,
      location: loc,
      stars: (3.5 + Math.random() * 1.5).toFixed(1),
      hearts: Math.floor(Math.random() * 5000),
      type,
      mapUrl: `https://maps.google.com/?q=${27 + Math.random()},$83 + Math.random()}`,
      isTop: false
    });
  }

  return places;
};

const NEPAL_PLACES = generatePlaces('Nepal');

// Badges
const BADGES = [
  { id: 'starter', name: 'Starter', icon: '🌱', requirement: 50, desc: '50 points' },
  { id: 'explorer', name: 'Explorer', icon: '🧭', requirement: 200, desc: '200 points' },
  { id: 'traveler', name: 'Traveler', icon: '✈️', requirement: 500, desc: '500 points' },
  { id: 'adventurer', name: 'Adventurer', icon: '🏕️', requirement: 1000, desc: '1000 points' },
  { id: 'pathfinder', name: 'Pathfinder', icon: '🗺️', requirement: 2500, desc: '2500 points' },
  { id: 'legend', name: 'Legend', icon: '👑', requirement: 5000, desc: '5000 points' },
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
  const [discoverPoints, setDiscoverPoints] = useState(0);
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [newCustomChallenge, setNewCustomChallenge] = useState({ title: '', description: '' });
  const [showAddCustom, setShowAddCustom] = useState(false);

  useEffect(() => {
    fetchData();
    loadLocalData();
  }, []);

  const loadLocalData = () => {
    const saved = localStorage.getItem('adventure_saved_places');
    const loved = localStorage.getItem('adventure_loved_places');
    const ratings = localStorage.getItem('adventure_user_ratings');
    const discover = localStorage.getItem('adventure_discover_points');
    const custom = localStorage.getItem('adventure_custom_challenges');
    if (saved) setSavedPlaces(new Set(JSON.parse(saved)));
    if (loved) setLovedPlaces(new Set(JSON.parse(loved)));
    if (ratings) setUserRatings(JSON.parse(ratings));
    if (discover) setDiscoverPoints(parseInt(discover));
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
      const proofType = proofFile.type.startsWith('video/') ? 'video' : 'image';

      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, proofFile, { cacheControl: '31536000', contentType: proofFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
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
    const pts = Math.floor(Math.random() * 20) + 10;
    const newPoints = discoverPoints + pts;
    setDiscoverPoints(newPoints);
    localStorage.setItem('adventure_discover_points', newPoints.toString());
    toast.success(`+${pts} discover points!`);
    window.open(place.mapUrl, '_blank');
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
      difficulty: 'medium',
      duration: 'daily',
      points: 50
    };
    const updated = [...customChallenges, custom];
    setCustomChallenges(updated);
    localStorage.setItem('adventure_custom_challenges', JSON.stringify(updated));
    setNewCustomChallenge({ title: '', description: '' });
    setShowAddCustom(false);
    toast.success('Custom challenge added!');
  };

  const isCompleted = (challengeId: string) => submissions.some(s => s.challenge_id === challengeId);

  const getEarnedBadges = () => {
    const total = totalPoints + discoverPoints;
    return BADGES.filter(b => total >= b.requirement);
  };

  // Filter challenges
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

  // Leaderboard data (mock)
  const globalLeaderboard = [
    { rank: 1, name: 'MountainKing', points: 8500 },
    { rank: 2, name: 'TrekMaster', points: 7200 },
    { rank: 3, name: 'ExplorerPro', points: 6800 },
    { rank: 4, name: 'AdventureX', points: 5500 },
    { rank: 5, name: 'NatureLover', points: 4900 },
    { rank: 6, name: 'WildHeart', points: 4200 },
    { rank: 7, name: 'PathSeeker', points: 3800 },
    { rank: 8, name: 'HillClimber', points: 3200 },
    { rank: 9, name: 'SkyWalker', points: 2800 },
    { rank: 10, name: 'RiverRunner', points: 2400 },
  ];

  const regionalLeaderboard = [
    { rank: 1, name: 'NepaliExplorer', points: 4200, country: '🇳🇵' },
    { rank: 2, name: 'HimalayanHiker', points: 3800, country: '🇳🇵' },
    { rank: 3, name: 'KathmanduKid', points: 3200, country: '🇳🇵' },
    { rank: 4, name: 'PokharaLover', points: 2800, country: '🇳🇵' },
    { rank: 5, name: 'SagarmathaPro', points: 2400, country: '🇳🇵' },
  ];

  const earnedBadges = getEarnedBadges();
  const filteredChallenges = getFilteredChallenges();
  const topPlaces = NEPAL_PLACES.filter(p => p.isTop);
  const otherPlaces = NEPAL_PLACES.filter(p => !p.isTop).slice(0, 30);

  return (
    <div className="space-y-4 pb-20">
      {/* Header - NO ranks/points in header */}
      <h1 className="text-xl font-bold flex items-center gap-2">
        🏔️ Adventure
      </h1>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="challenges" className="text-[10px] py-1.5">
            <Target className="w-3 h-3 mr-0.5" />Challenges
          </TabsTrigger>
          <TabsTrigger value="discover" className="text-[10px] py-1.5">
            <Compass className="w-3 h-3 mr-0.5" />Discover
          </TabsTrigger>
          <TabsTrigger value="travel" className="text-[10px] py-1.5">
            <Map className="w-3 h-3 mr-0.5" />Travel
          </TabsTrigger>
          <TabsTrigger value="rankings" className="text-[10px] py-1.5">
            <Trophy className="w-3 h-3 mr-0.5" />Rankings
          </TabsTrigger>
        </TabsList>

        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-3 mt-3">
          {/* Filter Buttons */}
          <div className="space-y-2">
            {/* Type: System / Custom */}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={challengeFilters.type === 'system' ? 'default' : 'outline'}
                onClick={() => setChallengeFilters(f => ({ ...f, type: 'system' }))}
                className="flex-1 h-8 text-xs"
              >
                System ({SYSTEM_CHALLENGES.length})
              </Button>
              <Button
                size="sm"
                variant={challengeFilters.type === 'custom' ? 'default' : 'outline'}
                onClick={() => setChallengeFilters(f => ({ ...f, type: 'custom' }))}
                className="flex-1 h-8 text-xs"
              >
                Custom ({customChallenges.length})
              </Button>
              <Button size="sm" variant="outline" className="h-8" onClick={() => setShowAddCustom(true)}>
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
                  className="flex-1 h-7 text-[10px] capitalize"
                >
                  {d === 'all' ? 'All' : d}
                </Button>
              ))}
            </div>

            {/* Duration: Daily / Weekly / Monthly / Yearly / Lifetime */}
            <div className="flex gap-1 overflow-x-auto">
              {['daily', 'weekly', 'monthly', 'yearly', 'lifetime'].map(d => (
                <Button
                  key={d}
                  size="sm"
                  variant={challengeFilters.duration === d ? 'default' : 'outline'}
                  onClick={() => setChallengeFilters(f => ({ ...f, duration: d }))}
                  className="h-7 text-[10px] capitalize shrink-0"
                >
                  {d === 'daily' && <Calendar className="w-3 h-3 mr-0.5" />}
                  {d === 'weekly' && <CalendarDays className="w-3 h-3 mr-0.5" />}
                  {d === 'monthly' && <CalendarRange className="w-3 h-3 mr-0.5" />}
                  {d}
                </Button>
              ))}
            </div>
          </div>

          {/* Challenge List */}
          <div className="space-y-2">
            {filteredChallenges.map(challenge => (
              <Card key={challenge.id} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                      challenge.difficulty === 'easy' ? 'bg-green-500/20' :
                      challenge.difficulty === 'medium' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      {challenge.type === 'custom' ? '✨' : '🎯'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{challenge.title}</h4>
                        {isCompleted(challenge.id) && (
                          <Badge variant="secondary" className="text-[8px] bg-green-500/20 text-green-500">✓</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{challenge.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[8px] capitalize">{challenge.difficulty}</Badge>
                        <Badge variant="outline" className="text-[8px] capitalize">{challenge.duration}</Badge>
                        <Badge variant="secondary" className="text-[8px]">{challenge.points} pts</Badge>
                      </div>
                    </div>
                    {!isCompleted(challenge.id) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => { setSelectedChallenge(challenge); setUploadDialog(true); }}
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Discover Tab - 200+ places with 5-star rating */}
        <TabsContent value="discover" className="space-y-3 mt-3">
          {/* Top 5 Highlight */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm flex items-center gap-1">
              ⭐ Top 5 Places in Nepal
            </h3>
            {topPlaces.map(place => (
              <Card key={place.id} className="glass-card border-primary/30">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-xl">
                      {place.type === 'mountain' ? '🏔️' : place.type === 'temple' ? '🛕' : place.type === 'heritage' ? '🏛️' : place.type === 'wildlife' ? '🦁' : '🏞️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{place.name}</h4>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {place.location}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {place.stars}
                        </span>
                        <span className="text-[10px] flex items-center gap-0.5">
                          <Heart className="w-3 h-3 text-red-500" /> {place.hearts.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleVisitPlace(place)}>
                        <Navigation className="w-3 h-3 mr-0.5" /> Visit
                      </Button>
                    </div>
                  </div>
                  
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-muted-foreground mr-1">Rate:</span>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => handleRatePlace(place.id, star)}
                        className="p-0.5"
                      >
                        <Star className={`w-4 h-4 ${
                          (userRatings[place.id] || 0) >= star 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : 'text-muted-foreground'
                        }`} />
                      </button>
                    ))}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 ml-auto"
                      onClick={() => handleLovePlace(place.id)}
                    >
                      <Heart className={`w-4 h-4 ${lovedPlaces.has(place.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleSavePlace(place.id)}
                    >
                      <Bookmark className={`w-4 h-4 ${savedPlaces.has(place.id) ? 'text-primary fill-primary' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* More Places */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">More Places ({NEPAL_PLACES.length - 5}+)</h3>
            {otherPlaces.map(place => (
              <Card key={place.id} className="glass-card">
                <CardContent className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-muted/30 flex items-center justify-center text-sm">
                      {place.type === 'mountain' ? '🏔️' : place.type === 'temple' ? '🛕' : '🏞️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs truncate">{place.name}</p>
                      <p className="text-[9px] text-muted-foreground">{place.location}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px]"><Star className="w-3 h-3 text-yellow-500 inline" /> {place.stars}</span>
                      <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => handleVisitPlace(place)}>
                        Visit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Travel Tab */}
        <TabsContent value="travel" className="space-y-3 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 text-center">
              <Map className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold mb-1">Travel Section</h3>
              <p className="text-sm text-muted-foreground">
                Travel places with post-like layout coming soon!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rankings Tab - Stats first, then leaderboards */}
        <TabsContent value="rankings" className="space-y-4 mt-3">
          {/* Your Stats FIRST */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="w-4 h-4" /> Your Adventure Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold text-primary">{totalPoints}</p>
                  <p className="text-[9px] text-muted-foreground">Challenge Pts</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold text-green-500">{discoverPoints}</p>
                  <p className="text-[9px] text-muted-foreground">Discover Pts</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <p className="text-lg font-bold">{submissions.length}</p>
                  <p className="text-[9px] text-muted-foreground">Completed</p>
                </div>
              </div>

              {/* Badges */}
              <p className="text-xs font-medium mb-2">Badges ({earnedBadges.length}/{BADGES.length})</p>
              <div className="flex gap-2 flex-wrap">
                {BADGES.map(badge => (
                  <div
                    key={badge.id}
                    className={`p-2 rounded-lg text-center ${
                      earnedBadges.includes(badge) ? 'bg-primary/20 border border-primary' : 'bg-muted/30 opacity-40'
                    }`}
                  >
                    <span className="text-xl">{badge.icon}</span>
                    <p className="text-[8px]">{badge.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Global Top 10 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" /> Global Top 10
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {globalLeaderboard.map(player => (
                <div key={player.rank} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                  <span className="w-6 text-center text-xs font-bold">
                    {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                  </span>
                  <span className="flex-1 text-xs">{player.name}</span>
                  <span className="text-xs font-bold">{player.points.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Regional Top 10 */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flag className="w-4 h-4" /> Regional Top 10
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {regionalLeaderboard.map(player => (
                <div key={player.rank} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                  <span className="w-6 text-center text-xs font-bold">
                    {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                  </span>
                  <span>{player.country}</span>
                  <span className="flex-1 text-xs">{player.name}</span>
                  <span className="text-xs font-bold">{player.points.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Proof Dialog */}
      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">{selectedChallenge?.title}</p>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                id="proof-upload"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">{proofFile ? proofFile.name : 'Upload proof (photo/video)'}</p>
              </label>
            </div>
            <Button onClick={handleUploadProof} disabled={!proofFile || uploading} className="w-full">
              {uploading ? 'Uploading...' : `Complete (+${selectedChallenge?.points || 50} pts)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Custom Challenge Dialog */}
      <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Challenge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Challenge title..."
              value={newCustomChallenge.title}
              onChange={(e) => setNewCustomChallenge(c => ({ ...c, title: e.target.value }))}
            />
            <Input
              placeholder="Description (optional)"
              value={newCustomChallenge.description}
              onChange={(e) => setNewCustomChallenge(c => ({ ...c, description: e.target.value }))}
            />
            <Button onClick={addCustomChallenge} className="w-full">
              Add Challenge
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}