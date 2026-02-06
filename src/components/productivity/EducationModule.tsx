import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Globe, Lock, FileText, Video, Upload, Search, Bookmark, BookmarkCheck, Heart, MessageCircle, ExternalLink, Trash2, Play, File, Download, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { EducationComments } from './EducationComments';

type Document = Database['public']['Tables']['documents']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

type DocumentWithProfile = Document & { profiles?: Profile };
type PostWithProfile = Post & { profiles?: Profile };

export function EducationModule() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'public' | 'private' | 'saved' | 'create'>('public');
  const [publicSubTab, setPublicSubTab] = useState<'docs' | 'videos'>('docs');
  const [search, setSearch] = useState('');
  
  // Data
  const [publicDocs, setPublicDocs] = useState<DocumentWithProfile[]>([]);
  const [publicVideos, setPublicVideos] = useState<PostWithProfile[]>([]);
  const [privateDocs, setPrivateDocs] = useState<DocumentWithProfile[]>([]);
  const [privateVideos, setPrivateVideos] = useState<PostWithProfile[]>([]);
  const [savedDocIds, setSavedDocIds] = useState<Set<string>>(new Set());
  const [savedPostIds, setSavedPostIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Create form
  const [uploadType, setUploadType] = useState<'document' | 'video'>('document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<'public' | 'private'>('private');
  const [uploading, setUploading] = useState(false);
  
  // Comments dialog state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string; type: 'document' | 'post' } | null>(null);

  const openComments = (id: string, title: string, type: 'document' | 'post') => {
    setSelectedItem({ id, title, type });
    setCommentsOpen(true);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      // Load documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docs) {
        const userIds = [...new Set(docs.map(d => d.user_id))];
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
        
        const docsWithProfiles = docs.map(doc => ({ ...doc, profiles: profilesMap.get(doc.user_id) }));
        setPublicDocs(docsWithProfiles.filter(d => d.visibility === 'public'));
        setPrivateDocs(docsWithProfiles.filter(d => d.user_id === user.id));
      }

      // Load video posts - ONLY education videos (not from Home feed)
      const { data: posts } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('category', 'education')
        .order('created_at', { ascending: false });

      if (posts) {
        const videoPosts = posts.filter(p => {
          const types = p.media_types || [];
          return types.some((t: string) => t?.startsWith('video')) ||
                 (p.file_type && ['mp4', 'mov', 'webm'].includes(p.file_type.toLowerCase()));
        });
        setPublicVideos(videoPosts.filter(v => v.visibility === 'public'));
        setPrivateVideos(videoPosts.filter(v => v.user_id === user.id));
      }

      // Load saved
      const { data: savedDocs } = await supabase
        .from('saved')
        .select('post_id')
        .eq('user_id', user.id);
      setSavedPostIds(new Set(savedDocs?.map(s => s.post_id) || []));

      const localSavedDocs = localStorage.getItem('lumatha_saved_docs');
      if (localSavedDocs) setSavedDocIds(new Set(JSON.parse(localSavedDocs)));

    } finally {
      setLoading(false);
    }
  };

  const toggleSaveDoc = (docId: string) => {
    const newSaved = new Set(savedDocIds);
    if (newSaved.has(docId)) {
      newSaved.delete(docId);
      toast.success('Removed from saved');
    } else {
      newSaved.add(docId);
      toast.success('Saved!');
    }
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

  const openDocument = (fileUrl: string, fileType?: string) => {
    const ext = fileType?.toLowerCase() || '';
    const encodedUrl = encodeURIComponent(fileUrl);
    
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`, '_blank');
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      toast.error('File and title required');
      return;
    }
    if (!user) {
      toast.error('Please login');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const fileExt = uploadFile.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${user.id}/${Date.now()}_${uploadFile.name}`;
      const isVideo = ['mp4', 'mov', 'webm', 'avi'].includes(fileExt);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      if (isVideo) {
        const { error } = await supabase.storage.from('posts-media').upload(fileName, uploadFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
        
        await supabase.from('posts').insert({
          user_id: user.id,
          title: uploadTitle,
          content: uploadDescription || null,
          media_urls: [publicUrl],
          media_types: [uploadFile.type || 'video/mp4'],
          category: 'education',
          subcategory: 'education_video',
          visibility: uploadVisibility
        });
      } else {
        const { error } = await supabase.storage.from('documents').upload(fileName, uploadFile);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
        
        await supabase.from('documents').insert({
          user_id: user.id,
          title: uploadTitle,
          description: uploadDescription || null,
          file_url: publicUrl,
          file_name: uploadFile.name,
          file_type: fileExt,
          visibility: uploadVisibility
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast.success('Uploaded successfully!');
      setTimeout(() => {
        setUploadFile(null);
        setUploadTitle('');
        setUploadDescription('');
        setUploadVisibility('private');
        setUploadProgress(0);
        loadData();
      }, 500);
    } catch (error: any) {
      toast.error(error?.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (docId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      toast.success('Deleted');
      loadData();
    } catch {
      toast.error('Delete failed');
    }
  };

  const getFileIcon = (fileType?: string) => {
    const ext = fileType?.toLowerCase() || '';
    if (ext === 'pdf') return <span className="text-red-400">PDF</span>;
    if (['doc', 'docx'].includes(ext)) return <span className="text-blue-400">DOC</span>;
    if (['ppt', 'pptx'].includes(ext)) return <span className="text-orange-400">PPT</span>;
    if (['xls', 'xlsx'].includes(ext)) return <span className="text-green-400">XLS</span>;
    return <File className="w-4 h-4" />;
  };

  const filteredPublicDocs = publicDocs.filter(d => 
    !search || d.title.toLowerCase().includes(search.toLowerCase())
  );
  const filteredPublicVideos = publicVideos.filter(v => 
    !search || v.title.toLowerCase().includes(search.toLowerCase())
  );

  const savedDocs = [...publicDocs, ...privateDocs].filter(d => savedDocIds.has(d.id));
  const savedVideos = [...publicVideos, ...privateVideos].filter(v => savedPostIds.has(v.id));

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="public">
            <Globe className="w-4 h-4 mr-1.5" />
            Public
          </TabsTrigger>
          <TabsTrigger value="private">
            <Lock className="w-4 h-4 mr-1.5" />
            Private
          </TabsTrigger>
          <TabsTrigger value="saved">
            <Bookmark className="w-4 h-4 mr-1.5" />
            Saved
          </TabsTrigger>
          <TabsTrigger value="create">
            <Upload className="w-4 h-4 mr-1.5" />
            Create
          </TabsTrigger>
        </TabsList>

        {/* Public Tab */}
        <TabsContent value="public" className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sub-tabs for Docs/Videos */}
          <div className="flex gap-2">
            <Button
              variant={publicSubTab === 'docs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPublicSubTab('docs')}
            >
              <FileText className="w-4 h-4 mr-1" />
              Docs
            </Button>
            <Button
              variant={publicSubTab === 'videos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPublicSubTab('videos')}
            >
              <Video className="w-4 h-4 mr-1" />
              Videos
            </Button>
          </div>

          {publicSubTab === 'docs' ? (
            <div className="space-y-3">
              {filteredPublicDocs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No public documents</p>
                </div>
              ) : (
                filteredPublicDocs.map(doc => (
                  <Card key={doc.id} className="group hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold">
                          {getFileIcon(doc.file_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{doc.title}</h3>
                          {doc.profiles && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Avatar className="w-4 h-4">
                                <AvatarImage src={doc.profiles.avatar_url || ''} />
                                <AvatarFallback className="text-[8px]">{doc.profiles.name?.[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{doc.profiles.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleSaveDoc(doc.id)}
                          >
                            {savedDocIds.has(doc.id) ? (
                              <BookmarkCheck className="w-4 h-4 text-primary" />
                            ) : (
                              <Bookmark className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openDocument(doc.file_url, doc.file_type || '')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredPublicVideos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No public videos</p>
                </div>
              ) : (
                filteredPublicVideos.map(video => (
                  <Card key={video.id} className="overflow-hidden group">
                    <div className="aspect-video bg-black relative">
                      {video.media_urls?.[0] && (
                        <video 
                          src={video.media_urls[0]} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h3 className="font-medium text-sm truncate">{video.title}</h3>
                      <div className="flex items-center justify-between mt-2">
                        {video.profiles && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={video.profiles.avatar_url || ''} />
                              <AvatarFallback className="text-[8px]">{video.profiles.name?.[0]}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{video.profiles.name}</span>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSavePost(video.id)}
                        >
                          {savedPostIds.has(video.id) ? (
                            <BookmarkCheck className="w-4 h-4 text-primary" />
                          ) : (
                            <Bookmark className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Private Tab */}
        <TabsContent value="private" className="mt-4 space-y-4">
          <h3 className="font-medium">Your Documents</h3>
          {privateDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No private documents</p>
          ) : (
            <div className="space-y-2">
              {privateDocs.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <span className="text-sm font-medium">{doc.title}</span>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        doc.visibility === 'public' ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                      )}>
                        {doc.visibility}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openDocument(doc.file_url, doc.file_type || '')}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteDoc(doc.id, doc.file_url)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <h3 className="font-medium mt-6">Your Videos</h3>
          {privateVideos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No private videos</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {privateVideos.map(video => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-black">
                    {video.media_urls?.[0] && (
                      <video src={video.media_urls[0]} className="w-full h-full object-cover" muted />
                    )}
                  </div>
                  <CardContent className="p-2">
                    <span className="text-sm">{video.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Saved Tab */}
        <TabsContent value="saved" className="mt-4 space-y-4">
          <h3 className="font-medium">Saved Documents</h3>
          {savedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved documents</p>
          ) : (
            <div className="space-y-2">
              {savedDocs.map(doc => (
                <Card key={doc.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold">
                        {getFileIcon(doc.file_type)}
                      </div>
                      <span className="text-sm">{doc.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openDocument(doc.file_url, doc.file_type || '')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <h3 className="font-medium mt-6">Saved Videos</h3>
          {savedVideos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved videos</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {savedVideos.map(video => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-black relative">
                    {video.media_urls?.[0] && (
                      <video src={video.media_urls[0]} className="w-full h-full object-cover" muted />
                    )}
                    <Play className="absolute inset-0 m-auto w-8 h-8 text-white" />
                  </div>
                  <CardContent className="p-2">
                    <span className="text-sm">{video.title}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Create Tab */}
        <TabsContent value="create" className="mt-4 space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={uploadType === 'document' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadType('document')}
            >
              <FileText className="w-4 h-4 mr-1" />
              Document
            </Button>
            <Button
              variant={uploadType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUploadType('video')}
            >
              <Video className="w-4 h-4 mr-1" />
              Video
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm mb-2 block">Title *</Label>
              <Input
                placeholder="Enter title"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">Description</Label>
              <Textarea
                placeholder="Add description..."
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm mb-2 block">File *</Label>
              <Input
                type="file"
                accept={uploadType === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx' : 'video/*'}
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground mt-1">{uploadFile.name}</p>
              )}
            </div>

            <div>
              <Label className="text-sm mb-2 block">Visibility</Label>
              <RadioGroup
                value={uploadVisibility}
                onValueChange={(v) => setUploadVisibility(v as 'public' | 'private')}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="flex items-center gap-1 cursor-pointer">
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="flex items-center gap-1 cursor-pointer">
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {uploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Complete!'}
                </p>
              </div>
            )}

            <Button 
              className="w-full gap-2" 
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadTitle.trim()}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comments Dialog */}
      <EducationComments
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        documentId={selectedItem?.type === 'document' ? selectedItem.id : undefined}
        postId={selectedItem?.type === 'post' ? selectedItem.id : undefined}
        title={selectedItem?.title || ''}
      />
    </div>
  );
}
