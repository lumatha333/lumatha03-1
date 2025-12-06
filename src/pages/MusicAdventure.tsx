import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Music, Play, Pause, Upload, Plus, List, Mountain, Trophy, MapPin, Compass, Map, Camera, Heart } from 'lucide-react';

export default function MusicAdventure() {
  const [activeTab, setActiveTab] = useState('music');
  
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
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [adventureLoading, setAdventureLoading] = useState(true);
  const [uploadChallengeDialog, setUploadChallengeDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    fetchPlaylists();
    fetchAdventureData();
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

  // Adventure Functions
  const fetchAdventureData = async () => {
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
    } catch (error) {
      toast.error('Failed to load challenges');
    } finally {
      setAdventureLoading(false);
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
      await supabase.storage.from('challenge-proofs').upload(fileName, proofFile);
      const { data: { publicUrl } } = supabase.storage.from('challenge-proofs').getPublicUrl(fileName);
      const newPoints = totalPoints + selectedChallenge.points;
      await Promise.all([
        supabase.from('challenge_submissions').insert({ user_id: user.id, challenge_id: selectedChallenge.id, proof_type: proofType, proof_url: publicUrl, status: 'approved' }),
        supabase.from('user_points').upsert({ user_id: user.id, total_points: newPoints })
      ]);
      toast.success(`+${selectedChallenge.points} points!`);
      setUploadChallengeDialog(false);
      setProofFile(null);
      setSelectedChallenge(null);
      fetchAdventureData();
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

  const isCompleted = (challengeId: string) => submissions.some(s => s.challenge_id === challengeId && s.status === 'approved');

  const moodPlaylists = [
    { name: '🎉 Party Vibes', color: 'from-pink-500 to-purple-500' },
    { name: '😌 Chill & Relax', color: 'from-blue-500 to-cyan-500' },
    { name: '💪 Workout Energy', color: 'from-orange-500 to-red-500' },
    { name: '🌙 Night Mood', color: 'from-indigo-500 to-purple-500' },
    { name: '☀️ Morning Fresh', color: 'from-yellow-400 to-orange-400' },
    { name: '❤️ Love Songs', color: 'from-rose-500 to-pink-500' },
  ];

  const travelDestinations = [
    { name: 'Rara Lake', location: 'Mugu', image: '🏔️' },
    { name: 'Pokhara', location: 'Kaski', image: '⛰️' },
    { name: 'Chitwan', location: 'National Park', image: '🦏' },
    { name: 'Lumbini', location: 'Rupandehi', image: '🙏' },
    { name: 'Everest Base Camp', location: 'Solukhumbu', image: '🗻' },
    { name: 'Bardiya', location: 'National Park', image: '🐅' },
  ];

  return (
    <div className="space-y-6">
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
          {adventureLoading ? (
            <div className="text-center py-12">Loading challenges...</div>
          ) : challenges.length === 0 ? (
            <Card className="glass-card"><CardContent className="py-12 text-center"><Mountain className="h-16 w-16 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No challenges available yet!</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className={`glass-card hover-lift ${isCompleted(challenge.id) ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{challenge.title}</CardTitle>
                      {isCompleted(challenge.id) && <Trophy className="h-5 w-5 text-yellow-500" />}
                    </div>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge className={getDifficultyColor(challenge.difficulty)}>{challenge.difficulty}</Badge>
                      <Badge variant="outline">{challenge.points} pts</Badge>
                      {challenge.location_required && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />Location</Badge>}
                    </div>
                    <Dialog open={uploadChallengeDialog && selectedChallenge?.id === challenge.id} onOpenChange={setUploadChallengeDialog}>
                      <DialogTrigger asChild>
                        <Button className="w-full" disabled={isCompleted(challenge.id)} onClick={() => setSelectedChallenge(challenge)}>
                          {isCompleted(challenge.id) ? 'Completed ✓' : 'Upload Proof'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass-card">
                        <DialogHeader><DialogTitle>Upload Proof - {challenge.title}</DialogTitle></DialogHeader>
                        <div className="space-y-4">
                          <div><Label>Upload Image/Video</Label><Input type="file" accept="image/*,video/*" onChange={(e) => setProofFile(e.target.files?.[0] || null)} className="glass-card" /></div>
                          <Button className="w-full" onClick={handleUploadProof} disabled={!proofFile || uploading}>
                            <Upload className="w-4 h-4 mr-2" />{uploading ? 'Uploading...' : 'Submit'}
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

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5 text-primary" />Local Artists</CardTitle>
                <CardDescription>Discover music from Dang, Urahari, Tulsipur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['🎸 Himalayan Vibes', '🎤 Nepali Beats', '🎹 Mountain Melodies'].map((artist, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg glass-card hover:bg-primary/5">
                    <span className="font-medium">{artist}</span>
                    <Button size="sm" variant="ghost"><Heart className="w-4 h-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />Adventure Stories</CardTitle>
                <CardDescription>Travel stories from the community</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['🏔️ Everest Journey', '🌊 Rara Lake Trip', '🦏 Chitwan Safari'].map((story, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg glass-card hover:bg-primary/5">
                    <span className="font-medium">{story}</span>
                    <Badge variant="outline">View</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="travel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {travelDestinations.map((dest, i) => (
              <Card key={i} className="glass-card hover-lift overflow-hidden">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{dest.image}</div>
                  <h3 className="font-bold text-lg">{dest.name}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{dest.location}</p>
                  <Button className="w-full mt-4" variant="outline">Explore</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}