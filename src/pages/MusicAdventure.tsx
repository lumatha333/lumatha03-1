import { useState, useEffect, useCallback, useMemo, useDeferredValue, useTransition, lazy, Suspense, useRef, memo } from 'react';
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy, Target, MapPin, Plane, ChevronRight, Sparkles,
  Search, Globe, Heart, MessageCircle, Bookmark, Plus,
  UserCircle2, Compass, Map as MapIcon, Share2, MoreVertical,
  Flag, UserPlus, EyeOff, Copy, Pencil, Trash2, MinusCircle, ChevronUp,
 Edit3, Crown, Zap, Smile, GraduationCap, ChevronDown, LayoutGrid, Lock, Settings2,
 Clock, CheckCircle2, MoreHorizontal, ListTodo, Notebook, Bell, BarChart3, Home,
 Cpu, FileText, Play, ShoppingBag, GripHorizontal, RotateCcw, Info, MoreVertical as Dots4,
 ArrowLeft, Camera, Send, X, Image as ImageIcon, UserCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, Reorder } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { AdventureRanks } from '@/components/adventure/AdventureRanks';
import { TravelStoriesFeed } from '@/components/adventure/TravelStoriesFeed';
import { PlaceDetailSheet } from '@/components/adventure/PlaceDetailSheet';
import { StoryCreationSheet } from '@/components/adventure/StoryCreationSheet';
import { StoryReader } from '@/components/adventure/StoryReader';      
import { CommentsDialog } from '@/components/CommentsDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SYSTEM_CHALLENGES } from '@/data/adventureChallenges';
import { NotesSection } from './NotesSection';

const FALLBACK_PLACE_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=800';

type LayoutType = 'layout1' | 'layout2' | 'layout3';

interface Subsection {
  id: string;
  label: string;
  icon: any;
}

interface MainCategory {
  id: string;
  label: string;
  icon: any;
  subsections: Subsection[];
}

const LAYOUTS: Record<LayoutType, MainCategory[]> = {
  layout1: [
    {
      id: 'default',
      label: 'Lumatha',
      icon: Sparkles,
      subsections: [
        { id: 'ranks', label: 'Quests', icon: Trophy },
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'feed', label: 'Stories', icon: MapIcon },
        { id: 'docs', label: 'Docs', icon: FileText },
        { id: 'marketplace', label: 'Market', icon: ShoppingBag },
        { id: 'profile', label: 'Profile', icon: UserCircle2 },
        { id: 'private_zone', label: 'Private', icon: Lock },
      ]
    }
  ],
  layout2: [
    {
      id: 'private',
      label: 'Private',
      icon: Lock,
      subsections: [
        { id: 'private_zone', label: 'Private Zone', icon: Lock },
        { id: 'todo', label: 'To-do', icon: ListTodo },
        { id: 'notes', label: 'Notes', icon: Notebook },
        { id: 'quests', label: 'Quests', icon: Target },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
        { id: 'funpun', label: 'FunPun', icon: Sparkles },
      ]
    },
    {
      id: 'neutral',
      label: 'Neutral',
      icon: Zap,
      subsections: [
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'connect', label: 'Connect', icon: UserPlus },
        { id: 'notify', label: 'Notify', icon: Bell },
        { id: 'stats', label: 'Stats', icon: BarChart3 },
        { id: 'ranking', label: 'Ranking', icon: Crown },
      ]
    },
    {
      id: 'public',
      label: 'Public',
      icon: Globe,
      subsections: [
        { id: 'feed', label: 'Feed', icon: Home },
        { id: 'docs', label: 'Docs', icon: FileText },
        { id: 'stories', label: 'Stories', icon: Play },
        { id: 'marketplace', label: 'Market', icon: ShoppingBag },
        { id: 'profile', label: 'Profile', icon: UserCircle2 },
      ]
    }
  ],
  layout3: [
    {
      id: 'social',
      label: 'Social',
      icon: UserPlus,
      subsections: [
        { id: 'feed', label: 'Feed', icon: Home },
        { id: 'quests', label: 'Quest', icon: Target },
        { id: 'explore', label: 'Explore', icon: Compass },
        { id: 'connect', label: 'Connect', icon: UserPlus },
        { id: 'marketplace', label: 'Market', icon: ShoppingBag },
        { id: 'profile', label: 'Profile', icon: UserCircle2 },
      ]
    },
    {
      id: 'education',
      label: 'Education',
      icon: GraduationCap,
      subsections: [
        { id: 'private_zone', label: 'Private Zone', icon: Lock },
        { id: 'todo', label: 'To-do', icon: ListTodo },
        { id: 'notes', label: 'Notes', icon: Notebook },
        { id: 'docs', label: 'Docs', icon: FileText },
        { id: 'messages', label: 'Messages', icon: MessageCircle },
      ]
    },
    {
      id: 'neutral',
      label: 'Neutral',
      icon: Zap,
      subsections: [
        { id: 'stories', label: 'Stories', icon: Play },
        { id: 'funpun', label: 'FunPun', icon: Sparkles },
        { id: 'notify', label: 'Notify', icon: Bell },
        { id: 'stats', label: 'Stats', icon: BarChart3 },
        { id: 'ranking', label: 'Ranking', icon: Crown },
      ]
    }
  ]
};

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// --- New Components for Chat, Docs, Profile ---

