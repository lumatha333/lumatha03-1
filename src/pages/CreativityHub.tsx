import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, Quote, Lightbulb, Image, Palette, FileText, 
  Video, Type, Layout, Wand2, Download, Copy, Share2,
  RefreshCw, Star, Heart, ArrowRight, PenLine
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

// Creative tools configuration
const creativeTools = [
  { 
    id: 'quotes', 
    name: 'Quote Generator', 
    icon: Quote, 
    color: 'from-pink-500 to-rose-500',
    description: 'Generate inspiring quotes'
  },
  { 
    id: 'ideas', 
    name: 'Idea Maker', 
    icon: Lightbulb, 
    color: 'from-amber-500 to-orange-500',
    description: 'Spark new creative ideas'
  },
  { 
    id: 'moodboard', 
    name: 'Moodboard', 
    icon: Palette, 
    color: 'from-violet-500 to-purple-500',
    description: 'Create visual moodboards'
  },
  { 
    id: 'templates', 
    name: 'Templates', 
    icon: Layout, 
    color: 'from-blue-500 to-cyan-500',
    description: 'Ready-to-use templates'
  },
  { 
    id: 'captions', 
    name: 'Caption Writer', 
    icon: Type, 
    color: 'from-green-500 to-emerald-500',
    description: 'Write catchy captions'
  },
  { 
    id: 'stories', 
    name: 'Story Builder', 
    icon: FileText, 
    color: 'from-indigo-500 to-blue-500',
    description: 'Build engaging stories'
  },
];

// Sample quotes for the generator
const sampleQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Wisdom" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "Creativity" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Success" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Self" },
];

// Sample templates
const templates = [
  { id: 1, name: 'Social Post', category: 'Social', preview: '📱' },
  { id: 2, name: 'Quote Card', category: 'Quote', preview: '💭' },
  { id: 3, name: 'Story Template', category: 'Story', preview: '📖' },
  { id: 4, name: 'Announcement', category: 'News', preview: '📢' },
  { id: 5, name: 'Celebration', category: 'Event', preview: '🎉' },
  { id: 6, name: 'Motivation', category: 'Inspire', preview: '💪' },
];

export default function CreativityHub() {
  const { user } = useAuth();
  const [activeTool, setActiveTool] = useState('quotes');
  const [generatedQuote, setGeneratedQuote] = useState(sampleQuotes[0]);
  const [customText, setCustomText] = useState('');
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);

  const generateQuote = () => {
    const randomQuote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    setGeneratedQuote(randomQuote);
    toast.success('New quote generated!');
  };

  const generateIdeas = () => {
    if (!ideaPrompt.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    const ideas = [
      `Create a visual story about ${ideaPrompt}`,
      `Write a poem inspired by ${ideaPrompt}`,
      `Design a moodboard featuring ${ideaPrompt}`,
      `Capture photos representing ${ideaPrompt}`,
      `Make a video documentary about ${ideaPrompt}`,
    ];
    setGeneratedIdeas(ideas);
    toast.success('Ideas generated!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const saveItem = (item: any) => {
    setSavedItems([...savedItems, item]);
    toast.success('Saved to your collection!');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse-glow">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Creativity Hub</h1>
            <p className="text-sm text-muted-foreground">Unleash your creative potential</p>
          </div>
        </div>
        <Button asChild className="btn-cosmic gap-2">
          <Link to="/create">
            <PenLine className="w-4 h-4" />
            Create Post
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{savedItems.length}</p>
            <p className="text-xs text-muted-foreground">Saved Items</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{templates.length}</p>
            <p className="text-xs text-muted-foreground">Templates</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{sampleQuotes.length}</p>
            <p className="text-xs text-muted-foreground">Quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Creative Tools Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {creativeTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "glass-card rounded-xl p-4 text-left transition-all hover-lift",
                isActive && "ring-2 ring-primary"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3",
                tool.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm">{tool.name}</h3>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </button>
          );
        })}
      </div>

      {/* Tool Content */}
      <Card className="glass-card">
        <CardContent className="p-6">
          {/* Quote Generator */}
          {activeTool === 'quotes' && (
            <div className="space-y-6">
              <div className="text-center">
                <Badge className="mb-4">{generatedQuote.category}</Badge>
                <blockquote className="text-xl md:text-2xl font-medium italic mb-4">
                  "{generatedQuote.text}"
                </blockquote>
                <p className="text-muted-foreground">— {generatedQuote.author}</p>
              </div>
              <div className="flex justify-center gap-3">
                <Button onClick={generateQuote} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </Button>
                <Button variant="outline" onClick={() => copyToClipboard(`"${generatedQuote.text}" — ${generatedQuote.author}`)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => saveItem(generatedQuote)}>
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Idea Maker */}
          {activeTool === 'ideas' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter a topic (e.g., nature, music, travel)"
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={generateIdeas} className="gap-2">
                  <Wand2 className="w-4 h-4" />
                  Generate
                </Button>
              </div>
              {generatedIdeas.length > 0 && (
                <div className="space-y-2">
                  {generatedIdeas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {i + 1}
                      </div>
                      <p className="flex-1 text-sm">{idea}</p>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(idea)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Moodboard */}
          {activeTool === 'moodboard' && (
            <div className="space-y-4">
              <p className="text-muted-foreground text-center">
                Create beautiful moodboards by combining colors, images, and text.
              </p>
              <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                {['🌅', '🌊', '🌸', '🌙', '🔥', '💜', '🌿', '✨', '🎨'].map((emoji, i) => (
                  <div key={i} className="aspect-square bg-muted rounded-xl flex items-center justify-center text-3xl hover:scale-105 transition-transform cursor-pointer">
                    {emoji}
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2">
                <Image className="w-4 h-4" />
                Add Your Images
              </Button>
            </div>
          )}

          {/* Templates */}
          {activeTool === 'templates' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((template) => (
                <div key={template.id} className="bg-muted/50 rounded-xl p-4 text-center hover:bg-muted transition-colors cursor-pointer">
                  <div className="text-4xl mb-2">{template.preview}</div>
                  <h4 className="font-medium text-sm">{template.name}</h4>
                  <Badge variant="outline" className="mt-1 text-xs">{template.category}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* Caption Writer */}
          {activeTool === 'captions' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Describe your post or image..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={4}
              />
              <Button className="w-full gap-2">
                <Wand2 className="w-4 h-4" />
                Generate Caption
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">😊 Friendly</Button>
                <Button variant="outline" size="sm">💼 Professional</Button>
                <Button variant="outline" size="sm">🎉 Exciting</Button>
                <Button variant="outline" size="sm">💭 Thoughtful</Button>
              </div>
            </div>
          )}

          {/* Story Builder */}
          {activeTool === 'stories' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Story Builder</h3>
              <p className="text-muted-foreground">
                Create engaging multi-part stories with text, images, and music.
              </p>
              <Button className="gap-2">
                <PenLine className="w-4 h-4" />
                Start Writing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Items */}
      {savedItems.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Saved Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedItems.map((item, i) => (
                <div key={i} className="p-3 bg-muted/50 rounded-xl text-sm">
                  "{item.text}" — {item.author}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
