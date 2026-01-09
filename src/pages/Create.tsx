import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, Trash2, Image, Film, X, ChevronLeft, ChevronRight, ArrowLeft, Globe, Lock, Users, Ghost } from 'lucide-react';

const CATEGORIES = [
  { value: 'global', label: '🌍 Global', desc: 'Visible worldwide' },
  { value: 'regional', label: '🏠 Regional', desc: 'Visible to your region' },
  { value: 'friends', label: '👥 Friends/Following', desc: 'Only connections' },
  { value: 'ghost', label: '👻 Ghost', desc: 'Disappears in 24 hours' },
];

const VISIBILITY = [
  { value: 'public', label: 'Public', icon: Globe },
  { value: 'private', label: 'Private', icon: Lock },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 10;

export default function Create() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('global');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const draft = localStorage.getItem('zenpeace_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setContent(parsed.content || '');
        setTitle(parsed.title || '');
        setCategory(parsed.category || 'global');
      } catch { setContent(draft); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('zenpeace_draft', JSON.stringify({ content, title, category }));
  }, [content, title, category]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name} too large. Max 50MB`);
        return false;
      }
      return true;
    });

    const newFiles = [...mediaFiles, ...validFiles].slice(0, MAX_FILES);
    setMediaFiles(newFiles);
    
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
    setCurrentPreviewIndex(0);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setCurrentPreviewIndex(Math.min(currentPreviewIndex, previewUrls.length - 2));
  };

  const handleClear = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setContent(''); setTitle(''); setCategory('global');
    setMediaFiles([]); setPreviewUrls([]); setCurrentPreviewIndex(0);
    localStorage.removeItem('zenpeace_draft');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const handleSave = async () => {
    if (!content.trim()) return toast.error('Add some content');
    if (!user) return toast.error('Please login');

    setLoading(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: string[] = [];

      if (mediaFiles.length > 0) {
        for (let i = 0; i < mediaFiles.length; i++) {
          const file = mediaFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${i}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage.from('posts-media').upload(fileName, file, {
            cacheControl: '31536000', contentType: file.type
          });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage.from('posts-media').getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
          uploadedTypes.push(file.type.startsWith('video') ? 'video' : 'image');
          setUploadProgress(((i + 1) / mediaFiles.length) * 100);
        }
      }

      const postTitle = title.trim() || 'My Post';
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: postTitle,
        content: content.trim(),
        file_url: uploadedUrls[0] || null,
        file_type: uploadedTypes[0] || null,
        media_urls: uploadedUrls,
        media_types: uploadedTypes,
        category,
        visibility
      });

      if (error) throw error;

      toast.success('Post created!');
      handleClear();
      navigate('/');
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const isVideo = (file: File) => file.type.startsWith('video');
  const totalSize = mediaFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          <h1 className="text-xl font-bold gradient-text">Create Post</h1>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          {/* Visibility */}
          <div>
            <Label className="text-xs mb-2 block">Visibility</Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)} className="flex gap-2">
              {VISIBILITY.map((v) => {
                const Icon = v.icon;
                return (
                  <label 
                    key={v.value}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm cursor-pointer flex-1 justify-center transition-all ${visibility === v.value ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <RadioGroupItem value={v.value} className="sr-only" />
                    <Icon className="w-4 h-4" />
                    {v.label}
                  </label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="glass-card h-10 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex flex-col">
                      <span>{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground">{cat.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div>
            <Label className="text-xs">Title (Optional)</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your post a title..." className="glass-card mt-1" />
          </div>

          {/* Content */}
          <div>
            <Label className="text-xs">What's on your mind?</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Share your thoughts..." 
              className="min-h-[100px] glass-card mt-1" />
          </div>

          {/* Media Upload */}
          <div>
            <Label className="text-xs">Media (Max {MAX_FILES} files, 50MB each)</Label>
            <div className="flex gap-2 mt-1">
              <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all">
                <Image className="w-4 h-4 text-primary" /><span className="text-xs">Photos</span>
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-all">
                <Film className="w-4 h-4 text-primary" /><span className="text-xs">Videos</span>
                <input type="file" accept="video/*" multiple onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
            {mediaFiles.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {mediaFiles.length} file(s) • {(totalSize / (1024 * 1024)).toFixed(1)} MB
              </p>
            )}
          </div>

          {/* Preview Gallery */}
          {previewUrls.length > 0 && (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-primary/30 bg-black/5">
                {isVideo(mediaFiles[currentPreviewIndex]) ? (
                  <video src={previewUrls[currentPreviewIndex]} className="w-full max-h-64 object-contain" controls />
                ) : (
                  <img src={previewUrls[currentPreviewIndex]} alt="Preview" className="w-full max-h-64 object-contain" />
                )}
                
                {previewUrls.length > 1 && (
                  <>
                    <Button size="icon" variant="ghost" className="absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-background/80"
                      onClick={() => setCurrentPreviewIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-background/80"
                      onClick={() => setCurrentPreviewIndex((prev) => (prev + 1) % previewUrls.length)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
                      {currentPreviewIndex + 1}/{previewUrls.length}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {previewUrls.map((url, i) => (
                  <div key={i} className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer ${i === currentPreviewIndex ? 'border-primary' : 'border-border'}`}
                    onClick={() => setCurrentPreviewIndex(i)}>
                    {isVideo(mediaFiles[i]) ? (
                      <div className="w-full h-full bg-black/80 flex items-center justify-center"><Film className="w-4 h-4 text-white" /></div>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <button className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {loading && uploadProgress > 0 && (
            <div className="space-y-1">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-[10px] text-muted-foreground text-center">Uploading... {Math.round(uploadProgress)}%</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={loading || !content.trim()} className="flex-1 gap-2">
              <Sparkles className="w-4 h-4" />{loading ? 'Creating...' : 'Create'}
            </Button>
            <Button onClick={handleClear} variant="outline" disabled={loading} className="gap-2">
              <Trash2 className="w-4 h-4" />Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}