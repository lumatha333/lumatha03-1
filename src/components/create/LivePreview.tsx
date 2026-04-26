import { motion } from 'framer-motion';
import { Block } from './ContentBlock';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, Home, Users, Ghost, MapPin, Heart, MessageCircle, Share2 } from 'lucide-react';

interface LivePreviewProps {
  blocks: Block[];
  category: string;
  visibility: string;
}

const CATEGORY_ICONS: Record<string, typeof Globe> = {
  global: Globe,
  regional: Home,
  friends: Users,
  ghost: Ghost,
};

export default function LivePreview({ blocks, category, visibility }: LivePreviewProps) {
  const { user } = useAuth();
  const hasContent = blocks.some(b => b.content.trim() || (b.mediaPreviewUrls && b.mediaPreviewUrls.length > 0) || (b.pollOptions && b.pollOptions.some(o => o.trim())));

  if (!hasContent) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-8 text-center">
        <p className="text-sm text-muted-foreground/40 font-medium">Your post preview will appear here</p>
        <p className="text-[11px] text-muted-foreground/25 mt-1">Start adding content above</p>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[category] || Globe;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
    >
      {/* Author bar */}
      <div className="flex items-center gap-3 p-3.5 border-b border-border/50">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
          {(user?.user_metadata?.name || 'U')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{user?.user_metadata?.name || 'You'}</p>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-[10px]">Just now</span>
            <span className="text-[8px]">•</span>
            <CategoryIcon className="w-3 h-3" />
            <span className="text-[10px] capitalize">{category}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {blocks.map(block => (
          <div key={block.id}>
            {block.type === 'text' && block.content.trim() && (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.content}</p>
            )}
            {(block.type === 'image' || block.type === 'video') && block.mediaPreviewUrls && block.mediaPreviewUrls.length > 0 && (
              <div className={`grid gap-1 rounded-xl overflow-hidden ${block.mediaPreviewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {block.mediaPreviewUrls.slice(0, 4).map((url, i) => (
                  <div key={i} className="aspect-square relative">
                    {block.type === 'video' ? (
                      <video src={url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                    {i === 3 && block.mediaPreviewUrls!.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                        +{block.mediaPreviewUrls!.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {block.type === 'poll' && block.content.trim() && (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{block.content}</p>
                {block.pollOptions?.filter(o => o.trim()).map((opt, i) => (
                  <div key={i} className="h-10 rounded-xl bg-muted/40 border border-border flex items-center px-3.5 text-xs font-medium">
                    {opt}
                  </div>
                ))}
              </div>
            )}
            {block.type === 'location' && block.locationName && (
              <div className="flex items-center gap-1.5 text-primary text-xs font-medium">
                <MapPin className="w-3.5 h-3.5" />
                {block.locationName}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mock interaction bar */}
      <div className="flex items-center gap-6 px-3.5 py-2.5 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <Heart className="w-4 h-4" />
          <span className="text-[11px]">Like</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <MessageCircle className="w-4 h-4" />
          <span className="text-[11px]">Comment</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground/50">
          <Share2 className="w-4 h-4" />
          <span className="text-[11px]">Share</span>
        </div>
      </div>
    </motion.div>
  );
}