function MessagesSection() {
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('chat_messages_v1');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Hey there! Ready for the next adventure? 🏔️', sender: 'ai', timestamp: Date.now() - 3600000 },
      { id: '2', text: 'I found a great spot in the Himalayas!', sender: 'user', timestamp: Date.now() - 1800000 },
    ];
  });
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, []);

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('chat_messages_v1', JSON.stringify(messages));
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() && !capturedImage) return;
    const newMsg = {
      id: Date.now().toString(),
      text: input,
      image: capturedImage,
      viewOnce: !!capturedImage,
      sender: 'user',
      timestamp: Date.now()
    };
    setMessages([...messages, newMsg]);
    setInput('');
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const captureMoment = () => {
    // Simulate camera capture
    setCapturedImage('https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=800');
    setIsCapturing(true);
  };

  return (
    <div className="flex flex-col h-[70vh] bg-slate-950/50 rounded-[32px] border border-white/5 overflow-hidden shadow-2xl relative">
      {/* Chat Header with Capture Button */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8 border border-primary/20">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Adventure Guide</h3>
            <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={captureMoment}
          className="h-9 w-9 rounded-xl bg-white/5 hover:bg-primary/20 text-slate-400 hover:text-primary transition-all p-0"
        >
          <Camera className="w-5 h-5" />
        </Button>
      </div>

      {/* Message List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={cx("flex", m.sender === 'user' ? "justify-end" : "justify-start")}>
            <div className={cx(
              "max-w-[80%] rounded-2xl p-3 text-sm relative group",
              m.sender === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white/5 text-slate-200 rounded-tl-none border border-white/5"
            )}>
              {m.image && (
                <div className="mb-2 relative rounded-xl overflow-hidden aspect-video">
                  <img src={m.image} alt="Moment" className={cx("w-full h-full object-cover", m.viewed ? "blur-2xl grayscale" : "")} />
                  {m.viewOnce && !m.viewed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="text-white font-black text-[10px] uppercase tracking-widest" onClick={() => {
                        setMessages(prev => prev.map(msg => msg.id === m.id ? { ...msg, viewed: true } : msg));
                        toast.success('Moment viewed');
                      }}>Tap to View Once</Button>
                    </div>
                  )}
                  {m.viewed && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EyeOff className="w-8 h-8 text-white/20" />
                    </div>
                  )}
                </div>
              )}
              <p className={cx("leading-relaxed", m.viewed && "italic opacity-50")}>{m.viewed ? "Moment expired" : m.text}</p>
              <span className="text-[8px] opacity-40 mt-1 block text-right font-bold tracking-widest">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900/40 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-1 border border-white/5 focus-within:border-primary/30 transition-all">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="border-0 bg-transparent focus-visible:ring-0 text-sm h-10"
          />
          <Button 
            size="sm" 
            onClick={handleSend}
            className="h-8 w-8 rounded-xl bg-primary hover:scale-105 active:scale-95 transition-all p-0 shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocsSection() {
  const docs = [
    { title: 'Adventure Guide v1', category: 'Guides', date: 'Today' },
    { title: 'Packing Checklist', category: 'Travel', date: 'Yesterday' },
    { title: 'Himalayan Routes', category: 'Maps', date: 'Apr 12' },
    { title: 'Visa Requirements', category: 'Official', date: 'Apr 10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-wider">Documents</h2>
        <Button variant="outline" className="h-9 rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest px-5">Upload New</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -2 }}
            className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-sm truncate uppercase tracking-wider">{doc.title}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase">
                <span>{doc.category}</span>
                <span>•</span>
                <span>{doc.date}</span>
              </div>
            </div>
            <Dots4 className="w-4 h-4 text-slate-600" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProfileSection() {
  const stats = [
    { label: 'Quests', value: '24', icon: Trophy, color: 'text-orange-400' },
    { label: 'Stories', value: '12', icon: MapIcon, color: 'text-sky-400' },
    { label: 'Followers', value: '1.2k', icon: UserPlus, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-primary/20 p-1">
            <AvatarImage src="https://github.com/shadcn.png" className="rounded-full" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full border-4 border-slate-950 flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest">Adventure Explorer</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Level 42 Trailblazer</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 p-4 rounded-3xl text-center space-y-1">
            <s.icon className={cx("w-5 h-5 mx-auto mb-2", s.color)} />
            <div className="text-lg font-black text-white">{s.value}</div>
            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Achievements</h3>
        <div className="grid grid-cols-1 gap-3">
          {['Mountain Goat', 'Ocean Diver', 'City Slicker'].map((badge, i) => (
            <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-[24px] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-wider">{badge}</span>
              </div>
              <Badge className="bg-primary/20 text-primary border-0 text-[8px] font-black uppercase">Earned</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onStart }: { challenge: any, onStart: () => void }) {
  const difficulty = challenge.duration === 'daily' ? 'Easy' : challenge.duration === 'weekly' ? 'Hard' : 'Epic';
  const diffColor = difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : difficulty === 'Hard' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400';
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/40 border border-white/5 rounded-[24px] p-5 space-y-4 transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {challenge.categoryIcon || '🎯'}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={cx("border-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5", diffColor)}>
            {difficulty}
          </Badge>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase">
            <Clock className="w-3 h-3" />
            {challenge.duration}
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5">
        <h3 className="text-white font-black text-sm uppercase tracking-wider line-clamp-2 leading-tight">
          {challenge.title}
        </h3>
        <p className="text-xs text-slate-500 font-medium line-clamp-2">
          {challenge.description}
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-red-400 transition-colors">
            <Heart className="w-4 h-4" />
          </button>
          <button className="text-slate-500 hover:text-sky-400 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        <Button 
          onClick={onStart}
          className="h-9 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-md shadow-black/20 hover:scale-105 active:scale-95 transition-all"
        >
          Start Quest
        </Button>
      </div>
    </motion.div>
  );
}

export default function MusicAdventure() {
  const { user, profile } = useAuth();
  
  // Persistence-based State
  const [currentLayoutId, setCurrentLayoutId] = useState<LayoutType>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music_adv_layout_v2') : null;
    return (saved as LayoutType) || 'layout1';
  });

  const [activeMainId, setActiveMainId] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music_adv_active_main') : null;
    const layout = LAYOUTS[currentLayoutId];
    if (saved && layout.find(m => m.id === saved)) return saved;
    return layout[0].id;
  });

  const [activeSubId, setActiveSubId] = useState<string>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music_adv_active_sub') : null;
    const main = LAYOUTS[currentLayoutId].find(m => m.id === activeMainId);
    if (saved && main?.subsections.find(s => s.id === saved)) return saved;
    return main?.subsections[0].id || 'ranks';
  });

  const [customSections, setCustomSections] = useState<Record<string, Subsection[]>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music_adv_custom_order') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: Record<string, Subsection[]> = {};
        Object.values(LAYOUTS).flat().forEach(main => {
          if (parsed[main.id]) {
            merged[main.id] = parsed[main.id].map((s: any) => {
              const original = main.subsections.find(os => os.id === s.id);
              return { ...s, icon: original?.icon || Sparkles };
            });
          } else {
            merged[main.id] = main.subsections;
          }
        });
        return merged;
      } catch (e) { /* fallback */ }
    }
    const initial: Record<string, Subsection[]> = {};
    Object.values(LAYOUTS).flat().forEach(main => {
      initial[main.id] = main.subsections;
    });
    return initial;
  });

  // --- Auto-Reset Logic ---
  useEffect(() => {
    const lastReset = localStorage.getItem('adventure_last_reset');
    const now = new Date();
    const today = now.toDateString();
    
    if (lastReset !== today) {
      console.log('Performing daily reset...');
      // Reset Daily Quests/Tasks
      localStorage.setItem('adventure_last_reset', today);
      toast.info('Adventure tasks and quests have been reset for the new day!');
    }

    const lastWeeklyReset = localStorage.getItem('adventure_last_weekly_reset');
    const currentWeek = getWeekNumber(now);
    if (lastWeeklyReset !== currentWeek.toString()) {
      console.log('Performing weekly reset...');
      // Reset Weekly Quests
      localStorage.setItem('adventure_last_weekly_reset', currentWeek.toString());
    }

    const lastMonthlyReset = localStorage.getItem('adventure_last_monthly_reset');
    const currentMonth = now.getMonth().toString() + '-' + now.getFullYear().toString();
    if (lastMonthlyReset !== currentMonth) {
      console.log('Performing monthly reset...');
      // Reset Monthly Quests
      localStorage.setItem('adventure_last_monthly_reset', currentMonth);
    }
  }, []);

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  // Derived Values
  const currentLayout = LAYOUTS[currentLayoutId];
  const currentMain = currentLayout.find(m => m.id === activeMainId) || currentLayout[0];
  const currentSubsections = customSections[currentMain.id] || currentMain.subsections;

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('music_adv_layout_v2', currentLayoutId);
    localStorage.setItem('music_adv_active_main', activeMainId);
    localStorage.setItem('music_adv_active_sub', activeSubId);
    const orderToSave: any = {};
    Object.keys(customSections).forEach(key => {
      orderToSave[key] = customSections[key].map(({ icon, ...rest }) => rest);
    });
    localStorage.setItem('music_adv_custom_order', JSON.stringify(orderToSave));
  }, [currentLayoutId, activeMainId, activeSubId, customSections]);

  const handleMainChange = (id: string) => {
    setActiveMainId(id);
    const newMain = currentLayout.find(m => m.id === id);
    if (newMain) setActiveSubId(newMain.subsections[0].id);
  };

  const handleSubChange = (id: string) => {
    setActiveSubId(id);
  };

  const handleReorder = (newOrder: Subsection[]) => {
    setCustomSections(prev => ({ ...prev, [activeMainId]: newOrder }));
  };

  const handleReset = () => {
    const initial: Record<string, Subsection[]> = {};
    Object.values(LAYOUTS).flat().forEach(main => {
      initial[main.id] = main.subsections;
    });
    setCustomSections(initial);
    setCurrentLayoutId('layout1');
    setActiveMainId('default');
    setActiveSubId('ranks');
    toast.success('Layout reset to default');
  };

  // Shared Data/Loading state
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [travelStories, setTravelStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  // Modal/UI State
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showStoryCreate, setShowStoryCreate] = useState(false);
  const [travelReaderStoryId, setTravelReaderStoryId] = useState<string | null>(null);
  const [travelReaderOpen, setTravelReaderOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [footerVisible, setFooterVisible] = useState(true);
  const { scrollY } = useScroll();
  const [lastScrollY, setLastScrollY] = useState(0);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (selectedPlace || showStoryCreate || travelReaderOpen || commentsOpen) {
      setHeaderVisible(true);
      setFooterVisible(true);
      return;
    }
    const direction = latest > lastScrollY ? "down" : "up";
    if (latest > 50 && direction === "down") {
      setHeaderVisible(false);
      setFooterVisible(false);
    } else if (direction === "up") {
      setHeaderVisible(true);
      setFooterVisible(true);
    }
    setLastScrollY(latest);
  });

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data: p } = await supabase.from('adventure_places' as any).select('*').order('name');
        if (p) setPlaces(p);
        const { data: s } = await supabase.from('travel_stories' as any).select('*, profiles(*)').order('created_at', { ascending: false });
        if (s) setTravelStories(s);
      } finally {
        setLoading(false);
        setStoriesLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-200">
      {/* Top Banner (Stable Branding/Category Switcher) */}
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: headerVisible ? 0 : -120 }}
        className="fixed top-0 left-0 right-0 z-[100] w-full bg-[#0a0f1e]/90 backdrop-blur-2xl border-b border-white/5 shadow-2xl shadow-black/60 h-20"
      >
        <div className="flex items-center justify-between px-5 h-full max-w-7xl mx-auto gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            {currentLayoutId === 'layout1' && (
               <div className="flex flex-col -space-y-1">
                <span className="text-sm font-black text-white uppercase tracking-tighter">Lumatha</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.2em]">Music Adventure</span>
              </div>
            )}
          </div>

          {(currentLayoutId === 'layout2' || currentLayoutId === 'layout3') && (
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 justify-center">
              {currentLayout.map(main => (
                <button
                  key={main.id}
                  onClick={() => handleMainChange(main.id)}
                  className={cx(
                    "shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all",
                    activeMainId === main.id ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white/5 text-slate-500 border-white/5 hover:text-white"
                  )}
                >
                  {main.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all border border-white/5">
              <Search className="w-5 h-5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors outline-none border border-white/5">
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-white/10 rounded-[24px] p-2 shadow-2xl shadow-black">
                <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Navigation Layouts</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setCurrentLayoutId('layout1')} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5">
                  <LayoutGrid className="w-4 h-4 text-sky-400" /> <span className="font-bold text-xs uppercase tracking-widest text-white">Default 7-Section</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentLayoutId('layout2')} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5">
                  <Lock className="w-4 h-4 text-emerald-400" /> <span className="font-bold text-xs uppercase tracking-widest text-white">Private x Neutral x Public</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentLayoutId('layout3')} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5">
                  <GraduationCap className="w-4 h-4 text-violet-400" /> <span className="font-bold text-xs uppercase tracking-widest text-white">Social x Education x Neutral</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={handleReset} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5 text-red-400">
                  <RotateCcw className="w-4 h-4" /> <span className="font-bold text-xs uppercase tracking-widest">Reset Layout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-32">
        {/* Main Subsection Content (Independent Rendering) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeMainId}-${activeSubId}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {activeSubId === 'ranks' && (
              <div className="space-y-12">
                <AdventureRanks />
                <div className="px-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Active Quests</h2>
                    <Badge variant="outline" className="border-primary/30 text-primary text-[8px] font-black uppercase tracking-[0.2em] px-3">Auto-Reset: Daily</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {SYSTEM_CHALLENGES.slice(0, 24).map((c) => (
                      <ChallengeCard key={c.id} challenge={c} onStart={() => toast.success(`Quest "${c.title}" started!`)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSubId === 'explore' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {places.slice(0, 48).map((place) => (
                  <motion.div key={place.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedPlace(place)} className="group relative aspect-[4/5] overflow-hidden bg-slate-900 rounded-[24px] border border-white/5 cursor-pointer shadow-xl transition-all hover:scale-[1.02]">
                    <img src={place.image || FALLBACK_PLACE_IMAGE} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={place.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4"> 
                      <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">{place.country}</p>
                      <h3 className="text-white font-black text-xs uppercase tracking-wider line-clamp-1">{place.name}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {(activeSubId === 'feed' || activeSubId === 'stories') && (
              <div className="w-full max-w-[580px] mx-auto space-y-6">
                {travelStories.map((story) => (
                  <div key={story.id} className="bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden shadow-xl">
                    <div className="aspect-square relative w-full overflow-hidden">
                      <img src={story.photos?.[0] || FALLBACK_PLACE_IMAGE} className="w-full h-full object-cover" alt={story.title} />
                      <div className="absolute top-4 left-4"><Badge className="bg-primary border-0 font-black uppercase text-[10px]">{story.location}</Badge></div>
                    </div>
                    <div className="p-5 space-y-3">
                       <h3 className="text-lg font-black text-white leading-tight uppercase tracking-wider">{story.title}</h3>
                       <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{story.description}</p>
                       <div className="flex items-center justify-between pt-2">
                         <div className="flex items-center gap-4 text-slate-500"><Heart className="w-4 h-4" /><MessageCircle className="w-4 h-4" /><Bookmark className="w-4 h-4" /></div>
                         <Button variant="ghost" className="bg-white/5 text-[10px] font-black uppercase tracking-widest px-5 h-9 rounded-xl" onClick={() => { setTravelReaderStoryId(story.id); setTravelReaderOpen(true); }}>Read Story</Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSubId === 'todo' && (
              <div className="space-y-6 px-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-white uppercase tracking-wider">To-do List</h2>
                  <Button variant="outline" className="border-white/10 rounded-xl uppercase tracking-widest text-[10px] font-black h-9 px-4">Add Task</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-6 rounded-[24px] bg-slate-900/40 border border-white/5 flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-slate-700 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-black text-sm uppercase tracking-wider truncate">Adventure Task {i}</h3>
                        <p className="text-[10px] text-slate-500 font-medium">Auto-reset in 12h</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-0 text-[8px] font-black uppercase">Low</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSubId === 'notes' && <NotesSection />}
            
            {activeSubId === 'messages' && <MessagesSection />}
            
            {activeSubId === 'docs' && <DocsSection />}
            
            {activeSubId === 'profile' && <ProfileSection />}

            {/* General Sub-Section Placeholder */}
            {!['ranks', 'explore', 'feed', 'stories', 'todo', 'notes', 'messages', 'docs', 'profile'].includes(activeSubId) && (
               <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 rounded-[40px] bg-white/5 flex items-center justify-center text-3xl border border-white/5 shadow-2xl">
                  {(() => {
                    const iconObj = currentSubsections.find(s => s.id === activeSubId);
                    const IconComp = iconObj?.icon || Sparkles;
                    return <IconComp className="w-10 h-10 text-primary" />;
                  })()}
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white uppercase tracking-widest">{currentSubsections.find(s => s.id === activeSubId)?.label}</h2>
                  <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em] max-w-xs mx-auto leading-relaxed">Independent module: focused content for {activeSubId.replace('_', ' ')} logic.</p>
                </div>
                <Button variant="outline" className="border-white/10 rounded-2xl uppercase tracking-widest text-[10px] font-black h-12 px-8 shadow-xl" onClick={() => handleMainChange(currentLayout[0].id)}>Return to Dashboard</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stable Bottom Navigation (Instagram Style Stability) */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: footerVisible ? 0 : 120 }}
        className="fixed bottom-0 left-0 right-0 z-[100] w-full px-4 pb-8 pt-2 pointer-events-none lg:hidden"
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-[#0a0f1e]/90 backdrop-blur-2xl border border-white/10 rounded-[36px] shadow-2xl shadow-black/80 px-4 py-3">
            <Reorder.Group axis="x" values={currentSubsections} onReorder={handleReorder} className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
              {currentSubsections.map(sub => (
                <Reorder.Item key={sub.id} value={sub} className="shrink-0">
                  <button
                    onClick={() => handleSubChange(sub.id)}
                    className={cx(
                      "relative flex flex-col items-center justify-center w-14 h-14 rounded-[22px] transition-all duration-300 outline-none select-none active:scale-90",
                      activeSubId === sub.id ? "text-primary bg-primary/10 border border-primary/20" : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                    )}
                  >
                    <sub.icon className={cx("w-6 h-6", activeSubId === sub.id ? "fill-primary/5" : "")} />
                    {activeSubId === sub.id && (
                      <motion.div layoutId="activeSubIndicator" className="absolute -bottom-1 w-5 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    )}
                  </button>
                </Reorder.Item>
              ))}
              
              {/* Optional: Layout/Quick Switch dots */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex flex-col items-center justify-center w-14 h-14 rounded-[22px] text-slate-500 hover:text-white transition-all outline-none hover:bg-white/5">
                    <Dots4 className="w-6 h-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="top" className="w-64 bg-slate-900 border-white/10 rounded-[28px] p-2 mb-4 shadow-2xl shadow-black">
                  <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Categories</DropdownMenuLabel>
                   {currentLayout.map(main => (
                    <DropdownMenuItem key={main.id} onClick={() => handleMainChange(main.id)} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5">
                      <main.icon className="w-4 h-4 text-primary" /> <span className="font-bold text-xs uppercase tracking-widest text-white">{main.label}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={handleReset} className="rounded-xl py-3 gap-3 outline-none focus:bg-white/5 text-red-400">
                    <RotateCcw className="w-4 h-4" /> <span className="font-bold text-xs uppercase tracking-widest">Reset Layout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Reorder.Group>
          </div>
        </div>
      </motion.div>

      {/* Persistence Sheets */}
      {selectedPlace && <PlaceDetailSheet place={selectedPlace} isVisited={false} isLoved={false} onOpenChange={(open) => !open && setSelectedPlace(null)} onToggleVisit={() => {}} onToggleLove={() => {}} onRate={() => {}} onOpenComments={() => {}} />}
      <StoryCreationSheet open={showStoryCreate} onOpenChange={setShowStoryCreate} onPublish={() => { setShowStoryCreate(false); }} />
      <StoryReader story={travelStories.find(s => s?.id === travelReaderStoryId) || null} open={travelReaderOpen} onOpenChange={setTravelReaderOpen} isLiked={false} onLike={() => {}} onComment={() => {}} onShare={() => {}} />
      <CommentsDialog postId={""} postTitle={""} type={"adventure_place"} open={commentsOpen} onOpenChange={setCommentsOpen} />
    </div>
  );
}
