import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Calendar, Check, X, ArrowRight, ArrowLeft, Camera, User, MapPin, Loader2, AtSign } from 'lucide-react';
import { validateLoginForm, validateSignupForm, getValidationErrors } from '@/lib/authValidation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { detectLocation } from '@/lib/geolocation';
import lumathaLogo from '@/assets/lumatha-logo.png';

// Generate years for date of birth (ages 13-100)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 88 }, (_, i) => currentYear - 13 - i);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1=name+username, 2=DOB, 3=location(auto), 4=profile pic, 5=credentials
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [detectedCity, setDetectedCity] = useState('');
  const [detectedCountry, setDetectedCountry] = useState('');
  const [detectedTimezone, setDetectedTimezone] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

  // Check username availability
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .maybeSingle();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // Auto-detect location when reaching step 3
  useEffect(() => {
    if (step === 3 && !locationDetected) {
      handleDetectLocation();
    }
  }, [step]);

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const loc = await detectLocation();
      setDetectedCity(loc.city);
      setDetectedCountry(loc.country);
      setDetectedTimezone(loc.timezone);
      setLocationDetected(true);
    } catch {
      toast.error('Could not detect location');
    } finally {
      setDetectingLocation(false);
    }
  };

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasNumber && passwordChecks.hasSpecial;

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = () => {
    if (!birthYear || !birthMonth || !birthDay) return null;
    const today = new Date();
    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const getAgeGroup = () => {
    const age = calculateAge();
    if (!age) return '18-25';
    if (age < 18) return '13-17';
    if (age <= 25) return '18-25';
    if (age <= 35) return '26-35';
    if (age <= 45) return '36-45';
    if (age <= 55) return '46-55';
    return '56+';
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!firstName.trim()) { toast.error('Please enter your first name'); return; }
      if (!username.trim() || username.length < 3) { toast.error('Username must be at least 3 characters'); return; }
      if (usernameAvailable === false) { toast.error('Username is taken'); return; }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => setStep(step - 1);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const result = validateLoginForm({ email, password });
    if (!result.success) {
      const errors = getValidationErrors(result);
      setFormErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      toast.success('Welcome back to Lumatha!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    const country = detectedCountry || 'Unknown';
    const ageGroup = getAgeGroup();
    const result = validateSignupForm({ 
      username: displayName, email, password, country, ageGroup, deviceType: 'mobile'
    });
    if (!result.success) {
      const errors = getValidationErrors(result);
      setFormErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setLoading(true);
    try {
      const sanitizedName = displayName.replace(/[<>'"`;]/g, '').slice(0, 50);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { 
            name: sanitizedName, country, age_group: ageGroup,
            birth_date: birthYear && birthMonth && birthDay 
              ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` : null
          }
        }
      });
      if (error) throw error;
      if (data.user) {
        let avatarUrl = null;
        if (profilePicFile) {
          const fileExt = profilePicFile.name.split('.').pop();
          const fileName = `${data.user.id}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, profilePicFile, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            avatarUrl = urlData.publicUrl;
          }
        }
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: sanitizedName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.toLowerCase().trim(),
          country,
          detected_city: detectedCity,
          timezone: detectedTimezone,
          age_group: ageGroup,
          avatar_url: avatarUrl
        } as any);
      }
      toast.success('Welcome to Lumatha! Account created.');
      navigate('/');
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSignupStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">What's your name?</h2>
              <p className="text-sm text-muted-foreground mt-1">This is how you'll appear on Lumatha</p>
            </div>
            <div className="space-y-3">
              <Input placeholder="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12" autoFocus />
              <Input placeholder="Last name (optional)" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12" />
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input placeholder="Username *" value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase())}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12 pl-10" />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white/40" />
                    ) : usernameAvailable ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : usernameAvailable === false ? (
                      <X className="w-4 h-4 text-red-400" />
                    ) : null}
                  </div>
                )}
              </div>
              {username.length >= 3 && usernameAvailable === false && (
                <p className="text-xs text-red-400">Username is taken</p>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">When were you born?</h2>
              <p className="text-sm text-white/50 mt-1">This helps personalize your experience</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={birthMonth} onValueChange={setBirthMonth}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {MONTHS.map((month, i) => (<SelectItem key={month} value={String(i + 1)} className="text-white">{month}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={birthDay} onValueChange={setBirthDay}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12"><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {DAYS.map((day) => (<SelectItem key={day} value={String(day)} className="text-white">{day}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={birthYear} onValueChange={setBirthYear}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {YEARS.map((year) => (<SelectItem key={year} value={String(year)} className="text-white">{year}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Detecting your location</h2>
              <p className="text-sm text-white/50 mt-1">We use this for regional content & auto theme</p>
            </div>
            <div className="flex flex-col items-center gap-4 py-6">
              {detectingLocation ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-12 h-12 animate-spin text-violet-400" />
                  <p className="text-white/60 text-sm">Detecting your location...</p>
                </div>
              ) : locationDetected ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">{detectedCity}{detectedCity && detectedCountry ? ', ' : ''}{detectedCountry}</p>
                    <p className="text-white/40 text-xs mt-1">{detectedTimezone}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation}
                    className="border-white/20 text-white/60 hover:text-white mt-2">
                    Re-detect
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-white/60 text-sm">Location detection failed</p>
                  <Button type="button" variant="outline" size="sm" onClick={handleDetectLocation}
                    className="border-white/20 text-white/60 hover:text-white">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Add a profile picture</h2>
              <p className="text-sm text-white/50 mt-1">Help others recognize you</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer group">
                <Avatar className="w-32 h-32 border-4 border-white/20 group-hover:border-violet-500 transition-colors">
                  <AvatarImage src={profilePic || undefined} />
                  <AvatarFallback className="bg-white/10 text-white text-3xl"><User className="w-12 h-12 text-white/40" /></AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
              <p className="text-xs text-white/40">Tap to upload your photo</p>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Create your account</h2>
              <p className="text-sm text-white/50 mt-1">Set up your email and password</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/80 text-sm">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/80 text-sm">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10 h-12" required />
                  <Button type="button" variant="ghost" size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                    {[
                      { check: passwordChecks.minLength, label: 'At least 8 characters' },
                      { check: passwordChecks.hasNumber, label: 'Contains a number' },
                      { check: passwordChecks.hasSpecial, label: 'Contains special character' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {item.check ? (
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center"><X className="w-3 h-3 text-white/40" /></div>
                        )}
                        <span className={`text-xs ${item.check ? 'text-green-400' : 'text-white/40'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
      <div className="fixed inset-0" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)' }}>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }} />
      </div>
      <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto">
            <img src={lumathaLogo} alt="Lumatha" className="w-16 h-16 object-contain rounded-xl mx-auto"
              style={{ boxShadow: '0 0 30px rgba(201, 162, 39, 0.2)' }} />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </CardTitle>
          <CardDescription className="text-white/50">
            {isLogin ? 'Sign in to continue your journey' : `Step ${step} of 5`}
          </CardDescription>
          {!isLogin && (
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-violet-500' : 'bg-white/20'}`} />
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-white/80 text-sm">Email</Label>
                <Input id="login-email" type="email" placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-white/80 text-sm">Password</Label>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10 h-12" required />
                  <Button type="button" variant="ghost" size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white">
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Signing in...</span>
                ) : (
                  <span className="flex items-center gap-2"><LogIn className="w-5 h-5" />Sign In</span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={step === 5 ? handleSignup : (e) => { e.preventDefault(); handleNextStep(); }}>
              {renderSignupStep()}
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={handlePrevStep}
                    className="flex-1 h-12 border-white/20 text-white hover:bg-white/10">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                )}
                <Button type="submit" disabled={loading || (step === 5 && !isPasswordValid) || (step === 1 && usernameAvailable === false)}
                  className={`h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white ${step > 1 ? 'flex-1' : 'w-full'}`}>
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Creating...</span>
                  ) : step === 5 ? (
                    <span className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Create Account</span>
                  ) : (
                    <span className="flex items-center gap-2">Next<ArrowRight className="w-5 h-5" /></span>
                  )}
                </Button>
              </div>
            </form>
          )}
          <div className="mt-6 text-center">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setStep(1); setFormErrors({}); }}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
