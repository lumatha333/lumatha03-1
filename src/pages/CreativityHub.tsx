import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Quote, Lightbulb, Palette, Layout, Type, FileText, Wand2, Copy, Heart, RefreshCw, PenLine, Image } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const creativeTools = [
  { id: 'quotes', name: 'Quotes', icon: Quote, color: 'from-pink-500 to-rose-500' },
  { id: 'ideas', name: 'Ideas', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
  { id: 'moodboard', name: 'Moodboard', icon: Palette, color: 'from-violet-500 to-purple-500' },
  { id: 'templates', name: 'Templates', icon: Layout, color: 'from-blue-500 to-cyan-500' },
  { id: 'captions', name: 'Captions', icon: Type, color: 'from-green-500 to-emerald-500' },
  { id: 'stories', name: 'Stories', icon: FileText, color: 'from-indigo-500 to-blue-500' },
];

const sampleQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivation" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Wisdom" },
  { text: "Creativity is intelligence having fun.", author: "Albert Einstein", category: "Creativity" },
  { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Self" },
];

const templates = [
  { id: 1, name: 'Social Post', category: 'Social', preview: '📱' },
  { id: 2, name: 'Quote Card', category: 'Quote', preview: '💭' },
  { id: 3, name: 'Announcement', category: 'News', preview: '📢' },
  { id: 4, name: 'Celebration', category: 'Event', preview: '🎉' },
];

export default function CreativityHub() {
  const [activeTool, setActiveTool] = useState('quotes');
  const [generatedQuote, setGeneratedQuote] = useState(sampleQuotes[0]);
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [savedItems, setSavedItems] = useState<any[]>([]);

  const generateQuote = () => {
    const randomQuote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    setGeneratedQuote(randomQuote);
    toast.success('New quote!');
  };

  const generateIdeas = () => {
    if (!ideaPrompt.trim()) { toast.error('Enter a topic'); return; }
    const ideas = [
      `Create a visual story about ${ideaPrompt}`,
      `Write a poem inspired by ${ideaPrompt}`,
      `Design a moodboard featuring ${ideaPrompt}`,
      `Capture photos representing ${ideaPrompt}`,
    ];
    setGeneratedIdeas(ideas);
    toast.success('Ideas generated!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const saveItem = (item: any) => {
    setSavedItems([...savedItems, item]);
    toast.success('Saved!');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse-glow shrink-0">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold gradient-text">Creativity Hub</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Unleash your potential</p>
          </div>
        </div>
        <Button asChild size="sm" className="btn-cosmic gap-2 w-full sm:w-auto">
          <Link to="/create"><PenLine className="w-4 h-4" />Create Post</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-primary">{savedItems.length}</p>
            <p className="text-[10px] text-muted-foreground">Saved</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-primary">{templates.length}</p>
            <p className="text-[10px] text-muted-foreground">Templates</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-3 text-center">
            <p className="text-lg sm:text-xl font-bold text-primary">{sampleQuotes.length}</p>
            <p className="text-[10px] text-muted-foreground">Quotes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {creativeTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={cn(
                "glass-card rounded-xl p-2 sm:p-3 text-center transition-all",
                isActive && "ring-2 ring-primary"
              )}
            >
              <div className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mx-auto mb-1",
                tool.color
              )}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <p className="text-[10px] sm:text-xs font-medium truncate">{tool.name}</p>
            </button>
          );
        })}
      </div>

      {/* Tool Content */}
      <Card className="glass-card">
        <CardContent className="p-4">
          {activeTool === 'quotes' && (
            <div className="space-y-4 text-center">
              <Badge className="mb-2">{generatedQuote.category}</Badge>
              <blockquote className="text-base sm:text-lg font-medium italic">"{generatedQuote.text}"</blockquote>
              <p className="text-sm text-muted-foreground">— {generatedQuote.author}</p>
              <div className="flex justify-center gap-2 flex-wrap">
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
              {generatedIdeas.length > 0 && (
                <div className="space-y-2">
                  {generatedIdeas.map((idea, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
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
                  <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center text-2xl hover:scale-105 transition-transform cursor-pointer">{emoji}</div>
                ))}
              </div>
              <Button size="sm" className="gap-1"><Image className="w-3 h-3" />Add Images</Button>
            </div>
          )}

          {activeTool === 'templates' && (
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => (
                <div key={template.id} className="bg-muted/50 rounded-lg p-3 text-center hover:bg-muted transition-colors cursor-pointer">
                  <div className="text-2xl mb-1">{template.preview}</div>
                  <h4 className="text-xs font-medium">{template.name}</h4>
                  <Badge variant="outline" className="mt-1 text-[9px]">{template.category}</Badge>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'captions' && (
            <div className="space-y-3">
              <Textarea placeholder="Describe your post..." value={customText} onChange={(e) => setCustomText(e.target.value)} rows={3} />
              <Button size="sm" className="w-full gap-1"><Wand2 className="w-3 h-3" />Generate Caption</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">😊 Friendly</Button>
                <Button variant="outline" size="sm" className="text-xs">💼 Professional</Button>
                <Button variant="outline" size="sm" className="text-xs">🎉 Exciting</Button>
                <Button variant="outline" size="sm" className="text-xs">💭 Thoughtful</Button>
              </div>
            </div>
          )}

          {activeTool === 'stories' && (
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium">Story Builder</h3>
              <p className="text-xs text-muted-foreground">Create engaging multi-part stories</p>
              <Button size="sm" className="gap-1"><PenLine className="w-3 h-3" />Start Writing</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Items */}
      {savedItems.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">⭐ Saved ({savedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedItems.slice(0, 3).map((item, i) => (
              <div key={i} className="p-2 bg-muted/50 rounded-lg text-xs">"{item.text}" — {item.author}</div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
