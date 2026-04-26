import { motion } from 'framer-motion';
import { 
  FileText, Camera, Film, ShoppingBag, BarChart3, Headphones, 
  ArrowLeft, Clock, LayoutTemplate, Sparkles, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export type ContentType = 'story' | 'photo' | 'video' | 'marketplace' | 'poll' | 'audio';

interface CreationHubProps {
  onSelect: (type: ContentType) => void;
}

const CONTENT_TYPES = [
  { type: 'story' as ContentType, icon: FileText, label: 'Story Post', desc: 'Share your thoughts with the world', gradient: 'from-[hsl(217,90%,65%)] to-[hsl(245,70%,60%)]', glow: 'hsl(217,90%,65%)' },
  { type: 'photo' as ContentType, icon: Camera, label: 'Photo Drop', desc: 'Capture and share moments', gradient: 'from-[hsl(330,85%,60%)] to-[hsl(350,80%,55%)]', glow: 'hsl(330,85%,60%)' },
  { type: 'video' as ContentType, icon: Film, label: 'Video Moment', desc: 'Tell stories in motion', gradient: 'from-[hsl(270,70%,60%)] to-[hsl(290,65%,50%)]', glow: 'hsl(270,70%,60%)' },
  { type: 'marketplace' as ContentType, icon: ShoppingBag, label: 'Marketplace', desc: 'Sell, buy or rent items', gradient: 'from-[hsl(160,80%,45%)] to-[hsl(175,70%,40%)]', glow: 'hsl(160,80%,45%)' },
  { type: 'poll' as ContentType, icon: BarChart3, label: 'Poll', desc: 'Ask your audience anything', gradient: 'from-[hsl(35,90%,55%)] to-[hsl(20,85%,50%)]', glow: 'hsl(35,90%,55%)' },
  { type: 'audio' as ContentType, icon: Headphones, label: 'Audio Thought', desc: 'Voice your mind freely', gradient: 'from-[hsl(190,90%,50%)] to-[hsl(210,85%,55%)]', glow: 'hsl(190,90%,50%)' },
];

export default function CreationHub({ onSelect }: CreationHubProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center px-4 py-6">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">Create Something</h1>
            </div>
            <p className="text-sm text-muted-foreground">Choose your canvas to get started</p>
          </motion.div>
        </div>
        <div className="w-9" />
      </div>

      {/* Content Type Cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CONTENT_TYPES.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.type}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(item.type)}
              className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden text-left"
            >
              {/* Background glow on hover */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500"
                style={{ background: `radial-gradient(circle at 30% 50%, ${item.glow}, transparent 70%)` }}
              />
              
              {/* Icon */}
              <div className={`relative shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:shadow-xl transition-all duration-300`}>
                <Icon className="w-7 h-7 text-white" />
              </div>

              {/* Text */}
              <div className="relative flex-1 min-w-0">
                <p className="font-semibold text-[15px] leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
              </div>

              {/* Arrow */}
              <ChevronRight className="relative w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="w-full max-w-2xl flex gap-3 mt-8">
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-border bg-card/50 hover:bg-card transition-all duration-200 text-sm text-muted-foreground hover:text-foreground"
        >
          <Clock className="w-4 h-4" />
          Drafts
        </motion.button>
        <motion.button 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-border bg-card/50 hover:bg-card transition-all duration-200 text-sm text-muted-foreground hover:text-foreground"
        >
          <LayoutTemplate className="w-4 h-4" />
          Templates
        </motion.button>
      </div>
    </div>
  );
}
