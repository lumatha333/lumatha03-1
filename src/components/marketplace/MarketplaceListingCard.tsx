import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreVertical, Edit3, Trash2, ShoppingBag, Briefcase, Home as HomeIcon, DollarSign, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

interface Listing {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  location: string | null;
  category: string | null;
  media_urls: string[];
  media_types: string[];
  status: string | null;
  likes_count: number | null;
  comments_count: number | null;
  views_count: number | null;
  qualification: string | null;
  salary_range: string | null;
  created_at: string;
  profiles?: { name: string; avatar_url: string | null; username: string | null; id: string };
}

interface Props {
  listing: Listing;
  isLiked: boolean;
  isSaved: boolean;
  likesCount: number;
  commentsCount: number;
  currentUserId: string;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onChat: (userId: string, listingId: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (listing: Listing) => void;
  onViewProfile: (userId: string) => void;
}

const typeIcons: Record<string, any> = {
  sell: ShoppingBag,
  job: Briefcase,
  rent: HomeIcon,
};

const typeColors: Record<string, { gradient: string; badge: string; cta: string }> = {
  sell: { 
    gradient: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    cta: 'from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600'
  },
  job: { 
    gradient: 'from-violet-500/10 to-violet-500/5 border-violet-500/20',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
    cta: 'from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600'
  },
  rent: { 
    gradient: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    cta: 'from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600'
  },
};

const ctaLabels: Record<string, string> = {
  sell: 'Contact Seller',
  job: 'Apply Now',
  rent: 'Book Now',
};

export function MarketplaceListingCard({
  listing, isLiked, isSaved, likesCount, commentsCount,
  currentUserId, onLike, onSave, onComment, onShare, onChat,
  onDelete, onEdit, onViewProfile
}: Props) {
  const [imgIndex, setImgIndex] = useState(0);
  const [expandDesc, setExpandDesc] = useState(false);
  const isOwner = listing.user_id === currentUserId;
  const TypeIcon = typeIcons[listing.type] || ShoppingBag;
  const media = listing.media_urls || [];
  const colors = typeColors[listing.type] || typeColors.sell;

  // Smart description - first 2 lines, then expand
  const descLines = listing.description?.split('\n') || [];
  const isLongDesc = descLines.length > 2 || (listing.description?.length || 0) > 120;
  const displayDesc = expandDesc ? listing.description : descLines.slice(0, 2).join('\n');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "border overflow-hidden backdrop-blur-sm",
        `bg-gradient-to-br ${colors.gradient}`
      )}>
        {/* Top Bar - Minimal */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/5">
          <button 
            onClick={() => onViewProfile(listing.user_id)}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-10 h-10 ring-1 ring-white/10 shrink-0">
              <AvatarImage src={listing.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-secondary/30 text-xs font-bold">
                {listing.profiles?.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{listing.profiles?.name || 'User'}</p>
              <p className="text-[11px] text-slate-400">{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</p>
            </div>
          </button>

          {isOwner && (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-[100] bg-slate-900 border-white/10">
                <DropdownMenuItem onClick={() => onEdit?.(listing)} className="cursor-pointer"><Edit3 className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(listing.id)} className="text-red-400 cursor-pointer"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Media Area - DOMINANT (80%) */}
        {media.length > 0 && (
          <motion.div
            className="relative bg-black/40 aspect-video overflow-hidden group cursor-pointer"
            whileHover={{ scale: 1.02 }}
          >
            <img
              src={media[imgIndex]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Progress Bar */}
            {media.length > 1 && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden">
                <motion.div 
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((imgIndex + 1) / media.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Image Counter */}
            {media.length > 1 && (
              <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                {imgIndex + 1}/{media.length}
              </div>
            )}

            {/* Navigation Dots - Bottom */}
            {media.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {media.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={cn(
                      "rounded-full transition-all",
                      i === imgIndex 
                        ? "bg-white w-2.5 h-2" 
                        : "bg-white/40 hover:bg-white/60 w-1.5 h-1.5"
                    )}
                    whileHover={{ scale: 1.2 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Description & Details */}
        <div className="p-4 space-y-3 border-b border-white/5">
          <div>
            <h3 className="font-bold text-base leading-tight">{listing.title}</h3>
            {listing.description && (
              <div className="text-sm text-slate-300 mt-2 leading-relaxed relative">
                <p className={expandDesc ? '' : 'line-clamp-2'}>
                  {displayDesc}
                </p>
                {isLongDesc && !expandDesc && (
                  <button
                    onClick={() => setExpandDesc(true)}
                    className="text-primary hover:text-primary/80 text-xs font-semibold inline ml-1"
                  >
                    more
                  </button>
                )}
                {expandDesc && isLongDesc && (
                  <button
                    onClick={() => setExpandDesc(false)}
                    className="text-primary hover:text-primary/80 text-xs font-semibold inline ml-1"
                  >
                    less
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Badges - Price, Location, etc */}
          {(listing.price != null || listing.location || listing.salary_range || listing.qualification) && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {listing.price != null && (
                <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {listing.currency || 'NPR'} {listing.price.toLocaleString()}
                </Badge>
              )}
              {listing.location && (
                <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                  <MapPin className="w-3 h-3 mr-1" />
                  {listing.location}
                </Badge>
              )}
              {listing.salary_range && (
                <Badge variant="outline" className="text-xs border-white/10 bg-white/5">
                  {listing.salary_range}
                </Badge>
              )}
              {listing.qualification && (
                <Badge variant="secondary" className="text-[10px]">{listing.qualification}</Badge>
              )}
            </div>
          )}
        </div>

        {/* Action Row - Cleaned Up */}
        <div className="px-4 py-3 space-y-3">
          {/* Like, Comment, Share - Minimal Icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onLike(listing.id)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-red-400 transition-colors"
              >
                <Heart className={cn("w-5 h-5", isLiked ? "fill-red-500 text-red-500" : "")} />
                <span className="text-xs">{likesCount}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onComment(listing.id)}
                className="flex items-center gap-2 text-sm text-slate-300 hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">{commentsCount}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onShare(listing.id)}
                className="text-slate-300 hover:text-green-400 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSave(listing.id)}
              className="text-slate-300 hover:text-amber-400 transition-colors"
            >
              <Bookmark className={cn("w-5 h-5", isSaved ? "fill-amber-500 text-amber-500" : "")} />
            </motion.button>
          </div>

          {/* Dynamic CTA */}
          {!isOwner && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChat(listing.user_id, listing.id)}
              className={cn(
                "w-full py-2.5 rounded-xl font-semibold text-white text-sm transition-all",
                "flex items-center justify-center gap-2",
                `bg-gradient-to-r ${colors.cta}`
              )}
            >
              {ctaLabels[listing.type] || 'Message'}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
