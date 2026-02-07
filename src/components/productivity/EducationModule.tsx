import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Globe, Lock, FileText, Video, Upload, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { EducationComments } from './EducationComments';
import { EducationDocCard, EducationVideoCard } from './EducationContentCard';

type Document = Database['public']['Tables']['documents']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };
type PostWithProfile = Post & { profiles?: Profile };

export function EducationModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'saved' | 'create'>('public');
  const [publicSubTab, setPublicSubTab] = useState<'docs' | 'videos'>('docs');
  const [search, setSearch] = useState('');
  
  const [publicDocs, setPublicDocs] = useState<DocumentWithProfile[]>([]);
  const [publicVideos, setPublicVideos] = useState<PostWithProfile[]>([]);
  const [privateDocs, setPrivateDocs] = useState<DocumentWithProfile[]>([]);
  const [privateVideos, setPrivateVideos] = useState<PostWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [uploadType, setUploadType] = useState<'document' | 'video'>('document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'public' | 'private'>('private');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string; type: 'document' | 'post' } | null>(null);

  const openComments = (id: string, title: string, type: 'document' | 'post') => {
    setSelectedItem({ id, title, type });
    setCommentsOpen(true);
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const { data: docs } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (docs) {
        const userIds = [...new Set(docs.map(d => d.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        const docsWithProfiles = docs.map(doc => ({ ...doc, profiles: profilesMap.get(doc.user_id) }));
        setPublicDocs(docsWithProfiles.filter(d => d.visibility === 'public'));
        setPrivateDocs(docsWithProfiles.filter(d => d.user_id === user.id));
      }

      const { data: posts } = await supabase.from('posts').select('*, profiles(*)').eq('category', 'education').order('created_at', { ascending: false });
      if (posts) {
        const videoPosts = posts.filter(p => {
          const types = p.media_types || [];
          return types.some((t: string) => t?.startsWith('video')) || (p.file_type && ['mp4', 'mov', 'webm'].includes(p.file_type.toLowerCase()));
        });
        setPublicVideos(videoPosts.filter(v => v.visibility === 'public'));
        setPrivateVideos(videoPosts.filter(v => v.user_id === user.id));

        // Load likes counts
        const postIds = videoPosts.map(v => v.id);
        if (postIds.length > 0) {
          const counts: Record<string, number> = {};
          videoPosts.forEach(v => { counts[v.id] = v.likes_count || 0; });
          setLikeCounts(counts);
          
          const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
          setLikedPostIds(new Set(userLikes?.map(l => l.post_id) || []));
        }
      }

      // Load comment counts for docs
      if (docs && docs.length > 0) {
        const docIds = docs.map(d => d.id);
        const { data: docComments } = await supabase.from('comments').select('document_id').in('document_id', docIds);
        const dCounts: Record<string, number> = {};
        docComments?.forEach(c => { if (c.document_id) dCounts[c.document_id] = (dCounts[c.document_id] || 0) + 1; });
        setCommentCounts(prev => ({ ...prev, ...dCounts }));
      }

      const { data: savedDocs } = await supabase.from('saved').select('post_id').eq('user_id', user.id);
      setSavedPostIds(new Set(savedDocs?.map(s => s.post_id) || []));

      const localSavedDocs = localStorage.getItem('lumatha_saved_docs');
      if (localSavedDocs) setSavedDocIds(new Set(JSON.parse(localSavedDocs)));
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveDoc = (docId: string) => {
    const newSaved = new Set(savedDocIds);
    if (newSaved.has(docId)) { newSaved.delete(docId); toast.success('Removed from saved'); } 
    else { newSaved.add(docId); toast.success('Saved!'); }
    setSavedDocIds(newSaved);
    localStorage.setItem('lumatha_saved_docs', JSON.stringify([...newSaved]));
  };

  const toggleSavePost = async (postId: string) => {
    if (!user) return;
    if (savedPostIds.has(postId)) {
      await supabase.from('saved').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
      toast.success('Removed from saved');
    } else {
      await supabase.from('saved').insert({ user_id: user.id, post_id: postId });
      setSavedPostIds(prev => new Set([...prev, postId]));
      toast.success('Saved!');
    }
  };

  const toggleLikePost = async (postId: string) => {
    if (!user) return;
    if (likedPostIds.has(postId)) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
      setLikedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 1) - 1) }));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
      setLikedPostIds(prev => new Set([...prev, postId]));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const openDocument = (fileUrl: string, fileType?: string) => {
    const ext = fileType?.toLowerCase() || '';
    const encodedUrl = encodeURIComponent(fileUrl);
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, '_blank');
    } else { window.open(fileUrl, '_blank'); }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) { toast.error('File and title required'); return; }
    if (!user) { toast.error('Please login'); return; }
    setUploading(true); setUploadProgress(0);
    try {
      const fileExt = uploadFile.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${user.id}/${Date.now()}_${uploadFile.name}`;
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(fileExt);
      const progressInterval = setInterval(() => { setUploadProgress(prev => Math.min(prev + 10, 90)); }, 200);

      if (isVideo) {
        const { error } = await supabase.storage.from('posts-media').upload(fileName, uploadFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
        await supabase.from('posts').insert({
          user_id: user.id, title: uploadTitle, content: uploadDescription || null,
          media_urls: [publicUrl], media_types: [uploadFile.type || 'video/mp4'],
          category: 'education', subcategory: 'education_video', visibility: uploadVisibility
        });
      } else {
        const { error } = await supabase.storage.from('documents').upload(fileName, uploadFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        await supabase.from('documents').insert({
          user_id: user.id, title: uploadTitle, description: uploadDescription || null,
          file_url: publicUrl, file_name: uploadFile.name, file_type: fileExt, visibility: uploadVisibility
        });
      }
      clearInterval(progressInterval); setUploadProgress(100);
      toast.success('Uploaded successfully!');
      setTimeout(() => { setUploadFile(null); setUploadTitle(''); setUploadDescription(''); setUploadVisibility('private'); setUploadProgress(0); loadData(); }, 500);
    } catch (error: any) { toast.error(error?.message || 'Upload failed'); setUploadProgress(0); }
    finally { setUploading(false); }
  };

  const deleteDoc = async (docId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Deleted'); loadData();
    } catch { toast.error('Delete failed'); }
  };

  const deleteVideo = async (postId: string) => {
    try {
      await supabase.from('posts').delete().eq('id', postId);
      toast.success('Deleted'); loadData();
    } catch { toast.error('Delete failed'); }
  };

  const filteredPublicDocs = publicDocs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.profiles?.name || '').toLowerCase().includes(search.toLowerCase()));
  const filteredPublicVideos = publicVideos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()) || (v.profiles?.name || '').toLowerCase().includes(search.toLowerCase()));
  const savedDocs = [...publicDocs, ...privateDocs].filter(d => savedDocIds.has(d.id));
  const savedVideos = [...publicVideos, ...privateVideos].filter(v => savedPostIds.has(v.id));

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="public"><Globe className="w-4 h-4 mr-1.5" />Public</TabsTrigger>
          <TabsTrigger value="private"><Lock className="w-4 h-4 mr-1.5" />Private</TabsTrigger>
          <TabsTrigger value="saved"><FileText className="w-4 h-4 mr-1.5" />Saved</TabsTrigger>
          <TabsTrigger value="create"><Upload className="w-4 h-4 mr-1.5" />Create</TabsTrigger>
        </TabsList>

        {/* Public */}
        <TabsContent value="public" className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by title or username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Button variant={publicSubTab === 'docs' ? 'default' : 'outline'} size="sm" onClick={() => setPublicSubTab('docs')}>
              <FileText className="w-4 h-4 mr-1" />Docs
            </Button>
            <Button variant={publicSubTab === 'videos' ? 'default' : 'outline'} size="sm" onClick={() => setPublicSubTab('videos')}>
              <Video className="w-4 h-4 mr-1" />Videos
            </Button>
          </div>

          {publicSubTab === 'docs' ? (
            <div className="space-y-3">
              {filteredPublicDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No public documents</p></div>
              ) : filteredPublicDocs.map(doc => (
                <EducationDocCard
                  key={doc.id} doc={doc}
                  isOwner={doc.user_id === user?.id}
                  isSaved={savedDocIds.has(doc.id)}
                  onToggleSave={() => toggleSaveDoc(doc.id)}
                  onDelete={() => deleteDoc(doc.id, doc.file_url)}
                  onOpenComments={() => openComments(doc.id, doc.title, 'document')}
                  onOpen={() => openDocument(doc.file_url, doc.file_type || '')}
                  commentsCount={commentCounts[doc.id] || 0}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPublicVideos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground"><Video className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>No public videos</p></div>
              ) : filteredPublicVideos.map(video => (
                <EducationVideoCard
                  key={video.id} video={video}
                  isOwner={video.user_id === user?.id}
                  isSaved={savedPostIds.has(video.id)}
                  onToggleSave={() => toggleSavePost(video.id)}
                  onDelete={() => deleteVideo(video.id)}
                  onOpenComments={() => openComments(video.id, video.title, 'post')}
                  likesCount={likeCounts[video.id] || 0}
                  isLiked={likedPostIds.has(video.id)}
                  onToggleLike={() => toggleLikePost(video.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Private */}
        <TabsContent value="private" className="mt-4 space-y-4">
          <h3 className="font-medium">Your Documents</h3>
          {privateDocs.length === 0 ? <p className="text-sm text-muted-foreground">No private documents</p> : (
            <div className="space-y-3">
              {privateDocs.map(doc => (
                <EducationDocCard
                  key={doc.id} doc={doc} isOwner={true}
                  isSaved={savedDocIds.has(doc.id)} onToggleSave={() => toggleSaveDoc(doc.id)}
                  onDelete={() => deleteDoc(doc.id, doc.file_url)}
                  onOpenComments={() => openComments(doc.id, doc.title, 'document')}
                  onOpen={() => openDocument(doc.file_url, doc.file_type || '')}
                  commentsCount={commentCounts[doc.id] || 0}
                />
              ))}
            </div>
          )}
          <h3 className="font-medium mt-6">Your Videos</h3>
          {privateVideos.length === 0 ? <p className="text-sm text-muted-foreground">No private videos</p> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {privateVideos.map(video => (
                <EducationVideoCard
                  key={video.id} video={video} isOwner={true}
                  isSaved={savedPostIds.has(video.id)} onToggleSave={() => toggleSavePost(video.id)}
                  onDelete={() => deleteVideo(video.id)}
                  onOpenComments={() => openComments(video.id, video.title, 'post')}
                  likesCount={likeCounts[video.id] || 0}
                  isLiked={likedPostIds.has(video.id)}
                  onToggleLike={() => toggleLikePost(video.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved */}
        <TabsContent value="saved" className="mt-4 space-y-4">
          <h3 className="font-medium">Saved Documents</h3>
          {savedDocs.length === 0 ? <p className="text-sm text-muted-foreground">No saved documents</p> : (
            <div className="space-y-3">
              {savedDocs.map(doc => (
                <EducationDocCard
                  key={doc.id} doc={doc} isOwner={doc.user_id === user?.id}
                  isSaved={true} onToggleSave={() => toggleSaveDoc(doc.id)}
                  onDelete={() => deleteDoc(doc.id, doc.file_url)}
                  onOpenComments={() => openComments(doc.id, doc.title, 'document')}
                  onOpen={() => openDocument(doc.file_url, doc.file_type || '')}
                />
              ))}
            </div>
          )}
          <h3 className="font-medium mt-6">Saved Videos</h3>
          {savedVideos.length === 0 ? <p className="text-sm text-muted-foreground">No saved videos</p> : (
            <div className="grid gap-4 sm:grid-cols-2">
              {savedVideos.map(video => (
                <EducationVideoCard
                  key={video.id} video={video} isOwner={video.user_id === user?.id}
                  isSaved={true} onToggleSave={() => toggleSavePost(video.id)}
                  onOpenComments={() => openComments(video.id, video.title, 'post')}
                  likesCount={likeCounts[video.id] || 0}
                  isLiked={likedPostIds.has(video.id)}
                  onToggleLike={() => toggleLikePost(video.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create */}
        <TabsContent value="create" className="mt-4 space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant={uploadType === 'document' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('document')}>
              <FileText className="w-4 h-4 mr-1" />Document
            </Button>
            <Button variant={uploadType === 'video' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('video')}>
              <Video className="w-4 h-4 mr-1" />Video
            </Button>
          </div>
          <div className="space-y-4">
            <div><Label className="text-sm mb-2 block">Title *</Label><Input placeholder="Enter title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} /></div>
            <div><Label className="text-sm mb-2 block">Description</Label><Textarea placeholder="Add description..." value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label className="text-sm mb-2 block">File *</Label>
              <Input type="file" accept={uploadType === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx' : 'video/*'} onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
              {uploadFile && <p className="text-xs text-muted-foreground mt-1">{uploadFile.name}</p>}
            </div>
            <div>
              <Label className="text-sm mb-2 block">Visibility</Label>
              <RadioGroup value={uploadVisibility} onValueChange={(v) => setUploadVisibility(v as any)} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="private" id="private" /><Label htmlFor="private" className="flex items-center gap-1 cursor-pointer"><Lock className="w-3.5 h-3.5" />Private</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="public" id="public" /><Label htmlFor="public" className="flex items-center gap-1 cursor-pointer"><Globe className="w-3.5 h-3.5" />Public</Label></div>
              </RadioGroup>
            </div>
            {uploading && uploadProgress > 0 && (
              <div className="space-y-2"><Progress value={uploadProgress} className="h-2" /><p className="text-xs text-center text-muted-foreground">{uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Complete!'}</p></div>
            )}
            <Button className="w-full gap-2" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload</>}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <EducationComments open={commentsOpen} onOpenChange={setCommentsOpen} documentId={selectedItem?.type === 'document' ? selectedItem.id : undefined} postId={selectedItem?.type === 'post' ? selectedItem.id : undefined} title={selectedItem?.title || ''} />
    </div>
  );
}
