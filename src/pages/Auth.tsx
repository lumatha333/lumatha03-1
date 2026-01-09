import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Globe, Calendar, Crown, Search, Laptop, Smartphone, Tablet, Check, X, Info } from 'lucide-react';

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
  { name: 'Barbados', flag: '🇧🇧' },
  { name: 'Belarus', flag: '🇧🇾' },
  { name: 'Belgium', flag: '🇧🇪' },
  { name: 'Belize', flag: '🇧🇿' },
  { name: 'Benin', flag: '🇧🇯' },
  { name: 'Bhutan', flag: '🇧🇹' },
  { name: 'Bolivia', flag: '🇧🇴' },
  { name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { name: 'Botswana', flag: '🇧🇼' },
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Brunei', flag: '🇧🇳' },
  { name: 'Bulgaria', flag: '🇧🇬' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Burundi', flag: '🇧🇮' },
  { name: 'Cambodia', flag: '🇰🇭' },
  { name: 'Cameroon', flag: '🇨🇲' },
  { name: 'Canada', flag: '🇨🇦' },
  { name: 'Cape Verde', flag: '🇨🇻' },
  { name: 'Central African Republic', flag: '🇨🇫' },
  { name: 'Chad', flag: '🇹🇩' },
  { name: 'Chile', flag: '🇨🇱' },
  { name: 'China', flag: '🇨🇳' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Comoros', flag: '🇰🇲' },
  { name: 'Congo', flag: '🇨🇬' },
  { name: 'Costa Rica', flag: '🇨🇷' },
  { name: 'Croatia', flag: '🇭🇷' },
  { name: 'Cuba', flag: '🇨🇺' },
  { name: 'Cyprus', flag: '🇨🇾' },
  { name: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Denmark', flag: '🇩🇰' },
  { name: 'Djibouti', flag: '🇩🇯' },
  { name: 'Dominica', flag: '🇩🇲' },
  { name: 'Dominican Republic', flag: '🇩🇴' },
  { name: 'Ecuador', flag: '🇪🇨' },
  { name: 'Egypt', flag: '🇪🇬' },
  { name: 'El Salvador', flag: '🇸🇻' },
  { name: 'Equatorial Guinea', flag: '🇬🇶' },
  { name: 'Eritrea', flag: '🇪🇷' },
  { name: 'Estonia', flag: '🇪🇪' },
  { name: 'Eswatini', flag: '🇸🇿' },
  { name: 'Ethiopia', flag: '🇪🇹' },
  { name: 'Fiji', flag: '🇫🇯' },
  { name: 'Finland', flag: '🇫🇮' },
  { name: 'France', flag: '🇫🇷' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'Gambia', flag: '🇬🇲' },
  { name: 'Georgia', flag: '🇬🇪' },
  { name: 'Germany', flag: '🇩🇪' },
  { name: 'Ghana', flag: '🇬🇭' },
  { name: 'Greece', flag: '🇬🇷' },
  { name: 'Grenada', flag: '🇬🇩' },
  { name: 'Guatemala', flag: '🇬🇹' },
  { name: 'Guinea', flag: '🇬🇳' },
  { name: 'Guinea-Bissau', flag: '🇬🇼' },
  { name: 'Guyana', flag: '🇬🇾' },
  { name: 'Haiti', flag: '🇭🇹' },
  { name: 'Honduras', flag: '🇭🇳' },
  { name: 'Hungary', flag: '🇭🇺' },
  { name: 'Iceland', flag: '🇮🇸' },
  { name: 'India', flag: '🇮🇳' },
  { name: 'Indonesia', flag: '🇮🇩' },
  { name: 'Iran', flag: '🇮🇷' },
  { name: 'Iraq', flag: '🇮🇶' },
  { name: 'Ireland', flag: '🇮🇪' },
  { name: 'Israel', flag: '🇮🇱' },
  { name: 'Italy', flag: '🇮🇹' },
  { name: 'Ivory Coast', flag: '🇨🇮' },
  { name: 'Jamaica', flag: '🇯🇲' },
  { name: 'Japan', flag: '🇯🇵' },
  { name: 'Jordan', flag: '🇯🇴' },
  { name: 'Kazakhstan', flag: '🇰🇿' },
  { name: 'Kenya', flag: '🇰🇪' },
  { name: 'Kiribati', flag: '🇰🇮' },
  { name: 'Kuwait', flag: '🇰🇼' },
  { name: 'Kyrgyzstan', flag: '🇰🇬' },
  { name: 'Laos', flag: '🇱🇦' },
  { name: 'Latvia', flag: '🇱🇻' },
  { name: 'Lebanon', flag: '🇱🇧' },
  { name: 'Lesotho', flag: '🇱🇸' },
  { name: 'Liberia', flag: '🇱🇷' },
  { name: 'Libya', flag: '🇱🇾' },
  { name: 'Liechtenstein', flag: '🇱🇮' },
  { name: 'Lithuania', flag: '🇱🇹' },
  { name: 'Luxembourg', flag: '🇱🇺' },
  { name: 'Madagascar', flag: '🇲🇬' },
  { name: 'Malawi', flag: '🇲🇼' },
  { name: 'Malaysia', flag: '🇲🇾' },
  { name: 'Maldives', flag: '🇲🇻' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Malta', flag: '🇲🇹' },
  { name: 'Marshall Islands', flag: '🇲🇭' },
  { name: 'Mauritania', flag: '🇲🇷' },
  { name: 'Mauritius', flag: '🇲🇺' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'Micronesia', flag: '🇫🇲' },
  { name: 'Moldova', flag: '🇲🇩' },
  { name: 'Monaco', flag: '🇲🇨' },
  { name: 'Mongolia', flag: '🇲🇳' },
  { name: 'Montenegro', flag: '🇲🇪' },
  { name: 'Morocco', flag: '🇲🇦' },
  { name: 'Mozambique', flag: '🇲🇿' },
  { name: 'Myanmar', flag: '🇲🇲' },
  { name: 'Namibia', flag: '🇳🇦' },
  { name: 'Nauru', flag: '🇳🇷' },
  { name: 'Nepal', flag: '🇳🇵' },
  { name: 'Netherlands', flag: '🇳🇱' },
  { name: 'New Zealand', flag: '🇳🇿' },
  { name: 'Nicaragua', flag: '🇳🇮' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Nigeria', flag: '🇳🇬' },
  { name: 'North Korea', flag: '🇰🇵' },
  { name: 'North Macedonia', flag: '🇲🇰' },
  { name: 'Norway', flag: '🇳🇴' },
  { name: 'Oman', flag: '🇴🇲' },
  { name: 'Pakistan', flag: '🇵🇰' },
  { name: 'Palau', flag: '🇵🇼' },
  { name: 'Palestine', flag: '🇵🇸' },
  { name: 'Panama', flag: '🇵🇦' },
  { name: 'Papua New Guinea', flag: '🇵🇬' },
  { name: 'Paraguay', flag: '🇵🇾' },
  { name: 'Peru', flag: '🇵🇪' },
  { name: 'Philippines', flag: '🇵🇭' },
  { name: 'Poland', flag: '🇵🇱' },
  { name: 'Portugal', flag: '🇵🇹' },
  { name: 'Qatar', flag: '🇶🇦' },
  { name: 'Romania', flag: '🇷🇴' },
  { name: 'Russia', flag: '🇷🇺' },
  { name: 'Rwanda', flag: '🇷🇼' },
  { name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { name: 'Saint Lucia', flag: '🇱🇨' },
  { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { name: 'Samoa', flag: '🇼🇸' },
  { name: 'San Marino', flag: '🇸🇲' },
  { name: 'Sao Tome and Principe', flag: '🇸🇹' },
  { name: 'Saudi Arabia', flag: '🇸🇦' },
  { name: 'Senegal', flag: '🇸🇳' },
  { name: 'Serbia', flag: '🇷🇸' },
  { name: 'Seychelles', flag: '🇸🇨' },
  { name: 'Sierra Leone', flag: '🇸🇱' },
  { name: 'Singapore', flag: '🇸🇬' },
  { name: 'Slovakia', flag: '🇸🇰' },
  { name: 'Slovenia', flag: '🇸🇮' },
  { name: 'Solomon Islands', flag: '🇸🇧' },
  { name: 'Somalia', flag: '🇸🇴' },
  { name: 'South Africa', flag: '🇿🇦' },
  { name: 'South Korea', flag: '🇰🇷' },
  { name: 'South Sudan', flag: '🇸🇸' },
  { name: 'Spain', flag: '🇪🇸' },
  { name: 'Sri Lanka', flag: '🇱🇰' },
  { name: 'Sudan', flag: '🇸🇩' },
  { name: 'Suriname', flag: '🇸🇷' },
  { name: 'Sweden', flag: '🇸🇪' },
  { name: 'Switzerland', flag: '🇨🇭' },
  { name: 'Syria', flag: '🇸🇾' },
  { name: 'Taiwan', flag: '🇹🇼' },
  { name: 'Tajikistan', flag: '🇹🇯' },
  { name: 'Tanzania', flag: '🇹🇿' },
  { name: 'Thailand', flag: '🇹🇭' },
  { name: 'Timor-Leste', flag: '🇹🇱' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Tonga', flag: '🇹🇴' },
  { name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { name: 'Tunisia', flag: '🇹🇳' },
  { name: 'Turkey', flag: '🇹🇷' },
  { name: 'Turkmenistan', flag: '🇹🇲' },
  { name: 'Tuvalu', flag: '🇹🇻' },
  { name: 'Uganda', flag: '🇺🇬' },
  { name: 'Ukraine', flag: '🇺🇦' },
  { name: 'UAE', flag: '🇦🇪' },
  { name: 'UK', flag: '🇬🇧' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Uruguay', flag: '🇺🇾' },
  { name: 'Uzbekistan', flag: '🇺🇿' },
  { name: 'Vanuatu', flag: '🇻🇺' },
  { name: 'Vatican City', flag: '🇻🇦' },
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

export default function Auth() {
  const navigate = useNavigate();
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

  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return ALL_COUNTRIES;
    const search = countrySearch.toLowerCase();
    return ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(search));
  }, [countrySearch]);

  const selectedCountryFlag = ALL_COUNTRIES.find(c => c.name === country)?.flag || '🌍';

  // Password validation
  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const isPasswordValid = passwordChecks.minLength && passwordChecks.hasNumber && passwordChecks.hasSpecial;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !isPasswordValid) {
      toast.error('Please create a stronger password');
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back to Zenpeace!');
        navigate('/');
      } else {
        if (!username.trim()) {
          toast.error('Please enter a username');
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { name: username, country, age_group: ageGroup, device_type: deviceType }
          }
        });
        
        if (error) throw error;

        // Create profile with country, age_group and device_type
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: username.trim(),
            country,
            age_group: ageGroup
          });
          // Store device preference
          localStorage.setItem('zenpeace_device_type', deviceType);
        }

        toast.success('Welcome to Zenpeace! Account created.');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.message?.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden relative">
      {/* Colorful Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-pink-500/15 to-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-br from-green-500/10 to-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Card className="w-full max-w-lg glass-card border-border shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center mb-2 shadow-xl animate-pulse">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-black">
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {isLogin ? 'Welcome to Zenpeace' : 'Join Zenpeace'}
            </span>
          </CardTitle>
          <CardDescription className="text-sm">
            {isLogin ? 'Login to continue your peaceful journey' : 'Create your account and find your peace'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="username" className="flex items-center gap-2 text-sm font-medium">
                  <span>👤</span> Username
                </Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-card border-border h-10"
                  required={!isLogin}
                />
                <p className="text-[10px] text-muted-foreground">This will be visible to other users</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium">
                <span>📧</span> Email or Phone Number
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com or +977 98..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-card border-border h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium">
                <span>🔒</span> Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-card border-border pr-10 h-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              
              {/* Password Requirements - Only show for signup */}
              {!isLogin && password.length > 0 && (
                <div className="mt-2 p-3 rounded-lg bg-muted/30 space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" /> Password requirements:
                  </p>
                  <div className="grid grid-cols-1 gap-1">
                    <div className={`flex items-center gap-2 text-[11px] ${passwordChecks.minLength ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordChecks.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] ${passwordChecks.hasNumber ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordChecks.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      At least one number (0-9)
                    </div>
                    <div className={`flex items-center gap-2 text-[11px] ${passwordChecks.hasSpecial ? 'text-green-500' : 'text-muted-foreground'}`}>
                      {passwordChecks.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      At least one special character (!@#$%...)
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <>
                {/* Age Group */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="w-4 h-4 text-primary" /> Select Age Group
                  </Label>
                  <Select value={ageGroup} onValueChange={setAgeGroup}>
                    <SelectTrigger className="glass-card border-border h-10">
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border">
                      {AGE_GROUPS.map((ag) => (
                        <SelectItem key={ag.value} value={ag.value}>{ag.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country with search */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="w-4 h-4 text-primary" /> Select Your Country
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="glass-card border-border pl-9 h-9 text-sm mb-1.5"
                    />
                  </div>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="glass-card border-border h-10">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{selectedCountryFlag}</span>
                          <span>{country}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="glass-card border-border max-h-52">
                      {filteredCountries.map((c) => (
                        <SelectItem key={c.name} value={c.name}>
                          <span className="flex items-center gap-2">
                            <span className="text-lg">{c.flag}</span>
                            <span>{c.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Used to show regional content and connect with nearby users</p>
                </div>

                {/* Device Type */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Laptop className="w-4 h-4 text-primary" /> Primary Device
                  </Label>
                  <RadioGroup value={deviceType} onValueChange={(v) => setDeviceType(v as 'mobile' | 'tablet' | 'desktop')} className="grid grid-cols-3 gap-2">
                    <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${deviceType === 'mobile' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="mobile" className="sr-only" />
                      <Smartphone className="w-5 h-5" />
                      <span className="text-xs">Mobile</span>
                    </label>
                    <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${deviceType === 'tablet' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="tablet" className="sr-only" />
                      <Tablet className="w-5 h-5" />
                      <span className="text-xs">Tablet</span>
                    </label>
                    <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-all ${deviceType === 'desktop' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                      <RadioGroupItem value="desktop" className="sr-only" />
                      <Laptop className="w-5 h-5" />
                      <span className="text-xs">Desktop</span>
                    </label>
                  </RadioGroup>
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary via-primary/90 to-purple-600 hover:from-primary/90 hover:to-purple-500 shadow-lg h-11 text-base font-semibold"
              disabled={loading || (!isLogin && !isPasswordValid)}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Please wait...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isLogin ? 'Sign In' : 'Create Account'}
                </span>
              )}
            </Button>

            <div className="text-center pt-4 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline text-sm font-medium"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}