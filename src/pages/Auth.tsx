import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Globe, Calendar, Search, Check, X, ArrowRight, ArrowLeft, Camera, User } from 'lucide-react';
import { validateLoginForm, validateSignupForm, getValidationErrors } from '@/lib/authValidation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import zenpeaceLogo from '@/assets/zenpeace-logo.png';

// Complete world countries list - sorted A-Z
const ALL_COUNTRIES = [
  { name: 'Afghanistan', flag: '🇦🇫' },
  { name: 'Albania', flag: '🇦🇱' },
  { name: 'Algeria', flag: '🇩🇿' },
  { name: 'Andorra', flag: '🇦🇩' },
  { name: 'Angola', flag: '🇦🇴' },
  { name: 'Argentina', flag: '🇦🇷' },
  { name: 'Armenia', flag: '🇦🇲' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'Austria', flag: '🇦🇹' },
  { name: 'Azerbaijan', flag: '🇦🇿' },
  { name: 'Bahamas', flag: '🇧🇸' },
  { name: 'Bahrain', flag: '🇧🇭' },
  { name: 'Bangladesh', flag: '🇧🇩' },
  { name: 'Belarus', flag: '🇧🇾' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Bhutan', flag: '🇧🇹' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Brunei', flag: '🇧🇳' },
  { name: 'Bulgaria', flag: '🇧🇬' },
  { name: 'Cambodia', flag: '🇰🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Cyprus', flag: '🇨🇾' },
  { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'Estonia', flag: '🇪🇪' },
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Fiji', flag: '🇫🇯' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Iceland', flag: '🇮🇸' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Israel', flag: '🇮🇱' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Jordan', flag: '🇯🇴' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Latvia', flag: '🇱🇻' },
  { name: 'Lebanon', flag: '🇱🇧' },
  { name: 'Lithuania', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' },
  { name: 'Malta', flag: '🇲🇹' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Mongolia', flag: '🇲🇳' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Myanmar', flag: '🇲🇲' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'North Korea', flag: '🇰🇵' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palestine', flag: '🇵🇸' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Peru', flag: '🇵🇪' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Slovenia', flag: '🇸🇮' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Syria', flag: '🇸🇾' },
  { name: 'Taiwan', flag: '🇹🇼' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'UK', flag: '🇬🇧' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Uzbekistan', flag: '🇺🇿' },
  { name: 'Venezuela', flag: '🇻🇪' },
  { name: 'Vietnam', flag: '🇻🇳' },
  { name: 'Yemen', flag: '🇾🇪' },
  { name: 'Zambia', flag: '🇿🇲' },
  { name: 'Zimbabwe', flag: '🇿🇼' },
].sort((a, b) => a.name.localeCompare(b.name));

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
  const [step, setStep] = useState(1); // Multi-step for signup: 1=name, 2=DOB, 3=country, 4=profile pic, 5=credentials
  
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Nepal');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const search = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(search));
  }, [countrySearch]);

  const selectedCountryFlag = ALL_COUNTRIES.find(c => c.name === country)?.flag || '🌍';

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasNumber && passwordChecks.hasSpecial;

  const username = `${firstName.trim()} ${lastName.trim()}`.trim();

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = () => {
    if (!birthYear || !birthMonth || !birthDay) return null;
    const today = new Date();
    const birthDate = new Date(parseInt(birthYear), parseInt(birthMonth) - 1, parseInt(birthDay));
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
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
      if (!firstName.trim()) {
        toast.error('Please enter your first name');
        return;
      }
    } else if (step === 2) {
      // DOB is optional, can skip
    } else if (step === 3) {
      if (!country) {
        toast.error('Please select your country');
        return;
      }
    }
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

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
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      if (error) throw error;
      toast.success('Welcome back to Zenpeace!');
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
    
    const ageGroup = getAgeGroup();
    const result = validateSignupForm({ 
      username, 
      email, 
      password, 
      country, 
      ageGroup,
      deviceType: 'mobile' // Default, we removed this field
    });
    
    if (!result.success) {
      const errors = getValidationErrors(result);
      setFormErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    
    setLoading(true);
    try {
      const sanitizedUsername = username.replace(/[<>'"`;]/g, '').slice(0, 50);
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { 
            name: sanitizedUsername, 
            country, 
            age_group: ageGroup,
            birth_date: birthYear && birthMonth && birthDay 
              ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}` 
              : null
          }
        }
      });
      
      if (error) throw error;

      if (data.user) {
        // Upload profile picture if provided
        let avatarUrl = null;
        if (profilePicFile) {
          const fileExt = profilePicFile.name.split('.').pop();
          const fileName = `${data.user.id}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, profilePicFile, { upsert: true });
          
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            avatarUrl = urlData.publicUrl;
          }
        }

        await supabase.from('profiles').upsert({
          id: data.user.id,
          name: sanitizedUsername,
          country,
          age_group: ageGroup,
          avatar_url: avatarUrl
        });
      }

      toast.success('Welcome to Zenpeace! Account created.');
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

  // Render step content for signup
  const renderSignupStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">What's your name?</h2>
              <p className="text-sm text-white/50 mt-1">Enter your name as it appears on official documents</p>
            </div>
            
            <div className="space-y-3">
              <Input
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                autoFocus
              />
              <Input
                placeholder="Last name (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
              />
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
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {MONTHS.map((month, i) => (
                    <SelectItem key={month} value={String(i + 1)} className="text-white">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={birthDay} onValueChange={setBirthDay}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={String(day)} className="text-white">
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={birthYear} onValueChange={setBirthYear}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white h-12">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={String(year)} className="text-white">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-white">Where are you from?</h2>
              <p className="text-sm text-white/50 mt-1">Select your country for regional content</p>
            </div>
            
            {/* Search bar at top */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input 
                placeholder="Search country..." 
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="pl-10 h-12 bg-white/5 border-white/20 text-white placeholder:text-white/40"
                autoFocus
              />
            </div>
            
            {/* Country list */}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/20 bg-white/5">
              {filteredCountries.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setCountry(c.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    country === c.name 
                      ? 'bg-violet-600/30 text-white' 
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <span className="flex-1">{c.name}</span>
                  {country === c.name && <Check className="w-4 h-4 text-violet-400" />}
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <p className="text-center text-white/40 py-6">No countries found</p>
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
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group"
              >
                <Avatar className="w-32 h-32 border-4 border-white/20 group-hover:border-violet-500 transition-colors">
                  <AvatarImage src={profilePic || undefined} />
                  <AvatarFallback className="bg-white/10 text-white text-3xl">
                    <User className="w-12 h-12 text-white/40" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg group-hover:bg-violet-500 transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
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
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/80 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10 h-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
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
                          <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                            <X className="w-3 h-3 text-white/40" />
                          </div>
                        )}
                        <span className={`text-xs ${item.check ? 'text-green-400' : 'text-white/40'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
      {/* Elegant dark background */}
      <div className="fixed inset-0" style={{ 
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)'
      }}>
        {/* Subtle golden glow */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a227 0%, transparent 70%)' }}
        />
      </div>

      <Card className="w-full max-w-md bg-black/50 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-4">
          {/* Logo */}
          <div className="mx-auto">
            <img 
              src={zenpeaceLogo} 
              alt="Zenpeace" 
              className="w-16 h-16 object-contain rounded-xl mx-auto"
              style={{ boxShadow: '0 0 30px rgba(201, 162, 39, 0.2)' }}
            />
          </div>
          
          <CardTitle className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : step <= 5 ? 'Create Account' : 'Join Zenpeace'}
          </CardTitle>
          <CardDescription className="text-white/50">
            {isLogin ? 'Sign in to continue your journey' : `Step ${step} of 5`}
          </CardDescription>
          
          {/* Progress bar for signup */}
          {!isLogin && (
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-violet-500' : 'bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-white/80 text-sm">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-12"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-white/80 text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10 h-12"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={step === 5 ? handleSignup : (e) => { e.preventDefault(); handleNextStep(); }}>
              {renderSignupStep()}
              
              <div className="flex gap-3 mt-6">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 h-12 border-white/20 text-white hover:bg-white/10"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading || (step === 5 && !isPasswordValid)}
                  className={`h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white ${
                    step > 1 ? 'flex-1' : 'w-full'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : step === 5 ? (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Next
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { 
                setIsLogin(!isLogin); 
                setStep(1);
                setFormErrors({}); 
              }}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
