import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music as MusicIcon, Play, Pause, Upload, Plus, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Music() {
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  useEffect(() => {
    if (selectedPlaylist) {
      fetchTracks(selectedPlaylist);
    }
  }, [selectedPlaylist]);

  const fetchPlaylists = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
      if (data && data.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchTracks = async (playlistId: string) => {
    try {
      const { data, error } = await supabase
        .from('playlist_tracks')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error('Error fetching tracks:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return toast.error('Enter playlist name');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: newPlaylistName
        })
        .select()
        .single();

      if (error) throw error;

      setPlaylists([data, ...playlists]);
      setSelectedPlaylist(data.id);
      setNewPlaylistName('');
      setPlaylistDialogOpen(false);
      toast.success('Playlist created!');
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  const handleUploadTrack = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadArtist.trim() || !selectedPlaylist) {
      return toast.error('Fill all fields');
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('music')
        .upload(fileName, uploadFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('music')
        .getPublicUrl(fileName);

      // Create track record
      const { data, error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: selectedPlaylist,
          title: uploadTitle,
          artist: uploadArtist,
          file_url: publicUrl
        })
        .select()
        .single();

      if (error) throw error;

      setTracks([data, ...tracks]);
      setUploadFile(null);
      setUploadTitle('');
      setUploadArtist('');
      setUploadDialogOpen(false);
      toast.success('Track added successfully!');
    } catch (error: any) {
      console.error('Error uploading track:', error);
      toast.error('Failed to upload track');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track: any) => {
    if (!track.file_url) {
      toast.error('No audio file available');
      return;
    }
    
    if (currentTrack?.id === track.id && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack?.id !== track.id) {
        audio.src = track.file_url;
        setCurrentTrack(track);
      }
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play audio. The file may not be accessible.');
      });
      setIsPlaying(true);
    }
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-black">🎵 Music</h1>
      <Card className="glass-card border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2"><List className="w-6 h-6 text-primary" />Playlists</CardTitle>
            <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />New Playlist</Button></DialogTrigger>
              <DialogContent className="glass-card border-border">
                <DialogHeader><DialogTitle>Create Playlist</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} className="glass-card border-border" /></div>
                  <Button onClick={handleCreatePlaylist} className="w-full">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {playlists.length === 0 ? <p className="text-center text-muted-foreground py-8">No playlists. Create one!</p> :
            <div className="flex flex-wrap gap-2">{playlists.map((p) => <Button key={p.id} variant={selectedPlaylist === p.id ? 'default' : 'outline'} onClick={() => setSelectedPlaylist(p.id)} className="rounded-full text-xs md:text-sm">{p.name}</Button>)}</div>}
        </CardContent>
      </Card>
      {selectedPlaylist && (
        <Card className="glass-card border-border">
          <CardHeader>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl"><MusicIcon className="w-5 h-5 md:w-6 md:h-6 text-primary" />{playlists.find(p => p.id === selectedPlaylist)?.name}</CardTitle>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild><Button size="sm" className="text-xs md:text-sm"><Upload className="w-3 h-3 md:w-4 md:h-4 mr-2" />Upload</Button></DialogTrigger>
                <DialogContent className="glass-card border-border">
                  <DialogHeader><DialogTitle>Upload Track</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Audio File</Label><Input type="file" accept="audio/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="glass-card border-border" /></div>
                    <div><Label>Title</Label><Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="glass-card border-border" /></div>
                    <div><Label>Artist</Label><Input value={uploadArtist} onChange={(e) => setUploadArtist(e.target.value)} className="glass-card border-border" /></div>
                    <Button onClick={handleUploadTrack} disabled={loading} className="w-full">{loading ? 'Uploading...' : 'Add Track'}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {tracks.length === 0 ? <p className="text-center text-muted-foreground py-8">No tracks. Upload music!</p> :
              <div className="space-y-4">{tracks.map((track) => (
                <div key={track.id} className="p-3 md:p-4 rounded-lg glass-card border hover-lift flex justify-between items-center">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0" onClick={() => handlePlayTrack(track)}>
                      {currentTrack?.id === track.id && isPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5" />}
                    </Button>
                    <div className="min-w-0 flex-1"><h3 className="font-semibold text-sm md:text-base truncate">{track.title}</h3><p className="text-xs md:text-sm text-muted-foreground truncate">{track.artist}</p></div>
                  </div>
                </div>
              ))}</div>}
            {currentTrack && (
              <div className="p-4 md:p-6 rounded-lg glass-card border">
                <div className="space-y-4">
                  <div className="text-center"><h3 className="font-semibold text-sm md:text-base">{currentTrack.title}</h3><p className="text-xs md:text-sm text-muted-foreground">{currentTrack.artist}</p></div>
                  <div className="flex justify-center gap-3 md:gap-4">
                    <Button size="icon" className="rounded-full w-12 h-12 md:w-14 md:h-14 btn-cosmic" onClick={() => handlePlayTrack(currentTrack)}>{isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" /> : <Play className="w-5 h-5 md:w-6 md:h-6" />}</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
