import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editListing?: any;
  onSuccess: () => void;
}

export function MarketplaceCreateDialog({ open, onOpenChange, editListing, onSuccess }: Props) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState(editListing?.type || 'sell');
  const [title, setTitle] = useState(editListing?.title || '');
  const [description, setDescription] = useState(editListing?.description || '');
  const [price, setPrice] = useState(editListing?.price?.toString() || '');
  const [location, setLocation] = useState(editListing?.location || '');
  const [category, setCategory] = useState(editListing?.category || '');
  const [qualification, setQualification] = useState(editListing?.qualification || '');
  const [salaryRange, setSalaryRange] = useState(editListing?.salary_range || '');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>(editListing?.media_urls || []);
  const [saving, setSaving] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles(prev => [...prev, ...files].slice(0, 5));
  };

  const removeFile = (i: number) => setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
  const removeExisting = (i: number) => setExistingMedia(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!user || !title.trim()) return;
    setSaving(true);

    try {
      let mediaUrls = [...existingMedia];
      let mediaTypes: string[] = existingMedia.map(() => 'image');

      for (const file of mediaFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('marketplace-media').upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('marketplace-media').getPublicUrl(path);
        mediaUrls.push(publicUrl);
        mediaTypes.push(file.type.startsWith('video') ? 'video' : 'image');
      }

      const payload = {
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || null,
        price: price ? parseFloat(price) : null,
        location: location.trim() || null,
        category: category.trim() || null,
        qualification: type === 'job' ? qualification.trim() || null : null,
        salary_range: type === 'job' ? salaryRange.trim() || null : null,
        media_urls: mediaUrls,
        media_types: mediaTypes,
      };

      if (editListing) {
        await supabase.from('marketplace_listings').update(payload).eq('id', editListing.id);
      } else {
        await supabase.from('marketplace_listings').insert(payload);
      }

      onSuccess();
      onOpenChange(false);
      setTitle(''); setDescription(''); setPrice(''); setMediaFiles([]); setExistingMedia([]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editListing ? 'Edit Listing' : 'Create Listing'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sell">Sell</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are you listing?" />
          </div>

          <div>
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details..." rows={3} />
          </div>

          {(type === 'sell' || type === 'rent') && (
            <div>
              <Label className="text-xs">Price (NPR)</Label>
              <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" />
            </div>
          )}

          {type === 'job' && (
            <>
              <div>
                <Label className="text-xs">Qualification</Label>
                <Input value={qualification} onChange={e => setQualification(e.target.value)} placeholder="e.g. Bachelor's degree" />
              </div>
              <div>
                <Label className="text-xs">Salary Range</Label>
                <Input value={salaryRange} onChange={e => setSalaryRange(e.target.value)} placeholder="e.g. 30k-50k/month" />
              </div>
            </>
          )}

          <div>
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City/Area" />
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Electronics, Clothing" />
          </div>

          {/* Media */}
          <div>
            <Label className="text-xs">Photos (up to 5)</Label>
            <div className="flex gap-2 mt-1 flex-wrap">
              {existingMedia.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" />
                  <button onClick={() => removeExisting(i)} className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {mediaFiles.map((f, i) => (
                <div key={`new-${i}`} className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                  <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                  <button onClick={() => removeFile(i)} className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {existingMedia.length + mediaFiles.length < 5 && (
                <button onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 transition-colors">
                  <ImagePlus className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
          </div>

          <Button onClick={handleSubmit} disabled={saving || !title.trim()} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {editListing ? 'Update' : 'Post Listing'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
