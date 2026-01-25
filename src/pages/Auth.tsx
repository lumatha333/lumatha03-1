import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Globe, Calendar, Crown, Search, Laptop, Smartphone, Tablet, Check, X, Info, Sparkles, Zap, Star, Heart } from 'lucide-react';
import { validateLoginForm, validateSignupForm, getValidationErrors } from '@/lib/authValidation';

// Complete world countries list
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
];

const AGE_GROUPS = [
  { value: '13-17', label: '13-17 years (Teen)' },
  { value: '18-25', label: '18-25 years (Young Adult)' },
  { value: '26-35', label: '26-35 years (Adult)' },
  { value: '36-45', label: '36-45 years (Middle Age)' },
  { value: '46-55', label: '46-55 years (Mature)' },
  { value: '56+', label: '56+ years (Senior)' },
];

// Floating particle component
const FloatingParticle = ({ delay, size, color, duration, left, top }: {
  delay: number; size: number; color: string; duration: number; left: string; top: string;
}) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      background: color,
      left,
      top,
      animation: `float ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      filter: 'blur(1px)',
    }}
  />
);

export default function Auth() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('Nepal');
  const [ageGroup, setAgeGroup] = useState('18-25');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500);
    return () => clearTimeout(timer);
  }, []);

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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    if (isLogin) {
      const result = validateLoginForm({ email, password });
      if (!result.success) {
        const errors = getValidationErrors(result);
        setFormErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
    } else {
      const result = validateSignupForm({ username, email, password, country, ageGroup, deviceType });
      if (!result.success) {
        const errors = getValidationErrors(result);
        setFormErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw error;
        toast.success('Welcome back to Zenpeace!');
        navigate('/');
      } else {
        const sanitizedUsername = username.trim().replace(/[<>'"`;]/g, '').slice(0, 50);
        if (!sanitizedUsername) {
          toast.error('Please enter a valid username');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: sanitizedUsername, country, age_group: ageGroup, device_type: deviceType }
          }
        });
        
        if (error) throw error;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: sanitizedUsername,
            country,
            age_group: ageGroup
          });
          localStorage.setItem('zenpeace_device_type', deviceType);
        }

        toast.success('Welcome to Zenpeace! Account created.');
        navigate('/');
      }
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Spectacular splash screen with meteor effects
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[200] overflow-hidden bg-black">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900 animate-pulse" />
        
        {/* Meteor shower effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 bg-gradient-to-b from-white via-yellow-200 to-transparent"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                height: `${50 + Math.random() * 100}px`,
                animation: `meteorFall ${1 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: 0.8,
                transform: `rotate(${-15 + Math.random() * 30}deg)`,
              }}
            />
          ))}
        </div>

        {/* Aurora borealis effect */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/20 via-green-500/10 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute top-0 left-1/4 w-1/2 h-1/3 bg-gradient-to-b from-pink-500/20 via-purple-500/10 to-transparent animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        {/* Floating orbs */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <FloatingParticle
              key={i}
              delay={i * 0.3}
              size={10 + Math.random() * 30}
              color={['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8fd8', '#a78bfa', '#34d399'][i % 6]}
              duration={4 + Math.random() * 4}
              left={`${Math.random() * 100}%`}
              top={`${Math.random() * 100}%`}
            />
          ))}
        </div>

        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-6 animate-fade-in z-10">
            {/* Glowing crown */}
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 rounded-full blur-2xl opacity-60 animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-primary via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                <Crown className="w-16 h-16 text-white drop-shadow-2xl" />
              </div>
              {/* Sparkle effects around crown */}
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
              <Star className="absolute -bottom-1 -left-3 w-6 h-6 text-pink-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Zap className="absolute top-0 -left-4 w-5 h-5 text-cyan-300 animate-pulse" style={{ animationDelay: '1s' }} />
              <Heart className="absolute -bottom-2 right-0 w-5 h-5 text-red-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>

            {/* Brand text with gradient glow */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-yellow-200 via-pink-300 to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl animate-pulse">
                  ZENPEACE
                </span>
              </h1>
              <p className="text-lg text-white/80 font-light tracking-wider animate-fade-in" style={{ animationDelay: '0.5s' }}>
                Find Your Inner Peace
              </p>
            </div>

            {/* Loading bar */}
            <div className="w-64 mx-auto">
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 rounded-full"
                  style={{ 
                    animation: 'loadProgress 3s ease-out forwards',
                    width: '0%'
                  }}
                />
              </div>
              <p className="text-xs text-white/50 mt-2 animate-pulse">Preparing your cosmic journey...</p>
            </div>
          </div>
        </div>

        {/* CSS for animations */}
        <style>{`
          @keyframes meteorFall {
            0% { transform: translateY(-100px) translateX(0); opacity: 1; }
            100% { transform: translateY(100vh) translateX(100px); opacity: 0; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.6; }
            50% { transform: translateY(-30px) scale(1.1); opacity: 1; }
          }
          @keyframes loadProgress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden relative">
      {/* Spectacular animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-cyan-600/25 to-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-500/20 to-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full opacity-40"
              style={{
                background: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8fd8', '#a78bfa', '#34d399', '#60a5fa'][i % 7],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${6 + Math.random() * 6}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <Card className="w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-4">
          {/* Glowing logo */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full blur-xl opacity-70 animate-pulse" />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl">
              <Crown className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <CardTitle className="text-3xl font-black">
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              {isLogin ? 'Welcome Back' : 'Join Zenpeace'}
            </span>
          </CardTitle>
          <CardDescription className="text-white/60">
            {isLogin ? 'Continue your peaceful journey' : 'Start your journey to inner peace'}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-white/80 flex items-center gap-2 text-sm">
                  <span className="text-lg">👤</span> Username
                </Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-11 focus:border-violet-500 focus:ring-violet-500/20"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/80 flex items-center gap-2 text-sm">
                <span className="text-lg">📧</span> Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/40 h-11 focus:border-violet-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/80 flex items-center gap-2 text-sm">
                <span className="text-lg">🔒</span> Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/40 pr-10 h-11 focus:border-violet-500"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {!isLogin && password.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 space-y-1.5">
                  <p className="text-xs text-white/60 font-medium mb-2">Password Requirements:</p>
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

            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-white/80 flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-violet-400" /> Country
                    </Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue>
                          <span className="flex items-center gap-2">
                            <span>{selectedCountryFlag}</span>
                            <span className="truncate">{country}</span>
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20 max-h-60">
                        <div className="p-2 sticky top-0 bg-slate-900">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                            <Input 
                              placeholder="Search country..." 
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="pl-7 h-8 text-xs bg-white/10 border-white/20 text-white"
                            />
                          </div>
                        </div>
                        {filteredCountries.map((c) => (
                          <SelectItem key={c.name} value={c.name} className="text-white hover:bg-white/10">
                            <span className="flex items-center gap-2">
                              <span>{c.flag}</span> {c.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/80 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-violet-400" /> Age Group
                    </Label>
                    <Select value={ageGroup} onValueChange={setAgeGroup}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/20">
                        {AGE_GROUPS.map((ag) => (
                          <SelectItem key={ag.value} value={ag.value} className="text-white hover:bg-white/10">
                            {ag.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/80 flex items-center gap-2 text-sm">
                    <Laptop className="w-4 h-4 text-violet-400" /> Primary Device
                  </Label>
                  <RadioGroup value={deviceType} onValueChange={(v) => setDeviceType(v as any)} className="flex gap-3">
                    {[
                      { value: 'mobile', icon: Smartphone, label: 'Mobile' },
                      { value: 'tablet', icon: Tablet, label: 'Tablet' },
                      { value: 'desktop', icon: Laptop, label: 'Desktop' },
                    ].map((d) => (
                      <Label
                        key={d.value}
                        htmlFor={d.value}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all border ${
                          deviceType === d.value 
                            ? 'bg-violet-500/20 border-violet-500 text-violet-300' 
                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                        }`}
                      >
                        <RadioGroupItem value={d.value} id={d.value} className="sr-only" />
                        <d.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{d.label}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              disabled={loading || (!isLogin && !isPasswordValid)}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 border-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setFormErrors({}); }}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
