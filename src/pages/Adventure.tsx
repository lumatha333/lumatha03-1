import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Mountain, Trophy, MapPin, Upload, Star, Heart, Bookmark, Navigation,
  Award, Medal, Crown, TrendingUp, Target, Compass, Map, Globe, Flag,
  Calendar, CalendarDays, CalendarRange
} from 'lucide-react';

// Nepal's Top Places
const NEPAL_TOP_PLACES = [
  { id: 'np1', name: 'Mount Everest Base Camp', location: 'Solukhumbu', points: 1000, stars: 4.9, hearts: 15420, type: 'mountain', mapUrl: 'https://maps.google.com/?q=28.0025,86.8528' },
  { id: 'np2', name: 'Annapurna Circuit', location: 'Gandaki', points: 900, stars: 4.8, hearts: 12300, type: 'trek', mapUrl: 'https://maps.google.com/?q=28.5965,83.8200' },
  { id: 'np3', name: 'Pokhara Lake', location: 'Pokhara', points: 600, stars: 4.7, hearts: 18500, type: 'lake', mapUrl: 'https://maps.google.com/?q=28.2096,83.9856' },
  { id: 'np4', name: 'Chitwan National Park', location: 'Chitwan', points: 700, stars: 4.6, hearts: 9800, type: 'wildlife', mapUrl: 'https://maps.google.com/?q=27.5000,84.3333' },
  { id: 'np5', name: 'Lumbini (Buddha Birthplace)', location: 'Rupandehi', points: 800, stars: 4.9, hearts: 22100, type: 'heritage', mapUrl: 'https://maps.google.com/?q=27.4833,83.2760' },
  { id: 'np6', name: 'Pashupatinath Temple', location: 'Kathmandu', points: 500, stars: 4.8, hearts: 19200, type: 'temple', mapUrl: 'https://maps.google.com/?q=27.7107,85.3485' },
  { id: 'np7', name: 'Boudhanath Stupa', location: 'Kathmandu', points: 450, stars: 4.7, hearts: 16800, type: 'heritage', mapUrl: 'https://maps.google.com/?q=27.7215,85.3620' },
  { id: 'np8', name: 'Swayambhunath (Monkey Temple)', location: 'Kathmandu', points: 400, stars: 4.6, hearts: 14500, type: 'temple', mapUrl: 'https://maps.google.com/?q=27.7149,85.2903' },
  { id: 'np9', name: 'Rara Lake', location: 'Mugu', points: 850, stars: 4.9, hearts: 5200, type: 'lake', mapUrl: 'https://maps.google.com/?q=29.5264,82.0879' },
  { id: 'np10', name: 'Gosaikunda Lake', location: 'Rasuwa', points: 750, stars: 4.7, hearts: 4100, type: 'lake', mapUrl: 'https://maps.google.com/?q=28.0833,85.4167' },
];

// Travel categories with Top 5 from Nepal
const TRAVEL_CATEGORIES = [
  { id: 'heritage', name: 'Heritage Sites', icon: '🏛️' },
  { id: 'nature', name: 'Nature & Wildlife', icon: '🌿' },
  { id: 'adventure', name: 'Adventure Spots', icon: '🏔️' },
];

// Challenge categories - Daily, Weekly, Monthly (100+ challenges)
const CHALLENGE_CATEGORIES = [
  { id: 'daily', name: 'Daily', icon: Calendar },
  { id: 'weekly', name: 'Weekly', icon: CalendarDays },
  { id: 'monthly', name: 'Monthly', icon: CalendarRange },
];

