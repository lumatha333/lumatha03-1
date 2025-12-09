import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Quote, Lightbulb, Palette, Layout, Type, FileText, Wand2, Copy, Heart, RefreshCw, PenLine, Image, Music, BookOpen, Zap, Trophy, Calendar, TrendingUp, Star, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Creative tools with detailed descriptions
const creativeTools = [
  { id: 'quotes', name: 'Quotes', icon: Quote, color: 'from-pink-500 to-rose-500', desc: 'Write your wisdom' },
  { id: 'ideas', name: 'Ideas', icon: Lightbulb, color: 'from-amber-500 to-orange-500', desc: 'Brain sparks' },
  { id: 'moodboard', name: 'Moodboards', icon: Palette, color: 'from-violet-500 to-purple-500', desc: 'Visual imagination' },
  { id: 'templates', name: 'Templates', icon: Layout, color: 'from-blue-500 to-cyan-500', desc: 'Ready-to-use styles' },
  { id: 'captions', name: 'Captions', icon: Type, color: 'from-green-500 to-emerald-500', desc: 'Short creative lines' },
  { id: 'stories', name: 'Stories', icon: FileText, color: 'from-indigo-500 to-blue-500', desc: 'Mini stories / memories' },
  { id: 'lyrics', name: 'Lyrics', icon: Music, color: 'from-fuchsia-500 to-pink-500', desc: 'Your music lines' },
  { id: 'notes', name: 'Notes', icon: BookOpen, color: 'from-teal-500 to-cyan-500', desc: 'Private creative notes' },
  { id: 'clips', name: 'Story Clips', icon: Image, color: 'from-orange-500 to-red-500', desc: 'Short video ideas' },
];

const sampleQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation", mood: "Inspired", saves: 19200 },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Wisdom", mood: "Thoughtful", saves: 15400 },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "Creativity", mood: "Playful", saves: 22100 },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Self", mood: "Confident", saves: 18700 },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams", mood: "Hopeful", saves: 21300 },
];

const templates = [
  { id: 1, name: 'Social Post', category: 'Social', preview: '📱' },
  { id: 2, name: 'Quote Card', category: 'Quote', preview: '💭' },
  { id: 3, name: 'Announcement', category: 'News', preview: '📢' },
  { id: 4, name: 'Celebration', category: 'Event', preview: '🎉' },
  { id: 5, name: 'Motivation', category: 'Inspire', preview: '🔥' },
  { id: 6, name: 'Story Template', category: 'Story', preview: '📖' },
];

const dailyChallenges = [
  "Write a quote about success",
  "Make a 2-line story",
  "Draw a moodboard for 2025",
  "Create a caption for nature photo",
  "Write a short poem about dreams"
];

const moodOptions = [
  { emoji: '😊', name: 'Happy' },
  { emoji: '😢', name: 'Sad' },
  { emoji: '🔥', name: 'Motivated' },
  { emoji: '💘', name: 'Romantic' },
  { emoji: '😴', name: 'Lazy' },
  { emoji: '🤔', name: 'Confused' },
];

const creatorLevels = [
  { name: 'Beginner', min: 0, max: 10, icon: '🌱' },
  { name: 'Explorer', min: 11, max: 30, icon: '🧭' },
  { name: 'Creator', min: 31, max: 60, icon: '✨' },
  { name: 'Master', min: 61, max: 100, icon: '🎯' },
  { name: 'Crown Genius', min: 101, max: Infinity, icon: '👑' },
];

