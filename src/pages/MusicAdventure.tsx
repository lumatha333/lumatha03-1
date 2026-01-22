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

// Import from data files
import { SYSTEM_CHALLENGES } from '@/data/adventureChallenges';
import { ALL_PLACES } from '@/data/adventurePlaces';

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
            {ALL_PLACES.length}+ places from 220+ countries
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
                          {myRating ? `Your: ${myRating.toFixed(2)}⭐` : `Avg: ${place.stars.toFixed(2)}⭐`}
                        </span>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePlaceVisit(place.id)} 
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isVisited ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Footprints className="w-4 h-4" />
                          {isVisited ? "Visited" : "Visit"}
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