// Generate 100+ challenges with Daily/Weekly/Monthly categories
const generateChallenges = () => {
  const dailyTasks = [
    'Take a morning walk', 'Photograph a sunrise', 'Visit a local shop', 'Try new street food',
    'Talk to a stranger', 'Explore a new street', 'Visit a temple', 'Read in a park',
    'Take 10 photos of nature', 'Find a hidden cafe', 'Walk 5000 steps', 'Meditate outdoors',
    'Sketch something outdoors', 'Listen to local music', 'Watch sunset', 'Try local tea',
    'Visit a bookshop', 'Plant a seed', 'Help someone', 'Write in a journal'
  ];
  
  const weeklyTasks = [
    'Complete a trekking trail', 'Visit 3 heritage sites', 'Try 5 local dishes', 'Photograph 10 birds',
    'Explore a new village', 'Camp overnight', 'Learn 10 local words', 'Visit a museum',
    'Complete a nature walk', 'Document local culture', 'Interview a local elder', 'Visit a waterfall',
    'Explore ancient ruins', 'Attend a local event', 'Visit wildlife sanctuary', 'Cycle 20km'
  ];
  
  const monthlyTasks = [
    'Complete a major trek', 'Visit 5 different cities', 'Document a festival', 'Create a travel journal',
    'Volunteer for a cause', 'Learn a traditional craft', 'Complete photo series', 'Write travel blog',
    'Create documentary', 'Explore remote area', 'Complete all heritage sites', 'Master local cuisine'
  ];

  const challenges: any[] = [];
  let id = 1;

  dailyTasks.forEach((task, i) => {
    challenges.push({
      id: `ch${id++}`,
      title: task,
      description: 'Complete this daily challenge!',
      points: 20 + (i % 3) * 10,
      category: 'daily',
    });
  });

  weeklyTasks.forEach((task, i) => {
    challenges.push({
      id: `ch${id++}`,
      title: task,
      description: 'Complete within this week!',
      points: 50 + (i % 4) * 25,
      category: 'weekly',
    });
  });

  monthlyTasks.forEach((task, i) => {
    challenges.push({
      id: `ch${id++}`,
      title: task,
      description: 'Complete this month-long adventure!',
      points: 150 + (i % 3) * 50,
      category: 'monthly',
    });
  });

  // Add more to reach 100+
  for (let i = 0; i < 56; i++) {
    const cat = ['daily', 'weekly', 'monthly'][i % 3];
    challenges.push({
      id: `ch${id++}`,
      title: `Adventure Challenge ${id}`,
      description: `A ${cat} challenge to test your spirit!`,
      points: cat === 'daily' ? 25 : cat === 'weekly' ? 75 : 200,
      category: cat,
    });
  }

  return challenges;
};

const SYSTEM_CHALLENGES = generateChallenges();

// Badges
const ADVENTURE_BADGES = [
  { id: 'explorer', name: 'Explorer', icon: '🧭', requirement: 100, desc: '100 points' },
  { id: 'traveler', name: 'Traveler', icon: '✈️', requirement: 500, desc: '500 points' },
  { id: 'adventurer', name: 'Adventurer', icon: '🏕️', requirement: 1000, desc: '1000 points' },
  { id: 'pathfinder', name: 'Pathfinder', icon: '🗺️', requirement: 2500, desc: '2500 points' },
  { id: 'legend', name: 'Legend', icon: '👑', requirement: 5000, desc: '5000 points' },
];

