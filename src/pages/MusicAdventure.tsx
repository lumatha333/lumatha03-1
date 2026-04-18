import { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { DailyDoseCard } from '@/components/feed/DailyDoseCard';

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
  RefreshCw, Users, ExternalLink, Image, Video, Map, Flag, List, 
  Shuffle, Leaf, Coffee, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AdventureCommentsDialog } from '@/components/AdventureCommentsDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';
import { TruncatedText } from '@/components/adventure/TruncatedText';
import LazyBlurImage from '@/components/LazyBlurImage';
import { cn } from '@/lib/utils';

// Lazy load map component
const DiscoverMapView = lazy(() => import('@/components/adventure/DiscoverMapView').then(m => ({ default: m.DiscoverMapView })));

// ============= CHALLENGE CATEGORIES =============
const CHALLENGE_CATEGORIES = [
  { name: 'Health', icon: '💚' },
  { name: 'Fitness', icon: '🏃' },
  { name: 'Mind', icon: '🧠' },
  { name: 'Learning', icon: '📚' },
  { name: 'Lifestyle', icon: '🌟' },
  { name: 'Travel', icon: '✈️' }
];

// Ranking categories with icons (like home feed)
const RANKING_CATEGORIES = [
  { id: 'challenges', icon: Target, label: 'Challenges', color: 'text-orange-500' },
  { id: 'discover', icon: Compass, label: 'Discover', color: 'text-blue-500' },
  { id: 'travel', icon: Plane, label: 'Travel', color: 'text-purple-500' },
];

// Import from data files
import { SYSTEM_CHALLENGES } from '@/data/adventureChallenges';
import { ADVENTURE_PLACES, getAllCountries } from '@/data/adventurePlaces';

