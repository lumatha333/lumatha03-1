import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Music, Play, Pause, Upload, Plus, List, Mountain, Trophy, MapPin, Compass, Map, Camera, Heart, Video, CheckCircle, ExternalLink, Globe, Navigation } from 'lucide-react';

// Sample challenges with real proof requirements
const sampleChallenges = [
  { id: '1', title: '20 Push-ups Challenge', description: 'Complete 20 push-ups and record a video proof', points: 50, difficulty: 'easy', category: 'Fitness', proof_required: 'video' },
  { id: '2', title: 'Drink 1L Water', description: 'Drink 1 liter of water and record proof video', points: 30, difficulty: 'easy', category: 'Health', proof_required: 'video' },
  { id: '3', title: 'Morning Run 2km', description: 'Complete a 2km morning run with video proof', points: 100, difficulty: 'medium', category: 'Fitness', proof_required: 'video' },
  { id: '4', title: 'Meditation 10min', description: 'Complete 10 minutes meditation session', points: 40, difficulty: 'easy', category: 'Wellness', proof_required: 'video' },
  { id: '5', title: 'Plant a Tree', description: 'Plant a tree and take photo/video proof', points: 200, difficulty: 'hard', category: 'Environment', proof_required: 'video' },
];

// Discover locations with links
const discoverLocations = [
  { name: 'Rara Lake', location: 'Mugu, Nepal', image: '🏔️', link: 'https://maps.google.com/?q=Rara+Lake', type: 'regional' },
  { name: 'Phewa Lake', location: 'Pokhara, Nepal', image: '⛵', link: 'https://maps.google.com/?q=Phewa+Lake+Pokhara', type: 'regional' },
  { name: 'Chitwan National Park', location: 'Chitwan, Nepal', image: '🦏', link: 'https://maps.google.com/?q=Chitwan+National+Park', type: 'regional' },
  { name: 'Lumbini', location: 'Rupandehi, Nepal', image: '🙏', link: 'https://maps.google.com/?q=Lumbini+Nepal', type: 'regional' },
  { name: 'Eiffel Tower', location: 'Paris, France', image: '🗼', link: 'https://maps.google.com/?q=Eiffel+Tower', type: 'global' },
  { name: 'Grand Canyon', location: 'Arizona, USA', image: '🏜️', link: 'https://maps.google.com/?q=Grand+Canyon', type: 'global' },
  { name: 'Great Wall', location: 'Beijing, China', image: '🏯', link: 'https://maps.google.com/?q=Great+Wall+of+China', type: 'global' },
  { name: 'Machu Picchu', location: 'Peru', image: '🏛️', link: 'https://maps.google.com/?q=Machu+Picchu', type: 'global' },
];

// Travel destinations with links and regional/global separation
const travelDestinations = [
  { name: 'Everest Base Camp', location: 'Solukhumbu', image: '🗻', link: 'https://maps.google.com/?q=Everest+Base+Camp', type: 'regional', country: 'Nepal' },
  { name: 'Bardiya National Park', location: 'Bardiya', image: '🐅', link: 'https://maps.google.com/?q=Bardiya+National+Park', type: 'regional', country: 'Nepal' },
  { name: 'Annapurna Circuit', location: 'Kaski', image: '⛰️', link: 'https://maps.google.com/?q=Annapurna+Circuit', type: 'regional', country: 'Nepal' },
  { name: 'Patan Durbar Square', location: 'Lalitpur', image: '🏛️', link: 'https://maps.google.com/?q=Patan+Durbar+Square', type: 'regional', country: 'Nepal' },
  { name: 'Santorini', location: 'Greece', image: '🌅', link: 'https://maps.google.com/?q=Santorini+Greece', type: 'global', country: 'Greece' },
  { name: 'Bali', location: 'Indonesia', image: '🌴', link: 'https://maps.google.com/?q=Bali+Indonesia', type: 'global', country: 'Indonesia' },
  { name: 'Tokyo', location: 'Japan', image: '🗾', link: 'https://maps.google.com/?q=Tokyo+Japan', type: 'global', country: 'Japan' },
  { name: 'Dubai', location: 'UAE', image: '🏙️', link: 'https://maps.google.com/?q=Dubai+UAE', type: 'global', country: 'UAE' },
];