export default function Adventure() {
  const [activeTab, setActiveTab] = useState('stats');
  const [challengeCategory, setChallengeCategory] = useState('daily');
  const [challenges, setChallenges] = useState<any[]>([]);
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
  const [travelCategory, setTravelCategory] = useState('heritage');

  useEffect(() => {
    fetchData();
    loadLocalData();
    
    const channel = supabase
      .channel('adventure-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_submissions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadLocalData = () => {
    const saved = localStorage.getItem('adventure_saved_places');
    const loved = localStorage.getItem('adventure_loved_places');
    const discover = localStorage.getItem('adventure_discover_points');
    if (saved) setSavedPlaces(new Set(JSON.parse(saved)));
    if (loved) setLovedPlaces(new Set(JSON.parse(loved)));
    if (discover) setDiscoverPoints(parseInt(discover));
  };

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [challengesRes, submissionsRes, pointsRes] = await Promise.all([
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('challenge_submissions').select('*, challenges(*)').eq('user_id', user.id),
        supabase.from('user_points').select('total_points').eq('user_id', user.id).maybeSingle()
      ]);

      setChallenges(challengesRes.data || []);
      setSubmissions(submissionsRes.data || []);
      setTotalPoints(pointsRes.data?.total_points || 0);
    } catch (error: any) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !selectedChallenge) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${selectedChallenge.id}-${Date.now()}.${fileExt}`;
      const proofType = proofFile.type.startsWith('video/') ? 'video' : 'image';

      const { error: uploadError } = await supabase.storage
        .from('challenge-proofs')
        .upload(fileName, proofFile, { cacheControl: '31536000', upsert: false, contentType: proofFile.type });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('challenge-proofs').getPublicUrl(fileName);

      const newPoints = totalPoints + (selectedChallenge.points || 50);
      
      await Promise.all([
        supabase.from('challenge_submissions').insert({
          user_id: user.id, challenge_id: selectedChallenge.id,
          proof_type: proofType, proof_url: publicUrl, status: 'approved'
        }),
        supabase.from('user_points').upsert({ user_id: user.id, total_points: newPoints })
      ]);

      toast.success(`+${selectedChallenge.points || 50} points! Challenge completed!`);
      setUploadDialog(false);
      setProofFile(null);
      setSelectedChallenge(null);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const handleVisitPlace = (place: any) => {
    const newPoints = discoverPoints + Math.floor(place.points / 10);
    setDiscoverPoints(newPoints);
    localStorage.setItem('adventure_discover_points', newPoints.toString());
    toast.success(`+${Math.floor(place.points / 10)} discover points!`);
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
    toast.success('❤️ Added to favorites!');
  };

  const isCompleted = (challengeId: string) => {
    return submissions.some(s => s.challenge_id === challengeId && s.status === 'approved');
  };

  const getEarnedBadges = () => {
    const total = totalPoints + discoverPoints;
    return ADVENTURE_BADGES.filter(b => total >= b.requirement);
  };

  // Mock leaderboard
  const globalLeaderboard = [
    { rank: 1, name: 'MountainKing', points: 8500, badge: '👑' },
    { rank: 2, name: 'TrekMaster', points: 7200, badge: '🥈' },
    { rank: 3, name: 'ExplorerPro', points: 6800, badge: '🥉' },
    { rank: 4, name: 'AdventureSeeker', points: 5500, badge: '' },
    { rank: 5, name: 'NatureLover', points: 4900, badge: '' },
  ];

  const regionalLeaderboard = [
    { rank: 1, name: 'NepaliExplorer', points: 4200, badge: '👑', country: '🇳🇵' },
    { rank: 2, name: 'HimalayanHiker', points: 3800, badge: '🥈', country: '🇳🇵' },
    { rank: 3, name: 'KathmanduKid', points: 3200, badge: '🥉', country: '🇳🇵' },
  ];

  const earnedBadges = getEarnedBadges();
  
  // Filter challenges by category (Daily/Weekly/Monthly)
  const filteredChallenges = SYSTEM_CHALLENGES.filter(c => c.category === challengeCategory);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🧗 Adventure
        </h1>
        <Badge variant="outline" className="gap-1">
          <Trophy className="w-3 h-3 text-yellow-500" />
          {totalPoints + discoverPoints} pts
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 h-auto p-0.5">
          <TabsTrigger value="stats" className="text-[10px] py-1.5">
            <Trophy className="w-3 h-3 mr-0.5" />Stats
          </TabsTrigger>
          <TabsTrigger value="challenges" className="text-[10px] py-1.5">
            <Target className="w-3 h-3 mr-0.5" />Tasks
          </TabsTrigger>
          <TabsTrigger value="discover" className="text-[10px] py-1.5">
            <Compass className="w-3 h-3 mr-0.5" />Discover
          </TabsTrigger>
          <TabsTrigger value="travel" className="text-[10px] py-1.5">
            <Map className="w-3 h-3 mr-0.5" />Travel
          </TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4 mt-3">
          {/* Your Adventure Stats */}
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
              <div className="space-y-2">
                <p className="text-xs font-medium">Badges Earned ({earnedBadges.length}/{ADVENTURE_BADGES.length})</p>
                <div className="flex gap-2 flex-wrap">
                  {ADVENTURE_BADGES.map((badge) => (
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
              </div>
            </CardContent>
          </Card>

          {/* Leaderboards */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Leaderboards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Global Top 10 */}
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Global Top 10
                </p>
                {globalLeaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                    <span className="w-5 text-center text-xs font-bold">
                      {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                    </span>
                    <span className="flex-1 text-xs">{player.name}</span>
                    <span className="text-xs font-bold">{player.points}</span>
                  </div>
                ))}
              </div>

              {/* Regional Top 10 */}
              <div>
                <p className="text-xs font-medium mb-2 flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Regional Top 10
                </p>
                {regionalLeaderboard.map((player) => (
                  <div key={player.rank} className="flex items-center gap-2 p-1.5 rounded bg-muted/20">
                    <span className="w-5 text-center text-xs font-bold">
                      {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                    </span>
                    <span>{player.country}</span>
                    <span className="flex-1 text-xs">{player.name}</span>
                    <span className="text-xs font-bold">{player.points}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab - Daily/Weekly/Monthly */}
        <TabsContent value="challenges" className="space-y-3 mt-3">
          {/* Category Selector - Daily/Weekly/Monthly */}
          <div className="flex gap-2">
            {CHALLENGE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={challengeCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => setChallengeCategory(cat.id)}
                >
                  <Icon className="w-3 h-3" />
                  {cat.name}
                </Button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-8">Loading challenges...</div>
          ) : filteredChallenges.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-8 text-center">
                <Mountain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No challenges available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {filteredChallenges.slice(0, 20).map((challenge) => (
                <Card key={challenge.id} className={`glass-card ${isCompleted(challenge.id) ? 'border-green-500/50' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium truncate">{challenge.title}</h3>
                          {isCompleted(challenge.id) && <Trophy className="w-3 h-3 text-yellow-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{challenge.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {challenge.category}
                        </Badge>
                        <span className="text-xs font-bold text-primary">{challenge.points} pts</span>
                      </div>
                    </div>
                    <Dialog open={uploadDialog && selectedChallenge?.id === challenge.id} onOpenChange={setUploadDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="w-full mt-2 h-8"
                          variant={isCompleted(challenge.id) ? 'outline' : 'default'}
                          disabled={isCompleted(challenge.id)}
                          onClick={() => setSelectedChallenge(challenge)}
                        >
                          {isCompleted(challenge.id) ? '✓ Completed' : 'Complete Challenge'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card">
                        <DialogHeader>
                          <DialogTitle>Upload Proof</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Challenge: {selectedChallenge?.title}</Label>
                            <p className="text-sm text-muted-foreground mt-1">{selectedChallenge?.description}</p>
                          </div>
                          <div>
                            <Label>Upload Photo/Video Proof</Label>
                            <Input 
                              type="file" 
                              accept="image/*,video/*" 
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              className="mt-1"
                            />
                          </div>
                          <Button 
                            onClick={handleUploadProof} 
                            disabled={!proofFile || uploading}
                            className="w-full"
                          >
                            {uploading ? 'Uploading...' : `Submit (+${selectedChallenge?.points} pts)`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Discover Tab - Nepal Top 10 */}
        <TabsContent value="discover" className="space-y-3 mt-3">
          <Card className="glass-card border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-3 text-center">
              <h3 className="font-bold text-sm mb-1">🇳🇵 Top 10 Places in Nepal</h3>
              <p className="text-xs text-muted-foreground">Discover and earn points!</p>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {NEPAL_TOP_PLACES.map((place) => (
              <Card key={place.id} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-2xl">
                      {place.type === 'mountain' ? '🏔️' : 
                       place.type === 'lake' ? '🏞️' : 
                       place.type === 'temple' ? '🛕' : 
                       place.type === 'heritage' ? '🏛️' : 
                       place.type === 'wildlife' ? '🐘' : '🏞️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{place.name}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />{place.location}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />{place.stars}
                        </span>
                        <span className="text-[10px] flex items-center gap-0.5">
                          <Heart className={`w-3 h-3 ${lovedPlaces.has(place.id) ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} />
                          {place.hearts + (lovedPlaces.has(place.id) ? 1 : 0)}
                        </span>
                        <span className="text-[10px] text-primary font-bold">{place.points} pts</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="flex-1 h-7 text-[10px]" onClick={() => handleVisitPlace(place)}>
                      <Navigation className="w-3 h-3 mr-1" />Visit
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleLovePlace(place.id)}>
                      <Heart className={`w-3 h-3 ${lovedPlaces.has(place.id) ? 'text-red-500 fill-red-500' : ''}`} />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleSavePlace(place.id)}>
                      <Bookmark className={`w-3 h-3 ${savedPlaces.has(place.id) ? 'text-primary fill-primary' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Travel Tab */}
        <TabsContent value="travel" className="space-y-3 mt-3">
          {/* Category Selector */}
          <div className="flex gap-2">
            {TRAVEL_CATEGORIES.map((cat) => (
              <Button
                key={cat.id}
                variant={travelCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setTravelCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>

          <Card className="glass-card border-primary/30">
            <CardContent className="p-3 text-center">
              <h3 className="font-bold text-sm">🇳🇵 Top 5 from Nepal</h3>
              <p className="text-xs text-muted-foreground">Must-visit places in {TRAVEL_CATEGORIES.find(c => c.id === travelCategory)?.name}</p>
            </CardContent>
          </Card>

          <div className="grid gap-2">
            {NEPAL_TOP_PLACES
              .filter(p => 
                travelCategory === 'heritage' ? ['temple', 'heritage'].includes(p.type) :
                travelCategory === 'nature' ? ['lake', 'wildlife'].includes(p.type) :
                ['mountain', 'trek'].includes(p.type)
              )
              .slice(0, 5)
              .map((place) => (
              <Card key={place.id} className="glass-card">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl">
                      {place.type === 'mountain' ? '🏔️' : 
                       place.type === 'lake' ? '🏞️' : 
                       place.type === 'temple' ? '🛕' : 
                       place.type === 'heritage' ? '🏛️' : 
                       place.type === 'wildlife' ? '🐘' : '🏞️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{place.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{place.location}</p>
                    </div>
                    <Button size="sm" className="h-7" onClick={() => handleVisitPlace(place)}>
                      <Navigation className="w-3 h-3 mr-1" />Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
