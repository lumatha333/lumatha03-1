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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Globe, Lock, FileText, Video, Upload, Search, Loader2, FolderPlus, Folder, ArrowLeft, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';
import { EducationComments } from './EducationComments';
import { EducationDocCard, EducationVideoCard } from './EducationContentCard';
import { EmptyDocuments, EmptyVideos, EmptySaved } from '@/components/EmptyStates';

type Document = Database['public']['Tables']['documents']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type DocumentWithProfile = Document & { profiles?: Profile };
type PostWithProfile = Post & { profiles?: Profile };

interface DocFolder {
  id: string;
  name: string;
  docIds: string[];
}

const FOLDERS_KEY = 'lumatha_edu_folders';

export function EducationModule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'explore' | 'my_content' | 'saved' | 'create'>('explore');
  const [contentSubTab, setContentSubTab] = useState<'docs' | 'videos'>('docs');
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

  // Folders state
  const [folders, setFolders] = useState<DocFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [moveToFolderDocId, setMoveToFolderDocId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(FOLDERS_KEY);
    if (saved) setFolders(JSON.parse(saved));
  }, []);

  const saveFolders = (f: DocFolder[]) => {
    setFolders(f);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(f));
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;
    saveFolders([...folders, { id: Date.now().toString(), name: newFolderName.trim(), docIds: [] }]);
    setNewFolderName('');
    setShowNewFolder(false);
  };

  const deleteFolder = (folderId: string) => {
    saveFolders(folders.filter(f => f.id !== folderId));
    if (selectedFolder === folderId) setSelectedFolder(null);
  };

  const moveDocToFolder = (folderId: string) => {
    if (!moveToFolderDocId) return;
    const updated = folders.map(f => {
      const cleaned = { ...f, docIds: f.docIds.filter(id => id !== moveToFolderDocId) };
      if (f.id === folderId) cleaned.docIds.push(moveToFolderDocId);
      return cleaned;
    });
    saveFolders(updated);
    setMoveToFolderDocId(null);
  };

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
        const postIds = videoPosts.map(v => v.id);
        if (postIds.length > 0) {
          const counts: Record<string, number> = {};
          videoPosts.forEach(v => { counts[v.id] = v.likes_count || 0; });
          setLikeCounts(counts);
          const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
          setLikedPostIds(new Set(userLikes?.map(l => l.post_id) || []));
        }
      }

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
    } finally { setLoading(false); }
  };

  const toggleSaveDoc = (docId: string) => {
    const newSaved = new Set(savedDocIds);
    if (newSaved.has(docId)) newSaved.delete(docId);
    else newSaved.add(docId);
    setSavedDocIds(newSaved);
    localStorage.setItem('lumatha_saved_docs', JSON.stringify([...newSaved]));
  };

  const toggleSavePost = async (postId: string) => {
    if (!user) return;
    if (savedPostIds.has(postId)) {
      await supabase.from('saved').delete().eq('user_id', user.id).eq('post_id', postId);
      setSavedPostIds(prev => { const next = new Set(prev); next.delete(postId); return next; });
    } else {
      await supabase.from('saved').insert({ user_id: user.id, post_id: postId });
      setSavedPostIds(prev => new Set([...prev, postId]));
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
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      window.open(`https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`, '_blank');
    } else window.open(fileUrl, '_blank');
  };

  const editDocument = async (docId: string, title: string, description: string) => {
    const { error } = await supabase.from('documents').update({ title, description }).eq('id', docId);
    if (error) { toast.error('Failed to update'); return; }
    loadData();
  };

  const editVideo = async (postId: string, title: string, content: string) => {
    const { error } = await supabase.from('posts').update({ title, content }).eq('id', postId);
    if (error) { toast.error('Failed to update'); return; }
    loadData();
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) { toast.error('File and title required'); return; }
    if (!user) return;
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
      toast.success('Uploaded!');
      setTimeout(() => { setUploadFile(null); setUploadTitle(''); setUploadDescription(''); setUploadVisibility('private'); setUploadProgress(0); loadData(); }, 500);
    } catch (error: any) { toast.error(error?.message || 'Upload failed'); setUploadProgress(0); }
    finally { setUploading(false); }
  };

  const deleteDoc = async (docId: string, fileUrl: string) => {
    try {
      const filePath = fileUrl.split('/documents/')[1];
      if (filePath) await supabase.storage.from('documents').remove([filePath]);
      await supabase.from('documents').delete().eq('id', docId);
      // Remove from folders
      saveFolders(folders.map(f => ({ ...f, docIds: f.docIds.filter(id => id !== docId) })));
      loadData();
    } catch { toast.error('Delete failed'); }
  };

  const deleteVideo = async (postId: string) => {
    try { await supabase.from('posts').delete().eq('id', postId); loadData(); }
    catch { toast.error('Delete failed'); }
  };

  const filteredPublicDocs = publicDocs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.profiles?.name || '').toLowerCase().includes(search.toLowerCase()));
  const filteredPublicVideos = publicVideos.filter(v => !search || v.title.toLowerCase().includes(search.toLowerCase()) || (v.profiles?.name || '').toLowerCase().includes(search.toLowerCase()));
  const savedDocs = [...publicDocs, ...privateDocs].filter(d => savedDocIds.has(d.id));
  const savedVideos = [...publicVideos, ...privateVideos].filter(v => savedPostIds.has(v.id));

  const currentFolder = folders.find(f => f.id === selectedFolder);
  const folderDocs = currentFolder ? privateDocs.filter(d => currentFolder.docIds.includes(d.id)) : [];

  const renderDocCard = (doc: DocumentWithProfile, isOwner: boolean) => (
    <EducationDocCard
      key={doc.id} doc={doc} isOwner={isOwner}
      isSaved={savedDocIds.has(doc.id)} onToggleSave={() => toggleSaveDoc(doc.id)}
      onDelete={() => deleteDoc(doc.id, doc.file_url)}
      onOpenComments={() => openComments(doc.id, doc.title, 'document')}
      onOpen={() => openDocument(doc.file_url, doc.file_type || '')}
      onEdit={isOwner ? editDocument : undefined}
      onMoveToFolder={isOwner ? (docId) => setMoveToFolderDocId(docId) : undefined}
      commentsCount={commentCounts[doc.id] || 0}
    />
  );

  const renderVideoCard = (video: PostWithProfile, isOwner: boolean) => (
    <EducationVideoCard
      key={video.id} video={video} isOwner={isOwner}
      isSaved={savedPostIds.has(video.id)} onToggleSave={() => toggleSavePost(video.id)}
      onDelete={() => deleteVideo(video.id)}
      onOpenComments={() => openComments(video.id, video.title, 'post')}
      onEdit={isOwner ? editVideo : undefined}
      likesCount={likeCounts[video.id] || 0}
      isLiked={likedPostIds.has(video.id)}
      onToggleLike={() => toggleLikePost(video.id)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Tab pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'explore', label: 'Explore', icon: <Globe className="w-3.5 h-3.5" /> },
          { id: 'my_content', label: 'My Content', icon: <Lock className="w-3.5 h-3.5" /> },
          { id: 'saved', label: 'Saved', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'create', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
              activeTab === tab.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab !== 'create' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}

      {/* Content type toggle */}
      {(activeTab === 'explore' || activeTab === 'my_content') && (
        <div className="flex gap-2">
          <Button variant={contentSubTab === 'docs' ? 'default' : 'outline'} size="sm" onClick={() => setContentSubTab('docs')}><FileText className="w-4 h-4 mr-1" />Docs</Button>
          <Button variant={contentSubTab === 'videos' ? 'default' : 'outline'} size="sm" onClick={() => setContentSubTab('videos')}><Video className="w-4 h-4 mr-1" />Videos</Button>
        </div>
      )}

      {/* Explore tab */}
      {activeTab === 'explore' && (
        <div className="space-y-3">
          {contentSubTab === 'docs' ? (
            filteredPublicDocs.length === 0 ? <EmptyDocuments /> : filteredPublicDocs.map(doc => renderDocCard(doc, doc.user_id === user?.id))
          ) : (
            <div className="space-y-4">{filteredPublicVideos.length === 0 ? <EmptyVideos /> : filteredPublicVideos.map(video => renderVideoCard(video, video.user_id === user?.id))}</div>
          )}
        </div>
      )}

      {/* My Content tab - merges private + folders */}
      {activeTab === 'my_content' && (
        <div className="space-y-4">
          {/* Folders section */}
          {!selectedFolder ? (
            <>
              {folders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {folders.length === 1 ? 'Playlist' : 'Playlists'}
                    </span>
                    <Button size="sm" variant="outline" className="gap-1 h-7" onClick={() => setShowNewFolder(true)}>
                      <FolderPlus className="w-3.5 h-3.5" />New
                    </Button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {folders.map(folder => (
                      <button key={folder.id} onClick={() => setSelectedFolder(folder.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl border shrink-0 transition-all hover:border-primary/30 bg-muted/20">
                        <Folder className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">{folder.name}</span>
                        <span className="text-[10px] text-muted-foreground">{folder.docIds.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {folders.length === 0 && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowNewFolder(true)}>
                    <FolderPlus className="w-4 h-4" />Create Playlist
                  </Button>
                </div>
              )}

              {contentSubTab === 'docs' ? (
                privateDocs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No documents yet. Upload one!</p> : (
                  <div className="space-y-3">{privateDocs.map(doc => renderDocCard(doc, true))}</div>
                )
              ) : (
                privateVideos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No videos yet. Upload one!</p> : (
                  <div className="space-y-4">{privateVideos.map(video => renderVideoCard(video, true))}</div>
                )
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedFolder(null)}><ArrowLeft className="w-4 h-4" /></Button>
                <h3 className="font-medium">{currentFolder?.name}</h3>
                <span className="text-xs text-muted-foreground">({folderDocs.length} docs)</span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteFolder(selectedFolder)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              {folderDocs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Empty playlist</p>
                  <p className="text-xs mt-1">Use "Move to Folder" from doc menu</p>
                </div>
              ) : (
                <div className="space-y-3">{folderDocs.map(doc => renderDocCard(doc, true))}</div>
              )}
            </>
          )}
        </div>
      )}

      {/* Saved tab */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved Documents</h3>
          {savedDocs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No saved documents</p> : (
            <div className="space-y-3">{savedDocs.map(doc => renderDocCard(doc, doc.user_id === user?.id))}</div>
          )}
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saved Videos</h3>
          {savedVideos.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No saved videos</p> : (
            <div className="space-y-4">{savedVideos.map(video => renderVideoCard(video, video.user_id === user?.id))}</div>
          )}
        </div>
      )}

      {/* Create/Upload tab */}
      {activeTab === 'create' && (
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant={uploadType === 'document' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('document')}><FileText className="w-4 h-4 mr-1" />Document</Button>
            <Button variant={uploadType === 'video' ? 'default' : 'outline'} size="sm" onClick={() => setUploadType('video')}><Video className="w-4 h-4 mr-1" />Video</Button>
          </div>
          <div className="space-y-4">
            <div><Label className="text-sm mb-2 block">Title *</Label><Input placeholder="Enter title" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} /></div>
            <div><Label className="text-sm mb-2 block">Description</Label><Textarea placeholder="Add description..." value={uploadDescription} onChange={e => setUploadDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label className="text-sm mb-2 block">File *</Label>
              <Input type="file" accept={uploadType === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' : 'video/*'} onChange={e => setUploadFile(e.target.files?.[0] || null)} />
              {uploadFile && <p className="text-xs text-muted-foreground mt-1">{uploadFile.name}</p>}
            </div>
            <div>
              <Label className="text-sm mb-2 block">Visibility</Label>
              <RadioGroup value={uploadVisibility} onValueChange={v => setUploadVisibility(v as any)} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="private" id="edu-private" /><Label htmlFor="edu-private" className="flex items-center gap-1 cursor-pointer"><Lock className="w-3.5 h-3.5" />Private</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="public" id="edu-public" /><Label htmlFor="edu-public" className="flex items-center gap-1 cursor-pointer"><Globe className="w-3.5 h-3.5" />Public</Label></div>
              </RadioGroup>
            </div>
            {uploading && uploadProgress > 0 && (
              <div className="space-y-2"><Progress value={uploadProgress} className="h-2" /><p className="text-xs text-center text-muted-foreground">{uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : 'Complete!'}</p></div>
            )}
            <Button className="w-full gap-2" onClick={handleUpload} disabled={uploading || !uploadFile || !uploadTitle.trim()}>
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading...</> : <><Upload className="w-4 h-4" />Upload</>}
            </Button>
          </div>
        </div>
      )}

      {/* Move to folder dialog */}
      <Dialog open={!!moveToFolderDocId} onOpenChange={() => setMoveToFolderDocId(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Move to Folder</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Create a folder first</p>
            ) : folders.map(folder => (
              <Button key={folder.id} variant="outline" className="w-full justify-start gap-2" onClick={() => moveDocToFolder(folder.id)}>
                <Folder className="w-4 h-4" />{folder.name}
                <span className="ml-auto text-xs text-muted-foreground">{folder.docIds.length} docs</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <EducationComments open={commentsOpen} onOpenChange={setCommentsOpen} documentId={selectedItem?.type === 'document' ? selectedItem.id : undefined} postId={selectedItem?.type === 'post' ? selectedItem.id : undefined} title={selectedItem?.title || ''} />
    </div>
  );
}
