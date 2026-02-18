import { useNavigate } from 'react-router-dom';
import { 
  FileText, CheckSquare, StickyNote, Mountain, Target, 
  Plane, Shuffle, BookOpen, ShoppingBag, Gamepad2,
  ArrowRight, Sparkles
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickNavWidget {
  icon: any;
  title: string;
  description: string;
  route: string;
  accent: string;
  iconColor: string;
  image?: string;
}

const widgets: QuickNavWidget[] = [
  {
    icon: FileText,
    title: 'Your Documents',
    description: 'Access uploaded docs, PDFs, and study materials. Organize everything in one place.',
    route: '/education',
    accent: 'accent-card-teal',
    iconColor: 'text-teal-400',
  },
  {
    icon: CheckSquare,
    title: 'To-Do Lists',
    description: 'Daily, weekly & lifetime goals. Track your progress and build streaks.',
    route: '/education',
    accent: 'accent-card-amber',
    iconColor: 'text-amber-400',
  },
  {
    icon: StickyNote,
    title: 'Your Notes',
    description: 'Rich text notes with folders. Better than Apple Notes, built for you.',
    route: '/education',
    accent: 'accent-card-violet',
    iconColor: 'text-violet-400',
  },
  {
    icon: Mountain,
    title: 'Adventure Zone',
    description: '500+ real-world challenges. Explore 2200+ locations across the globe.',
    route: '/music-adventure',
    accent: 'accent-card-coral',
    iconColor: 'text-orange-400',
  },
  {
    icon: Target,
    title: 'Challenges',
    description: 'Complete quests, earn milestones. From easy walks to epic adventures.',
    route: '/music-adventure',
    accent: 'accent-card-rose',
    iconColor: 'text-rose-400',
  },
  {
    icon: Plane,
    title: 'Travel Stories',
    description: 'Share your journey with photos & videos. Inspire others to explore.',
    route: '/music-adventure',
    accent: 'accent-card-mint',
    iconColor: 'text-emerald-400',
  },
  {
    icon: Shuffle,
    title: 'Random Connect',
    description: 'Meet someone new. Text, audio, or video — leave anytime, safety first.',
    route: '/random-connect',
    accent: 'accent-card-primary',
    iconColor: 'text-blue-400',
  },
  {
    icon: Gamepad2,
    title: 'FunPun Games',
    description: '8 game modes for a fresh mind. Stress relief, creativity & more.',
    route: '/funpun',
    accent: 'accent-card-violet',
    iconColor: 'text-purple-400',
  },
  {
    icon: BookOpen,
    title: 'Education Hub',
    description: 'Public & private docs, video lectures, and collaborative learning.',
    route: '/education',
    accent: 'accent-card-teal',
    iconColor: 'text-cyan-400',
  },
  {
    icon: ShoppingBag,
    title: 'Marketplace',
    description: 'Buy, sell & discover local products. Support your community.',
    route: '/marketplace',
    accent: 'accent-card-amber',
    iconColor: 'text-yellow-400',
  },
];

// Show 2 widgets per insert, rotating through the list
export function QuickNavInsert({ insertIndex }: { insertIndex: number }) {
  const navigate = useNavigate();
  const startIdx = (insertIndex * 2) % widgets.length;
  const widgetsToShow = [
    widgets[startIdx],
    widgets[(startIdx + 1) % widgets.length],
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">Explore More</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        {widgetsToShow.map((widget) => {
          const Icon = widget.icon;
          return (
            <Card 
              key={widget.title} 
              className={`${widget.accent} border rounded-2xl cursor-pointer hover-lift overflow-hidden group`}
              onClick={() => navigate(widget.route)}
            >
              <CardContent className="p-4 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-background/40 backdrop-blur flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Icon className={`w-6 h-6 ${widget.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5">{widget.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{widget.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