export default function CreativityHub() {
  const [activeTab, setActiveTab] = useState('creations');
  const [activeTool, setActiveTool] = useState('quotes');
  const [generatedQuote, setGeneratedQuote] = useState(sampleQuotes[0]);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [weeklyCreations, setWeeklyCreations] = useState(12);
  const [creativityScore, setCreativityScore] = useState(87);
  const [dailyChallenge, setDailyChallenge] = useState(dailyChallenges[0]);

  useEffect(() => {
    // Rotate daily challenge
    const today = new Date().getDay();
    setDailyChallenge(dailyChallenges[today % dailyChallenges.length]);
  }, []);

  const generateQuote = () => {
    const randomQuote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    setGeneratedQuote(randomQuote);
    toast.success('✨ New quote!');
  };

  const generateIdeas = () => {
    if (!ideaPrompt.trim()) { toast.error('Enter a topic'); return; }
    const ideas = [
      `Create a visual story about ${ideaPrompt}`,
      `Write a poem inspired by ${ideaPrompt}`,
      `Design a moodboard featuring ${ideaPrompt}`,
      `Capture photos representing ${ideaPrompt}`,
      `Write lyrics about ${ideaPrompt}`,
    ];
    setGeneratedIdeas(ideas);
    setWeeklyCreations(prev => prev + 1);
    toast.success('💡 Ideas generated!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Copied!');
  };

  const saveItem = (item: any) => {
    setSavedItems([item, ...savedItems]);
    toast.success('❤️ Saved!');
  };

  const getCurrentLevel = () => {
    return creatorLevels.find(level => savedItems.length >= level.min && savedItems.length <= level.max) || creatorLevels[0];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = creatorLevels[creatorLevels.indexOf(currentLevel) + 1];
  const progress = nextLevel ? ((savedItems.length - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse-glow shrink-0">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">Creativity Hub</h1>
            <p className="text-xs text-muted-foreground">Unleash your creative potential</p>
          </div>
        </div>
        <Button asChild size="sm" className="btn-cosmic gap-2 w-full sm:w-auto">
          <Link to="/create"><PenLine className="w-4 h-4" />Create Post</Link>
        </Button>
      </div>

      {/* Sub-navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-3 h-auto p-1">
          <TabsTrigger value="creations" className="gap-1 text-xs py-2">
            <Sparkles className="w-3 h-3" />
            Your Creations
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1 text-xs py-2">
            <Layout className="w-3 h-3" />
            Templates Store
          </TabsTrigger>
          <TabsTrigger value="inspiration" className="gap-1 text-xs py-2">
            <Zap className="w-3 h-3" />
            Daily Inspiration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="creations" className="space-y-4 mt-4">
          {/* Enhanced Stats */}
          <div className="grid grid-cols-5 gap-2">
            <Card className="glass-card">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-primary">{weeklyCreations}</p>
                <p className="text-[9px] text-muted-foreground">Total Creations</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-primary">{savedItems.length}</p>
                <p className="text-[9px] text-muted-foreground">Saved</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-primary">{templates.length}</p>
                <p className="text-[9px] text-muted-foreground">Templates</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-orange-500">🔥 {creativityScore}</p>
                <p className="text-[9px] text-muted-foreground">Score</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-2 text-center">
                <p className="text-lg font-bold text-green-500">64%</p>
                <p className="text-[9px] text-muted-foreground">😊 Mood</p>
              </CardContent>
            </Card>
          </div>

          {/* Creative Level Progress */}
          <Card className="glass-card">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentLevel.icon}</span>
                  <span className="font-medium text-sm">{currentLevel.name}</span>
                </div>
                {nextLevel && (
                  <span className="text-xs text-muted-foreground">Next: {nextLevel.icon} {nextLevel.name}</span>
                )}
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-[10px] text-muted-foreground mt-1">{savedItems.length} creations</p>
            </CardContent>
          </Card>

          {/* Tools Grid with descriptions */}
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
            {creativeTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    "glass-card rounded-xl p-2 text-center transition-all hover:scale-105",
                    isActive && "ring-2 ring-primary shadow-lg"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-1",
                    tool.color
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-medium truncate">{tool.name}</p>
                  <p className="text-[8px] text-muted-foreground truncate hidden sm:block">{tool.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Tool Content */}
          <Card className="glass-card overflow-hidden">
            <CardContent className="p-4">
              {activeTool === 'quotes' && (
                <div className="space-y-4 text-center">
                  <Badge className="mb-2" variant="secondary">{generatedQuote.category}</Badge>
                  <div className={cn(
                    "p-6 rounded-xl bg-gradient-to-br",
                    generatedQuote.mood === 'Inspired' ? 'from-orange-500/20 to-red-500/20' :
                    generatedQuote.mood === 'Thoughtful' ? 'from-blue-500/20 to-indigo-500/20' :
                    generatedQuote.mood === 'Playful' ? 'from-pink-500/20 to-purple-500/20' :
                    'from-green-500/20 to-teal-500/20'
                  )}>
                    <blockquote className="text-lg sm:text-xl font-medium italic">"{generatedQuote.text}"</blockquote>
                    <p className="text-sm text-muted-foreground mt-2">— {generatedQuote.author}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>Saved by {(generatedQuote.saves / 1000).toFixed(1)}K people</span>
                    <Badge variant="outline" className="text-xs">✨ {generatedQuote.mood}</Badge>
                  </div>
                  
                  {/* AI Tools */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Wand2 className="w-3 h-3" /> Generate Similar
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Lightbulb className="w-3 h-3" /> Explain Meaning
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1">
                      <Image className="w-3 h-3" /> Convert to Post
                    </Button>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex justify-center gap-2 flex-wrap pt-2">
                    <Button size="sm" onClick={generateQuote} className="gap-1"><RefreshCw className="w-3 h-3" />New</Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(`"${generatedQuote.text}" — ${generatedQuote.author}`)}><Copy className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => saveItem(generatedQuote)}><Heart className="w-3 h-3" /></Button>
                  </div>
                </div>
              )}

              {activeTool === 'ideas' && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Enter a topic..." value={ideaPrompt} onChange={(e) => setIdeaPrompt(e.target.value)} className="flex-1" />
                    <Button size="sm" onClick={generateIdeas} className="gap-1 shrink-0"><Wand2 className="w-3 h-3" />Generate</Button>
                  </div>
                  
                  {/* Mood Selection */}
                  <div className="flex gap-2 flex-wrap">
                    {moodOptions.map((mood) => (
                      <Button 
                        key={mood.name}
                        size="sm" 
                        variant={selectedMood === mood.name ? "default" : "outline"}
                        onClick={() => setSelectedMood(mood.name)}
                        className="text-xs"
                      >
                        {mood.emoji} {mood.name}
                      </Button>
                    ))}
                  </div>
                  
                  {generatedIdeas.length > 0 && (
                    <div className="space-y-2">
                      {generatedIdeas.map((idea, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">{i + 1}</div>
                          <p className="flex-1 text-xs sm:text-sm">{idea}</p>
                          <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copyToClipboard(idea)}><Copy className="w-3 h-3" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTool === 'moodboard' && (
                <div className="space-y-3 text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground">Create visual moodboards</p>
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['🌅', '🌊', '🌸', '🌙', '🔥', '💜', '🌿', '✨', '🎨'].map((emoji, i) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer shadow-sm">{emoji}</div>
                    ))}
                  </div>
                  <Button size="sm" className="gap-1"><Image className="w-3 h-3" />Add Images</Button>
                </div>
              )}

              {(activeTool === 'templates' || activeTool === 'captions' || activeTool === 'stories' || activeTool === 'lyrics' || activeTool === 'notes' || activeTool === 'clips') && (
                <div className="space-y-3">
                  <Textarea placeholder={`Write your ${activeTool}...`} value={customText} onChange={(e) => setCustomText(e.target.value)} rows={4} />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="text-xs">😊 Friendly</Button>
                    <Button size="sm" variant="outline" className="text-xs">💼 Professional</Button>
                    <Button size="sm" variant="outline" className="text-xs">🎉 Exciting</Button>
                    <Button size="sm" variant="outline" className="text-xs">💭 Thoughtful</Button>
                  </div>
                  <Button size="sm" className="w-full gap-1"><Wand2 className="w-3 h-3" />Generate {activeTool}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creative Timeline */}
          {savedItems.length > 0 && (
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Your Creative Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {savedItems.slice(0, 3).map((item, i) => (
                  <div key={i} className="p-2 bg-muted/50 rounded-lg text-xs flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="flex-1 truncate">"{item.text}"</span>
                    <span className="text-muted-foreground shrink-0">— {item.author}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.map((template) => (
              <Card key={template.id} className="glass-card hover-lift cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl mb-2">{template.preview}</div>
                  <h4 className="text-sm font-medium">{template.name}</h4>
                  <Badge variant="outline" className="mt-1 text-[9px]">{template.category}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inspiration" className="space-y-4 mt-4">
          {/* Daily Challenge */}
          <Card className="glass-card border-2 border-primary/30 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold">Daily Creative Challenge</h3>
              </div>
              <p className="text-sm bg-background/50 rounded-lg p-3 italic">"{dailyChallenge}"</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1">Accept Challenge</Button>
                <Button size="sm" variant="outline">Skip</Button>
              </div>
            </div>
          </Card>

          {/* Inspiration Quotes */}
          <div className="space-y-2">
            {sampleQuotes.map((quote, i) => (
              <Card key={i} className="glass-card hover-lift">
                <CardContent className="p-3">
                  <p className="text-sm italic">"{quote.text}"</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">— {quote.author}</span>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(quote.text)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveItem(quote)}>
                        <Heart className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
