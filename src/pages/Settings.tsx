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
import { Switch } from '@/components/ui/switch';
import { Upload, LogOut, Moon, Sun, User, Bell, Shield, Palette, HelpCircle, ChevronRight, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, profile: userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Notification settings
  const [notifications, setNotifications] = useState({
    messages: true,
    likes: true,
    comments: true,
    follows: true,
  });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
      setWebsite(userProfile.website || '');
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
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Image too large. Max 10MB');
        return;
      }
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
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { cacheControl: '31536000', upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrl;
      }
      
      const { error } = await supabase.from('profiles').update({ 
        name, bio, location, website, avatar_url: newAvatarUrl 
      }).eq('id', user.id);
      
      if (error) throw error;
      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch (error) {
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

  const settingsSections = [
    { icon: Bell, label: 'Notifications', desc: 'Manage alerts' },
    { icon: Shield, label: 'Privacy', desc: 'Account security' },
    { icon: Globe, label: 'Language', desc: 'English' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ, Contact' },
  ];

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">⚙️ Settings</h1>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-xl">{name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90">
                <Upload className="w-3.5 h-3.5 text-primary-foreground" />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
            <div className="flex-1 min-w-0">
              <Button variant="outline" size="sm" onClick={() => navigate(`/profile/${user?.id}`)} className="gap-1.5">
                <User className="w-3.5 h-3.5" /> View Profile
              </Button>
              {avatarFile && (
                <p className="text-[10px] text-muted-foreground mt-1 truncate">
                  {avatarFile.name} ({(avatarFile.size / (1024 * 1024)).toFixed(1)}MB)
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="glass-card h-9" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="glass-card min-h-[60px]" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} className="glass-card h-9" placeholder="City" />
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="glass-card h-9" placeholder="URL" />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-full" size="sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="dark" id="dark" />
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">Dark</span>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="light" id="light" />
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Light</span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key}</span>
              <Switch 
                checked={value} 
                onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [key]: checked }))} 
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Settings */}
      <Card className="glass-card">
        <CardContent className="p-0 divide-y divide-border/50">
          {settingsSections.map((item, i) => (
            <button key={i} className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* App Info & Logout */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="text-center">
            <p className="text-sm font-medium">Crown of Creation</p>
            <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="w-full gap-2" size="sm">
            <LogOut className="w-4 h-4" /> Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
