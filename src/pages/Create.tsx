import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Sparkles, Eye, Trash2, Upload, X, Image, Film, ChevronLeft, ChevronRight } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: '📝 General' },
  { value: 'regional', label: '🏠 Regional' },
  { value: 'global', label: '🌍 Global' },
  { value: 'education', label: '📚 Education' },
  { value: 'music', label: '🎵 Music' },
  { value: 'adventure', label: '🧭 Adventure' },
];

export default function Create() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem('coc_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        setContent(parsed.content || '');
        setTitle(parsed.title || '');
        setCategory(parsed.category || 'general');
      } catch {
        setContent(draft);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('coc_draft', JSON.stringify({ content, title, category }));
  }, [content, title, category]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 10 files
    const newFiles = [...mediaFiles, ...files].slice(0, 10);
    setMediaFiles(newFiles);

    // Generate preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
    setCurrentPreviewIndex(0);
  };

  const removeFile = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = previewUrls.filter((_, i) => i !== index);
    
    // Revoke old URL
    URL.revokeObjectURL(previewUrls[index]);
    
    setMediaFiles(newFiles);
    setPreviewUrls(newPreviews);
    setCurrentPreviewIndex(Math.min(currentPreviewIndex, newPreviews.length - 1));
  };

  const handleClear = () => {
    setContent('');
    setTitle('');
    setCategory('general');
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setMediaFiles([]);
    setPreviewUrls([]);
    setCurrentPreviewIndex(0);
    localStorage.removeItem('coc_draft');
    toast.success('Form cleared');
  };

  const handleSave = async () => {
    if (!content.trim() || !title.trim()) {
      toast.error('Please add a title and content');
      return;
    }

    if (!user) {
      toast.error('Please login to create posts');
      return;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      const uploadedTypes: string[] = [];

      // Upload all media files in parallel
      if (mediaFiles.length > 0) {
        const uploadPromises = mediaFiles.map(async (file, index) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file, {
              cacheControl: '31536000',
              upsert: false,
              contentType: file.type
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          
          return {
            url: publicUrl,
            type: file.type.startsWith('video') ? 'video' : 'image'
          };
        });

        const results = await Promise.all(uploadPromises);
        results.forEach(r => {
          uploadedUrls.push(r.url);
          uploadedTypes.push(r.type);
        });
      }

      // Create post with multiple media support
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        file_url: uploadedUrls[0] || null,
        file_type: uploadedTypes[0] || null,
        media_urls: uploadedUrls,
        media_types: uploadedTypes,
        category: category,
        visibility: visibility
      });

      if (error) throw error;

      toast.success('Post created successfully!');
      handleClear();
      navigate(visibility === 'public' ? '/public' : '/private');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const isVideo = (file: File) => file.type.startsWith('video');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        <h1 className="text-3xl md:text-4xl font-black gradient-text">Create Post</h1>
      </div>

      <Card className="glass-card border-border shadow-lg">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            New Post
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Visibility */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-primary">👁️</span> Visibility
            </Label>
            <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as any)}>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="cursor-pointer font-medium">🌐 Public</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="cursor-pointer font-medium">🔒 Private</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <span className="text-primary">📂</span> Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="glass-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-border">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
              <span className="text-primary">📝</span> Title
            </Label>
            <Input
              id="title"
              placeholder="Give your post a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-card border-border hover:border-primary/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Content */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-base font-semibold flex items-center gap-2">
              <span className="text-primary">✍️</span> Content
            </Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] glass-card border-border hover:border-primary/50 focus:border-primary transition-colors"
            />
          </div>

          {/* Media Upload - Multiple Files */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> Upload Photos/Videos (Max 10)
            </Label>
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-background/50">
                <Image className="w-5 h-5 text-primary" />
                <span className="text-sm">Photos</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors bg-background/50">
                <Film className="w-5 h-5 text-primary" />
                <span className="text-sm">Videos</span>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            
            {mediaFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {mediaFiles.length} file(s) selected ({(mediaFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB total)
              </p>
            )}
          </div>

          {/* Preview Gallery */}
          {previewUrls.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preview</Label>
              
              {/* Main Preview */}
              <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 shadow-lg bg-black/5">
                {isVideo(mediaFiles[currentPreviewIndex]) ? (
                  <video 
                    src={previewUrls[currentPreviewIndex]} 
                    className="w-full max-h-[400px] object-contain"
                    controls
                  />
                ) : (
                  <img 
                    src={previewUrls[currentPreviewIndex]} 
                    alt="Preview" 
                    className="w-full max-h-[400px] object-contain"
                  />
                )}
                
                {/* Navigation */}
                {previewUrls.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full"
                      onClick={() => setCurrentPreviewIndex((prev) => (prev - 1 + previewUrls.length) % previewUrls.length)}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background rounded-full"
                      onClick={() => setCurrentPreviewIndex((prev) => (prev + 1) % previewUrls.length)}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm bg-black/60 text-white px-2 py-1 rounded-full">
                      {currentPreviewIndex + 1} / {previewUrls.length}
                    </div>
                  </>
                )}
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previewUrls.map((url, index) => (
                  <div 
                    key={index} 
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                      index === currentPreviewIndex ? 'border-primary ring-2 ring-primary/30' : 'border-border'
                    }`}
                    onClick={() => setCurrentPreviewIndex(index)}
                  >
                    {isVideo(mediaFiles[index]) ? (
                      <div className="w-full h-full bg-black/80 flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full"
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 flex-wrap pt-4 border-t border-border/50">
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Post'}
            </Button>
            <Button 
              onClick={handleClear} 
              variant="destructive" 
              className="gap-2 ml-auto" 
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
