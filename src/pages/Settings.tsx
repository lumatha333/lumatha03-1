import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoTheme } from '@/hooks/useAutoTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, LogOut, Moon, Sun, User, Bell, Shield, Palette, HelpCircle, ChevronRight, Globe, Phone, Mail, GraduationCap, Crown, Lock, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ne', name: 'नेपाली (Nepali)', flag: '🇳🇵' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇵🇹' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
  { code: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
];

const AGE_CATEGORIES = [
  '13-17 years (Teen)', '18-25 years (Young Adult)', '26-35 years (Adult)',
  '36-45 years (Middle Age)', '46-55 years (Mature)', '56+ years (Senior)',
];

export default function Settings() {
  const { user, profile: userProfile, logout } = useAuth();
  const { setManualTheme, currentTheme } = useAutoTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [ageCategory, setAgeCategory] = useState('');
  const [qualification, setQualification] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastNameChange, setLastNameChange] = useState<string | null>(null);
  const canChangeName = !lastNameChange || (Date.now() - new Date(lastNameChange).getTime()) > 17 * 24 * 60 * 60 * 1000;
  const [notifications, setNotifications] = useState({ messages: true, likes: true, comments: true, follows: true });

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
      setWebsite(userProfile.website || '');
      setAgeCategory(userProfile.age_group || '');
      setAvatarPreview(userProfile.avatar_url || '');
    }
    if (user?.email) setEmail(user.email);
    
    // Determine theme mode
    const override = localStorage.getItem('lumatha_theme_override');
    const overrideTime = localStorage.getItem('lumatha_theme_override_time');
    if (override && overrideTime) {
      const elapsed = Date.now() - parseInt(overrideTime);
      if (elapsed < 7 * 24 * 60 * 60 * 1000) {
        setTheme(override as 'light' | 'dark');
      } else {
        setTheme('auto');
      }
    } else {
      setTheme('auto');
    }
    
    const savedLang = localStorage.getItem('lumatha_language') || 'en';
    const savedLastChange = localStorage.getItem('lumatha_last_name_change');
    setLanguage(savedLang);
    setLastNameChange(savedLastChange);
    setLoading(false);
  }, [userProfile, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { toast.error('Image too large. Max 10MB'); return; }
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
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, { cacheControl: '31536000', upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        newAvatarUrl = publicUrl;
      }
      const { error } = await supabase.from('profiles').update({ 
        name, bio, location, website, avatar_url: newAvatarUrl, age_group: ageCategory
      }).eq('id', user.id);
      if (error) throw error;
      localStorage.setItem('lumatha_last_name_change', new Date().toISOString());
      setLastNameChange(new Date().toISOString());
      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'auto') => {
    setTheme(newTheme);
    if (newTheme === 'auto') {
      // Remove manual override, let auto-theme take over
      localStorage.removeItem('lumatha_theme_override');
      localStorage.removeItem('lumatha_theme_override_time');
      // Apply based on time
      const hour = new Date().getHours();
      const autoTheme = (hour >= 5 && hour < 17) ? 'light' : 'dark';
      setManualTheme(autoTheme);
      // But remove override so it auto-switches
      localStorage.removeItem('lumatha_theme_override');
      localStorage.removeItem('lumatha_theme_override_time');
    } else {
      setManualTheme(newTheme);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('lumatha_language', lang);
  };

  const handleLogout = async () => { await logout(); navigate('/auth'); };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-4 pb-20 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">⚙️ Settings</h1>

      {/* Profile Card */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Profile</CardTitle>
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
            </div>
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="text-xs flex items-center gap-1">
                Name {!canChangeName && <span className="text-destructive text-[10px] flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> (17-day lock)</span>}
              </Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="glass-card h-9" disabled={!canChangeName} />
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
                <Label className="text-xs">Age Category</Label>
                <Select value={ageCategory} onValueChange={setAgeCategory}>
                  <SelectTrigger className="glass-card h-9"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{AGE_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Qualification</Label>
                <Input value={qualification} onChange={(e) => setQualification(e.target.value)} className="glass-card h-9" placeholder="e.g. Bachelor's" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</Label>
                <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="glass-card h-9" placeholder="+977..." />
              </div>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
              <Input value={email} disabled className="glass-card h-9 opacity-60" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="w-full" size="sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Theme - with Auto option */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid grid-cols-3 gap-2">
            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${theme === 'auto' ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="auto" id="auto" />
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Auto</span>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="dark" id="dark" />
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">Dark</span>
            </label>
            <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border'}`}>
              <RadioGroupItem value="light" id="light" />
              <Sun className="w-4 h-4" />
              <span className="text-sm font-medium">Light</span>
            </label>
          </RadioGroup>
          <p className="text-[10px] text-muted-foreground mt-2">
            Auto: Light 5AM–5PM, Dark 5PM–5AM. Manual override lasts 1 week.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize">{key}</span>
              <Switch checked={value} onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [key]: checked }))} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Private Account</p>
              <p className="text-[10px] text-muted-foreground">Only approved followers can see your posts</p>
            </div>
            <Switch checked={localStorage.getItem('lumatha_private_account') === 'true'} onCheckedChange={async (checked) => {
              localStorage.setItem('lumatha_private_account', String(checked));
              if (user) await supabase.from('profiles').update({ is_private: checked } as any).eq('id', user.id);
            }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Who can message you</p>
              <p className="text-[10px] text-muted-foreground">Control who sends you messages</p>
            </div>
            <Select value={localStorage.getItem('lumatha_msg_perm') || 'friends'} onValueChange={async (val) => {
              localStorage.setItem('lumatha_msg_perm', val);
              if (user) await supabase.from('profiles').update({ allow_messages_from: val } as any).eq('id', user.id);
            }}>
              <SelectTrigger className="glass-card h-8 w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="everyone">Everyone</SelectItem>
                <SelectItem value="followers">Followers</SelectItem>
                <SelectItem value="friends">Friends Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">Name and region can only change once every 17 days.</p>
          </div>
          <Button variant="outline" size="sm" className="w-full gap-2"><Lock className="w-3.5 h-3.5" /> Change Password</Button>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="glass-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" /> Language</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="glass-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2"><span>{lang.flag}</span><span>{lang.name}</span></span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[10px] text-muted-foreground mt-2">Note: "Lumatha" and core section names stay in English.</p>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="glass-card">
        <CardContent className="p-0">
          <button className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><HelpCircle className="w-4 h-4 text-muted-foreground" /></div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">Help & Support</p>
              <p className="text-xs text-muted-foreground">FAQ, feedback, report issues</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </CardContent>
      </Card>

      {/* App Info & Logout */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="text-center flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-bold gradient-text">Lumatha</p>
              <p className="text-xs text-muted-foreground">Version 1.0.0</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="destructive" className="w-full gap-2" size="sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
