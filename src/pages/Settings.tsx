import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Upload, LogOut, Moon, Sun, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, profile: userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setAvatarPreview(userProfile.avatar_url || '');
    }
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') document.body.classList.add('light');
    setLoading(false);
  }, [userProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let newAvatarUrl = avatarPreview;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        
        // Optimized upload - any size supported
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '31536000', // 1 year cache
            upsert: true,
            contentType: avatarFile.type
          });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        newAvatarUrl = publicUrl;
      }
      const { error } = await supabase.from('profiles').update({ name, bio, avatar_url: newAvatarUrl }).eq('id', user.id);
      if (error) throw error;
      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-4xl font-black flex items-center gap-2">
        ⚙️ Settings
      </h1>

      <Card className="glass-card border-border">
        <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback>{name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <Button 
              onClick={() => navigate(`/profile/${user?.id}`)} 
              variant="outline" 
              className="gap-2"
            >
              <User className="w-4 h-4" />
              View My Profile
            </Button>
            <div className="w-full">
              <Label htmlFor="avatar" className="flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Avatar (Any Size)</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="glass-card border-border mt-2" />
              {avatarFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {avatarFile.name} ({(avatarFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="glass-card border-border" /></div>
          <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="glass-card border-border min-h-[100px]" /></div>
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full">{saving ? 'Saving...' : 'Save Profile'}</Button>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer flex-1">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer flex items-center gap-2"><Moon className="w-4 h-4" />Dark</Label>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer flex-1">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer flex items-center gap-2"><Sun className="w-4 h-4" />Light</Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="glass-card border-border">
        <CardHeader><CardTitle>App Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Version 1.0 - Secure cloud storage</p>
          <Button onClick={handleLogout} variant="destructive" className="w-full gap-2"><LogOut className="w-4 h-4" />Logout</Button>
        </CardContent>
      </Card>
    </div>
  );
}