export default function MusicAdventure() {
  const [activeTab, setActiveTab] = useState('music');
  const [locationFilter, setLocationFilter] = useState<'all' | 'regional' | 'global'>('all');
  
  // Music State
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [musicLoading, setMusicLoading] = useState(false);

  // Adventure State
  const [challenges, setChallenges] = useState(sampleChallenges);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [uploadChallengeDialog, setUploadChallengeDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    fetchPlaylists();
    // Load completed challenges from localStorage
    const saved = localStorage.getItem('completedChallenges');
    if (saved) {
      setCompletedChallenges(new Set(JSON.parse(saved)));
      const points = JSON.parse(saved).reduce((acc: number, id: string) => {
        const challenge = sampleChallenges.find(c => c.id === id);
        return acc + (challenge?.points || 0);
      }, 0);
      setTotalPoints(points);
    }
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchTracks(selectedPlaylist);
    }
  }, [selectedPlaylist]);

  // Music Functions
  const fetchPlaylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('playlists').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setPlaylists(data || []);
      if (data && data.length > 0 && !selectedPlaylist) setSelectedPlaylist(data[0].id);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchTracks = async (playlistId: string) => {
    const { data } = await supabase.from('playlist_tracks').select('*').eq('playlist_id', playlistId).order('created_at', { ascending: false });
    setTracks(data || []);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return toast.error('Enter playlist name');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('playlists').insert({ user_id: user.id, name: newPlaylistName }).select().single();
    if (error) return toast.error('Failed to create playlist');
    setPlaylists([data, ...playlists]);
    setSelectedPlaylist(data.id);
    setNewPlaylistName('');
    setPlaylistDialogOpen(false);
    toast.success('Playlist created!');
  };

  const handleUploadTrack = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadArtist.trim() || !selectedPlaylist) return toast.error('Fill all fields');
    setMusicLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      await supabase.storage.from('music').upload(fileName, uploadFile);
      const { data: { publicUrl } } = supabase.storage.from('music').getPublicUrl(fileName);
      const { data } = await supabase.from('playlist_tracks').insert({ playlist_id: selectedPlaylist, title: uploadTitle, artist: uploadArtist, file_url: publicUrl }).select().single();
      setTracks([data, ...tracks]);
      setUploadFile(null);
      setUploadTitle('');
      setUploadArtist('');
      setUploadDialogOpen(false);
      toast.success('Track added!');
    } catch (error) {
      toast.error('Failed to upload track');
    } finally {
      setMusicLoading(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    if (!track.file_url) return toast.error('No audio file');
    if (currentTrack?.id === track.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack?.id !== track.id) {
        audio.src = track.file_url;
        setCurrentTrack(track);
      }
      audio.play().catch(() => toast.error('Failed to play'));
      setIsPlaying(true);
    }
  };

  // Adventure Functions - Real proof system
  const handleUploadProof = async () => {
    if (!proofFile || !selectedChallenge) {
      toast.error('Please select a video/photo proof');
      return;
    }
    
    // Only accept video for video-required challenges
    if (selectedChallenge.proof_required === 'video' && !proofFile.type.startsWith('video/')) {
      toast.error('This challenge requires VIDEO proof only!');
      return;
    }
    
    setUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mark as completed
      const newCompleted = new Set(completedChallenges);
      newCompleted.add(selectedChallenge.id);
      setCompletedChallenges(newCompleted);
      localStorage.setItem('completedChallenges', JSON.stringify([...newCompleted]));
      
      // Add points
      const newPoints = totalPoints + selectedChallenge.points;
      setTotalPoints(newPoints);
      
      toast.success(`🎉 Challenge completed! +${selectedChallenge.points} points!`);
      setUploadChallengeDialog(false);
      setProofFile(null);
      setSelectedChallenge(null);
    } catch (error) {
      toast.error('Failed to upload proof');
    } finally {
      setUploading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const isCompleted = (challengeId: string) => completedChallenges.has(challengeId);

  const moodPlaylists = [
    { name: '🎉 Party Vibes', color: 'from-pink-500 to-purple-500' },
    { name: '😌 Chill & Relax', color: 'from-blue-500 to-cyan-500' },
    { name: '💪 Workout Energy', color: 'from-orange-500 to-red-500' },
    { name: '🌙 Night Mood', color: 'from-indigo-500 to-purple-500' },
    { name: '☀️ Morning Fresh', color: 'from-yellow-400 to-orange-400' },
    { name: '❤️ Love Songs', color: 'from-rose-500 to-pink-500' },
  ];

  // Filter locations
  const filteredDiscoverLocations = discoverLocations.filter(loc => 
    locationFilter === 'all' || loc.type === locationFilter
  );
  
  const filteredTravelDestinations = travelDestinations.filter(dest => 
    locationFilter === 'all' || dest.type === locationFilter
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl md:text-3xl font-black flex items-center gap-2">
          🎵 Music & Adventure
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 glass-card px-3 py-2 rounded-full">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-bold">{totalPoints} pts</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full justify-start mb-6">
          <TabsTrigger value="music" className="gap-2 flex-1">
            <Music className="w-4 h-4" />
            Music
          </TabsTrigger>
          <TabsTrigger value="adventure" className="gap-2 flex-1">
            <Mountain className="w-4 h-4" />
            Adventure
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-2 flex-1">
            <Compass className="w-4 h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="travel" className="gap-2 flex-1">
            <Map className="w-4 h-4" />
            Travel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="music" className="space-y-6">
          {/* Mood Playlists */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {moodPlaylists.map((mood, i) => (
              <Card key={i} className={`cursor-pointer hover-lift overflow-hidden`}>
                <CardContent className={`p-4 bg-gradient-to-br ${mood.color} text-white`}>
                  <p className="font-bold text-sm md:text-base">{mood.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Playlists */}
          <Card className="glass-card border-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" />
                  Your Playlists
                </CardTitle>
                <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="w-4 h-4 mr-2" />New</Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader><DialogTitle>Create Playlist</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Name</Label><Input value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} className="glass-card" /></div>
                      <Button onClick={handleCreatePlaylist} className="w-full">Create</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {playlists.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No playlists yet. Create one!</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {playlists.map((p) => (
                    <Button key={p.id} variant={selectedPlaylist === p.id ? 'default' : 'outline'} onClick={() => setSelectedPlaylist(p.id)} className="rounded-full">
                      {p.name}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracks */}
          {selectedPlaylist && (
            <Card className="glass-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    {playlists.find(p => p.id === selectedPlaylist)?.name}
                  </CardTitle>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild><Button size="sm"><Upload className="w-4 h-4 mr-2" />Upload</Button></DialogTrigger>
                    <DialogContent className="glass-card">
                      <DialogHeader><DialogTitle>Upload Track</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div><Label>Audio File</Label><Input type="file" accept="audio/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass-card" /></div>
                        <div><Label>Title</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass-card" /></div>
                        <div><Label>Artist</Label><Input value={uploadArtist} onChange={(e) => setUploadArtist(e.target.value)} className="glass-card" /></div>
                        <Button onClick={handleUploadTrack} disabled={musicLoading} className="w-full">{musicLoading ? 'Uploading...' : 'Add Track'}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tracks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No tracks. Upload some music!</p>
                ) : (
                  <div className="space-y-3">
                    {tracks.map((track) => (
                      <div key={track.id} className="p-3 rounded-lg glass-card border hover-lift flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" onClick={() => handlePlayTrack(track)}>
                            {currentTrack?.id === track.id && isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          </Button>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{track.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {currentTrack && (
                  <div className="p-4 rounded-lg glass-card border mt-4">
                    <div className="text-center space-y-4">
                      <div><h3 className="font-semibold">{currentTrack.title}</h3><p className="text-sm text-muted-foreground">{currentTrack.artist}</p></div>
                      <Button size="icon" className="rounded-full w-14 h-14 btn-cosmic" onClick={() => handlePlayTrack(currentTrack)}>
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="adventure" className="space-y-6">
          {/* Points Banner */}
          <Card className="glass-card bg-gradient-to-r from-primary/20 to-secondary/20">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Your Adventure Points</h3>
                <p className="text-sm text-muted-foreground">Complete challenges to earn points!</p>
              </div>
              <div className="text-3xl font-black text-primary">{totalPoints} 🏆</div>
            </CardContent>
          </Card>

          {/* Challenges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {challenges.map((challenge) => (
              <Card key={challenge.id} className={`glass-card hover-lift ${isCompleted(challenge.id) ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                    {isCompleted(challenge.id) && <CheckCircle className="h-5 w-5 text-green-500" />}
                  </div>
                  <CardDescription>{challenge.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                    <Badge variant="outline">{challenge.points} pts</Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                      <Video className="h-3 w-3 mr-1" />
                      Video Proof
                    </Badge>
                  </div>
                  
                  {!isCompleted(challenge.id) && (
                    <Dialog open={uploadChallengeDialog && selectedChallenge?.id === challenge.id} onOpenChange={setUploadChallengeDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedChallenge(challenge)}>
                          <Camera className="w-4 h-4 mr-2" /> Upload Video Proof
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card">
                        <DialogHeader>
                          <DialogTitle>Submit Proof - {challenge.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-2">⚠️ Proof Requirements:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• Must be a VIDEO showing you completing the challenge</li>
                              <li>• Face must be visible for verification</li>
                              <li>• Video should clearly show the activity</li>
                              <li>• Maximum file size: 50MB</li>
                            </ul>
                          </div>
                          <div>
                            <Label>Upload Video Proof</Label>
                            <Input 
                              type="file" 
                              accept="video/*"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)} 
                              className="glass-card" 
                            />
                          </div>
                          {proofFile && (
                            <p className="text-xs text-green-500">✓ {proofFile.name} selected</p>
                          )}
                          <Button onClick={handleUploadProof} disabled={uploading || !proofFile} className="w-full">
                            {uploading ? 'Verifying...' : `Submit & Earn ${challenge.points} pts`}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  {isCompleted(challenge.id) && (
                    <Button className="w-full" variant="outline" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" /> Completed ✓
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          {/* Location Filter */}
          <div className="flex gap-2">
            <Button 
              variant={locationFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={locationFilter === 'regional' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('regional')}
              className="gap-1"
            >
              <MapPin className="w-3 h-3" /> Regional
            </Button>
            <Button 
              variant={locationFilter === 'global' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('global')}
              className="gap-1"
            >
              <Globe className="w-3 h-3" /> Global
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredDiscoverLocations.map((location, i) => (
              <Card key={i} className="glass-card hover-lift cursor-pointer group">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{location.image}</div>
                  <h4 className="font-semibold text-sm">{location.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />{location.location}
                  </p>
                  <Badge variant="outline" className="mt-2 text-[9px]">
                    {location.type === 'regional' ? '🏠 Regional' : '🌍 Global'}
                  </Badge>
                  <a 
                    href={location.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 block"
                  >
                    <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                      <Navigation className="w-3 h-3" /> View on Map
                    </Button>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="travel" className="space-y-6">
          {/* Location Filter */}
          <div className="flex gap-2">
            <Button 
              variant={locationFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('all')}
            >
              All
            </Button>
            <Button 
              variant={locationFilter === 'regional' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('regional')}
              className="gap-1"
            >
              <MapPin className="w-3 h-3" /> Regional
            </Button>
            <Button 
              variant={locationFilter === 'global' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setLocationFilter('global')}
              className="gap-1"
            >
              <Globe className="w-3 h-3" /> Global
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {filteredTravelDestinations.map((dest, i) => (
              <Card key={i} className="glass-card hover-lift overflow-hidden">
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-2">{dest.image}</div>
                  <h4 className="font-semibold text-sm">{dest.name}</h4>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="w-3 h-3" />{dest.location}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[9px]">
                      {dest.type === 'regional' ? '🏠 Regional' : '🌍 Global'}
                    </Badge>
                    <Badge variant="secondary" className="text-[9px]">{dest.country}</Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a 
                      href={dest.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button size="sm" className="w-full text-xs gap-1">
                        <ExternalLink className="w-3 h-3" /> Explore
                      </Button>
                    </a>
                    <Button size="icon" variant="outline" className="h-8 w-8">
                      <Heart className="w-3 h-3" />
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