// ============= COMPONENT =============
export default function MusicAdventure() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('challenges');
  
  // Accordion filter states
  const [sourceFilter, setSourceFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Search states
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [travelSearch, setTravelSearch] = useState('');
  
  // Discover explore mode
  const [exploreMode, setExploreMode] = useState<'all' | 'my_country' | 'random_country' | 'hidden_gems'>('all');
  const [randomCountry, setRandomCountry] = useState<string | null>(null);
  const [exploreCount, setExploreCount] = useState(0);
  const [showSoftStop, setShowSoftStop] = useState(false);
  const [discoverTypeFilter, setDiscoverTypeFilter] = useState<'all' | 'unesco' | 'hidden'>('all');
  
  // Challenge states
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [likedChallenges, setLikedChallenges] = useState<Set<string>>(new Set());
  
  // Place states
  const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [discoverViewMode, setDiscoverViewMode] = useState<'list' | 'map'>('list');
  
  // Travel stories states
  const [travelStories, setTravelStories] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [newStory, setNewStory] = useState({ 
    title: '', 
    content: '', 
    image: '', 
    video: '',
    location: '',
    mediaType: 'image' as 'image' | 'video'
  });
  const [travelFilter, setTravelFilter] = useState<'global' | 'regional'>('global');
  
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
  const openMediaViewer = (mediaUrl: string, mediaType: string, title: string, id: string, isLiked: boolean) => {
    setMediaViewerData({
      urls: [mediaUrl],
      types: [mediaType],
      title,
      id,
      isLiked
    });
    setMediaViewerOpen(true);
  };

  // Load data from localStorage
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

  // Challenge reset logic
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

  // Filter challenges
  const filteredChallenges = useMemo(() => {
    let challenges = sourceFilter === 'custom' ? customChallenges : 
                     sourceFilter === 'system' ? SYSTEM_CHALLENGES : 
                     [...SYSTEM_CHALLENGES, ...customChallenges];
    
    if (timeFilter !== 'all') {
      challenges = challenges.filter(c => c.duration === timeFilter);
    }
    
    return challenges.slice(0, 50);
  }, [sourceFilter, timeFilter, customChallenges]);

  // Pick random country
  const pickRandomCountry = useCallback(() => {
    const countries = getAllCountries();
    const rand = countries[Math.floor(Math.random() * countries.length)];
    setRandomCountry(rand.name);
    setExploreCount(prev => {
      const next = prev + 1;
      if (next >= 10 && next % 10 === 0) setShowSoftStop(true);
      return next;
    });
  }, []);

  // Filter places with explore modes
  const filteredPlaces = useMemo(() => {
    let places = [...ADVENTURE_PLACES];
    
    // Type filter
    if (discoverTypeFilter === 'unesco') places = places.filter(p => p.type === 'unesco');
    else if (discoverTypeFilter === 'hidden') places = places.filter(p => p.type === 'hidden');
    
    // Mode filter
    if (exploreMode === 'my_country' && profile?.country) {
      places = places.filter(p => p.country.toLowerCase() === profile.country.toLowerCase());
    } else if (exploreMode === 'random_country' && randomCountry) {
      places = places.filter(p => p.country === randomCountry);
    } else if (exploreMode === 'hidden_gems') {
      places = places.filter(p => p.type === 'hidden');
    }
    
    // Search filter
    if (discoverSearch.trim()) {
      const search = discoverSearch.toLowerCase();
      places = places.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.country.toLowerCase().includes(search)
      );
    }
    
    return places.slice(0, 100);
  }, [discoverSearch, exploreMode, randomCountry, profile?.country, discoverTypeFilter]);

  // Filter travel stories with Global/Regional
  const filteredTravelStories = useMemo(() => {
    let stories = travelStories;
    
    // Apply regional filter
    if (travelFilter === 'regional' && profile?.country) {
      stories = stories.filter(s => 
        s.location?.toLowerCase().includes(profile.country.toLowerCase()) ||
        s.creatorCountry === profile.country
      );
    }
    
    // Apply search
    if (travelSearch.trim()) {
      const search = travelSearch.toLowerCase();
      stories = stories.filter(p => 
        p.title.toLowerCase().includes(search) || 
        p.content.toLowerCase().includes(search) ||
        p.location?.toLowerCase().includes(search)
      );
    }
    
    return stories;
  }, [travelSearch, travelStories, travelFilter, profile?.country]);

  // Challenge actions
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
      creatorId: user?.id
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

  // Discover actions
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

  // Travel story actions
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    // Check file size for videos (max 50MB)
    if (type === 'video' && file.size > 50 * 1024 * 1024) {
      toast.error('Video must be under 50MB');
      return;
    }
    
    setUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts-media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('posts-media').getPublicUrl(fileName);
      
      if (type === 'image') {
        setNewStory(prev => ({ ...prev, image: data.publicUrl, mediaType: 'image' }));
        toast.success('Image uploaded! 📸');
      } else {
        setNewStory(prev => ({ ...prev, video: data.publicUrl, mediaType: 'video' }));
        toast.success('Video uploaded! 🎬');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };
  
  const createTravelStory = () => {
    if (!newStory.title.trim() || !newStory.content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }
    if (!newStory.image && !newStory.video) {
      toast.error('Please upload an image or video for your story');
      return;
    }
    const story = {
      id: `story-${Date.now()}`,
      ...newStory,
      author: profile?.name || 'You',
      authorAvatar: profile?.name?.[0] || 'U',
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      creatorId: user?.id,
      creatorCountry: profile?.country || ''
    };
    setTravelStories(prev => [story, ...prev]);
    setShowCreateStory(false);
    setNewStory({ title: '', content: '', image: '', video: '', location: '', mediaType: 'image' });
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

  // Ranking calculations
  const calculateUserRank = () => {
    if (rankingCategory === 'challenges') {
      return completedChallenges.size === 0 ? 'Unranked' : 1;
    } else if (rankingCategory === 'discover') {
      return visitedPlaces.size === 0 ? 'Unranked' : 1;
    } else {
      const totalLikes = travelStories.reduce((sum, story) => sum + (likedPosts.has(story.id) ? 1 : 0), 0);
      return totalLikes === 0 ? 'Unranked' : 1;
    }
  };

  const userPoints = rankingCategory === 'challenges' 
    ? completedChallenges.size * 50 
    : rankingCategory === 'discover'
    ? visitedPlaces.size * 30
    : likedPosts.size * 20;

  const globalRankings: { rank: number; name: string; points: number; emoji: string }[] = [];
  const regionalRankings: { rank: number; name: string; points: number; emoji: string }[] = [];
  const userRank = calculateUserRank();
  
  const currentRankingCategory = RANKING_CATEGORIES.find(c => c.id === rankingCategory) || RANKING_CATEGORIES[0];
  const RankingIcon = currentRankingCategory.icon;

  return (
    <div className="min-h-screen pb-24 overflow-y-auto scroll-smooth overscroll-behavior-y-contain">
      <div className="px-4 py-3">
      </div>

      {/* Main Tabs */}
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

        {/* CHALLENGES TAB */}
        <TabsContent value="challenges" className="mt-4 space-y-4">
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
                  <Clock className="w-4 h-4 text-primary" />
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

          {/* Challenge Cards */}
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
                  <Card key={challenge.id} className={`glass-card overflow-hidden transition-all ${isCompleted ? 'border-primary/30 bg-primary/5' : ''}`}>
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-primary/20'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => toggleChallengeLike(challenge.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{likedChallenges.has(challenge.id) ? 1 : 0}</span>
                        </button>
                        {(!isCustom || isOwner) && (
                          <button 
                            onClick={() => openComments(challenge.id, challenge.title)} 
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            <MessageCircle className="w-4 h-4" />
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

        {/* DISCOVER TAB */}
        <TabsContent value="discover" className="mt-4 space-y-4">
          {/* Soft Stop Dialog */}
          {showSoftStop && (
            <Card className="glass-card border-primary/30 overflow-hidden animate-fade-in">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-4 text-center space-y-3">
                <Leaf className="w-8 h-8 text-emerald-400 mx-auto" />
                <div>
                  <p className="text-sm font-semibold">You've explored {exploreCount} places 🌿</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Take a mindful pause. Save favorites for later.</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowSoftStop(false)}>
                    <Coffee className="w-3.5 h-3.5" /> Pause
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => setShowSoftStop(false)}>
                    <Eye className="w-3.5 h-3.5" /> Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Explore Mode Selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all' as const, icon: Globe, label: 'All Places' },
              { id: 'my_country' as const, icon: Flag, label: 'My Country' },
              { id: 'random_country' as const, icon: Shuffle, label: 'Random' },
              { id: 'hidden_gems' as const, icon: Sparkles, label: 'Hidden Gems' },
            ].map(mode => (
              <Button
                key={mode.id}
                size="sm"
                variant={exploreMode === mode.id ? 'default' : 'outline'}
                className="h-8 text-xs gap-1 shrink-0"
                onClick={() => {
                  setExploreMode(mode.id);
                  if (mode.id === 'random_country') pickRandomCountry();
                }}
              >
                <mode.icon className="w-3.5 h-3.5" />
                {mode.label}
              </Button>
            ))}
          </div>

          {/* Random Country Banner */}
          {exploreMode === 'random_country' && randomCountry && (
            <Card className="glass-card border-primary/20 overflow-hidden">
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Exploring: {randomCountry}</p>
                    <p className="text-[10px] text-muted-foreground">{filteredPlaces.length} places found</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={pickRandomCountry}>
                  <Shuffle className="w-3 h-3" /> New Country
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Search + View Toggle + Type Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search places..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button size="sm" variant={discoverViewMode === 'list' ? 'default' : 'ghost'} className="h-8 w-8 p-0" onClick={() => setDiscoverViewMode('list')}>
                <List className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={discoverViewMode === 'map' ? 'default' : 'ghost'} className="h-8 w-8 p-0" onClick={() => setDiscoverViewMode('map')}>
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Type filter pills */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 flex-1">
              {[
                { id: 'all' as const, label: 'All' },
                { id: 'unesco' as const, label: '🏛️ UNESCO' },
                { id: 'hidden' as const, label: '💎 Hidden' },
              ].map(t => (
                <Button key={t.id} size="sm" variant={discoverTypeFilter === t.id ? 'default' : 'ghost'} className="h-7 text-[10px] px-2.5" onClick={() => setDiscoverTypeFilter(t.id)}>
                  {t.label}
                </Button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {filteredPlaces.length} places • {visitedPlaces.size} visited
            </p>
          </div>

          {/* Map View */}
          {discoverViewMode === 'map' && (
            <Suspense fallback={
              <div className="h-[400px] rounded-xl bg-muted/50 flex items-center justify-center">
                <Map className="w-12 h-12 mx-auto text-muted-foreground/30 animate-pulse" />
              </div>
            }>
              <DiscoverMapView
                places={filteredPlaces}
                visitedPlaces={visitedPlaces}
                lovedPlaces={lovedPlaces}
                onToggleVisit={togglePlaceVisit}
                onToggleLove={togglePlaceLove}
                onOpenPlace={(place) => openMediaViewer(place.image, 'image', place.name, place.id, lovedPlaces.has(place.id))}
              />
            </Suspense>
          )}

          {/* List View */}
          {discoverViewMode === 'list' && (
            <div className="space-y-4">
              {filteredPlaces.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center">
                    <MapPin className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="font-medium">No places found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exploreMode === 'my_country' ? 'No places for your country yet' : 'Try a different search or mode'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredPlaces.map(place => {
                  const isVisited = visitedPlaces.has(place.id);
                  const isLoved = lovedPlaces.has(place.id);
                  const myRating = userRatings[place.id];
                  
                  return (
                    <Card key={place.id} className="glass-card overflow-hidden">
                      <div 
                        className="aspect-video w-full overflow-hidden relative cursor-pointer"
                        onClick={() => openMediaViewer(place.image, 'image', place.name, place.id, lovedPlaces.has(place.id))}
                      >
                        <LazyBlurImage 
                          src={place.image} 
                          alt={place.name}
                          className="w-full h-full"
                        />
                        <div className="absolute top-2 left-2 flex gap-1">
                          {isVisited && (
                            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-medium">
                              ✓ Visited
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${place.type === 'unesco' ? 'bg-amber-500/80 text-white' : 'bg-violet-500/80 text-white'}`}>
                            {place.type === 'unesco' ? '🏛️ UNESCO' : '💎 Hidden Gem'}
                          </span>
                        </div>
                        {/* Attribution */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-1.5">
                          <p className="text-[8px] text-white/70">
                            📷 via Wikimedia Commons
                          </p>
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
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
                        
                        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                          <button 
                            onClick={() => togglePlaceVisit(place.id)} 
                            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isVisited ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Footprints className="w-4 h-4" />
                            {isVisited ? "Visited" : "Visit"}
                          </button>
                          <button 
                            onClick={() => togglePlaceLove(place.id)} 
                            className={`flex items-center gap-1.5 text-xs transition-colors ${isLoved ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
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
          )}
        </TabsContent>

        {/* TRAVEL TAB */}
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
                <p className="text-[10px] text-muted-foreground">Upload photos or videos from your journey</p>
              </div>
            </CardContent>
          </Card>

          {/* Global/Regional Filter (like Home) */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted rounded-lg p-1 flex-1">
              <Button
                size="sm"
                variant={travelFilter === 'global' ? 'default' : 'ghost'}
                className="flex-1 h-8 gap-1.5"
                onClick={() => setTravelFilter('global')}
              >
                <Globe className="w-3.5 h-3.5" />
                Global
              </Button>
              <Button
                size="sm"
                variant={travelFilter === 'regional' ? 'default' : 'ghost'}
                className="flex-1 h-8 gap-1.5"
                onClick={() => setTravelFilter('regional')}
              >
                <Flag className="w-3.5 h-3.5" />
                Regional
              </Button>
            </div>
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

          {/* Travel Stories */}
          <div className="space-y-4">
            {filteredTravelStories.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <Plane className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="font-medium">No travel stories yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {travelFilter === 'regional' ? 'No stories from your region' : 'Share your first journey ✨'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTravelStories.map(post => {
                const isLiked = likedPosts.has(post.id);
                const hasVideo = post.video && post.mediaType === 'video';
                
                return (
                  <Card key={post.id} className="glass-card overflow-hidden">
                    <CardContent className="p-4 pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                          {post.authorAvatar}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.author}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {post.location && (
                              <>
                                <MapPin className="w-3 h-3" />
                                {post.location}
                              </>
                            )}
                            {!post.location && 'Travel Story'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Media - Image or Video */}
                    <div 
                      className="aspect-[4/3] w-full overflow-hidden cursor-pointer relative"
                      onClick={() => openMediaViewer(
                        hasVideo ? post.video : post.image, 
                        hasVideo ? 'video' : 'image',
                        post.title, 
                        post.id, 
                        likedPosts.has(post.id)
                      )}
                    >
                      {hasVideo ? (
                        <video 
                          src={post.video}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <LazyBlurImage 
                          src={post.image} 
                          alt={post.title}
                          className="w-full h-full"
                        />
                      )}
                      {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Video className="w-5 h-5 text-foreground ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-4 pt-3">
                      <h3 className="font-semibold text-base">{post.title}</h3>
                      <TruncatedText 
                        text={post.content} 
                        maxWords={50} 
                        className="text-sm text-muted-foreground mt-1"
                      />
                      
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
                        <button 
                          onClick={() => togglePostLike(post.id)} 
                          className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{isLiked ? 1 : 0}</span>
                        </button>
                        <button 
                          onClick={() => openComments(post.id, post.title)} 
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => openShare(post.id, post.title, post.content)} 
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

        {/* RANKING TAB */}
        <TabsContent value="ranking" className="mt-4 space-y-4">
          {/* Category Selector (like Home feed) */}
          <div className="flex items-center justify-center gap-1 bg-muted rounded-lg p-1">
            {RANKING_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = rankingCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn("flex-1 h-9 gap-1.5", isActive && cat.color)}
                  onClick={() => setRankingCategory(cat.id as any)}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{cat.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Scope: Global / Regional */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={rankingFilter === 'global' ? 'default' : 'outline'}
              className="gap-1.5"
              onClick={() => setRankingFilter('global')}
            >
              <Globe className="w-4 h-4" />
              Global
            </Button>
            <Button
              size="sm"
              variant={rankingFilter === 'regional' ? 'default' : 'outline'}
              className="gap-1.5"
              onClick={() => setRankingFilter('regional')}
            >
              <MapPin className="w-4 h-4" />
              Regional
            </Button>
          </div>

          {/* Your Rank Card */}
          <Card className="glass-card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
            <CardContent className="py-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <RankingIcon className={cn("w-5 h-5", currentRankingCategory.color)} />
                <p className="text-sm text-muted-foreground">
                  Your {currentRankingCategory.label} Rank
                </p>
              </div>
              <p className={`text-3xl font-bold ${userRank === 'Unranked' ? 'text-muted-foreground' : 'text-primary'}`}>
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

          {/* Top 10 Rankings */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                {rankingFilter === 'global' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                Top 10 {rankingFilter === 'global' ? 'Global' : 'Regional'} • {currentRankingCategory.label}
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
                        {rankingCategory === 'travel' && <Heart className="w-3 h-3 text-destructive fill-current" />}
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

      {/* CREATE CHALLENGE DIALOG */}
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

      {/* CREATE TRAVEL STORY DIALOG */}
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
              <label className="text-sm font-medium">Location</label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  value={newStory.location} 
                  onChange={e => setNewStory(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g., Paris, France"
                  className="pl-10"
                />
              </div>
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
              <label className="text-sm font-medium">Upload Media *</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {/* Image Upload */}
                <label className={cn(
                  "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  newStory.image ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                )}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleMediaUpload(e, 'image')}
                    disabled={uploadingMedia}
                  />
                  {newStory.image ? (
                    <div className="text-center">
                      <Image className="w-6 h-6 mx-auto text-primary" />
                      <p className="text-[10px] text-primary mt-1">Image Added ✓</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground mt-1">Add Photo</p>
                    </div>
                  )}
                </label>
                
                {/* Video Upload */}
                <label className={cn(
                  "flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                  newStory.video ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                )}>
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    onChange={(e) => handleMediaUpload(e, 'video')}
                    disabled={uploadingMedia}
                  />
                  {newStory.video ? (
                    <div className="text-center">
                      <Video className="w-6 h-6 mx-auto text-primary" />
                      <p className="text-[10px] text-primary mt-1">Video Added ✓</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Video className="w-6 h-6 mx-auto text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground mt-1">Add Video</p>
                    </div>
                  )}
                </label>
              </div>
              {uploadingMedia && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                  <span className="text-xs text-muted-foreground">Uploading...</span>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-2">
                Photos: JPG, PNG, WEBP • Videos: MP4, MOV (max 50MB)
              </p>
            </div>
            <Button onClick={createTravelStory} className="w-full" disabled={uploadingMedia || (!newStory.image && !newStory.video)}>
              <Plane className="w-4 h-4 mr-2" />
              Share Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <AdventureCommentsDialog 
        open={commentsOpen} 
        onOpenChange={setCommentsOpen} 
        itemId={selectedPostId} 
        itemTitle={selectedPostTitle}
        itemType={selectedPostId.startsWith('sys-') || selectedPostId.startsWith('custom-') ? 'challenge' : selectedPostId.startsWith('story-') ? 'travel' : 'place'}
      />

      {/* Share Dialog */}
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
      <DailyDoseCard />
    </div>
  );
}
