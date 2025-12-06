import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mountain, Trophy, MapPin, Upload } from 'lucide-react';

export default function Adventure() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('adventure-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenge_submissions' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_points' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [challengesRes, submissionsRes, pointsRes] = await Promise.all([
        supabase.from('challenges').select('*').order('created_at', { ascending: false }),
        supabase.from('challenge_submissions').select('*, challenges(*)').eq('user_id', user.id),
        supabase.from('user_points').select('total_points').eq('user_id', user.id).maybeSingle()
      ]);

      if (challengesRes.error) throw challengesRes.error;
      if (submissionsRes.error) throw submissionsRes.error;

      setChallenges(challengesRes.data || []);
      setSubmissions(submissionsRes.data || []);
      setTotalPoints(pointsRes.data?.total_points || 0);
    } catch (error: any) {
      toast.error('Failed to load challenges');
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

      // Fast parallel upload - supports any file size
      const { error: uploadError } = await supabase.storage
        .from('challenge-proofs')
        .upload(fileName, proofFile, {
          cacheControl: '31536000', // 1 year cache
          upsert: false,
          contentType: proofFile.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-proofs')
        .getPublicUrl(fileName);

      // Parallel database operations for faster processing
      const newPoints = totalPoints + selectedChallenge.points;
      
      await Promise.all([
        supabase.from('challenge_submissions').insert({
          user_id: user.id,
          challenge_id: selectedChallenge.id,
          proof_type: proofType,
          proof_url: publicUrl,
          status: 'approved'
        }),
        supabase.from('user_points').upsert({
          user_id: user.id,
          total_points: newPoints
        })
      ]);

      toast.success(`+${selectedChallenge.points} points! Challenge completed!`);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const isCompleted = (challengeId: string) => {
    return submissions.some(s => s.challenge_id === challengeId && s.status === 'approved');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black flex items-center gap-2">
          🧗 Adventure Challenges
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span className="font-bold text-xl">{totalPoints} pts</span>
          </div>
          <div className="text-muted-foreground">
            {submissions.filter(s => s.status === 'approved').length} Completed
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading challenges...</div>
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mountain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No challenges available yet. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Card key={challenge.id} className={`hover:shadow-lg transition-shadow ${isCompleted(challenge.id) ? 'border-green-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  {isCompleted(challenge.id) && (
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                <CardDescription>{challenge.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    {challenge.points} pts
                  </Badge>
                  {challenge.location_required && (
                    <Badge variant="outline">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location
                    </Badge>
                  )}
                </div>
                <Dialog open={uploadDialog && selectedChallenge?.id === challenge.id} onOpenChange={setUploadDialog}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={isCompleted(challenge.id)}
                      onClick={() => setSelectedChallenge(challenge)}
                    >
                      {isCompleted(challenge.id) ? 'Completed ✓' : 'Upload Proof'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Upload Proof - {challenge.title}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Upload Image/Video Proof (Any Size)</Label>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                          className="glass-card"
                        />
                        {proofFile && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {proofFile.name} ({(proofFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleUploadProof}
                        disabled={!proofFile || uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Submit Proof'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
