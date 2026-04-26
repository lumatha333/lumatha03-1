import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MapPin,
  MoreVertical,
  Edit3,
  Trash2,
  Phone,
  ChevronDown,
  BadgeCheck,
  Clock,
  ShoppingBag,
  Briefcase,
  Home as HomeIcon,
  Wrench,
  FileText,
  Search,
  Image as ImageIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
  created_at: string;
  profiles?: { name: string; avatar_url: string | null; username: string | null; id: string };
  mp_profile?: { username: string | null; phone: string | null; whatsapp: string | null; is_phone_verified: boolean | null; show_phone_to: string | null };
  likes_count?: number | null;
  comments_count?: number | null;
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
  onShare: (listing: Listing) => void;
  onChat: (userId: string, listingId: string, title: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (listing: Listing) => void;
  onViewProfile: (userId: string) => void;
  index?: number;
}

const typeConfig: Record<string, { icon: any; label: string; color: string; darkColor: string; bg: string; darkBg: string; border: string; darkBorder: string }> = {
  sell: { icon: ShoppingBag, label: 'Sell', color: 'text-blue-600', darkColor: 'dark:text-blue-400', bg: 'bg-blue-50', darkBg: 'dark:bg-blue-950/30', border: 'border-blue-100', darkBorder: 'dark:border-blue-900' },
  buy: { icon: Search, label: 'Wanted', color: 'text-amber-600', darkColor: 'dark:text-amber-400', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-950/30', border: 'border-amber-100', darkBorder: 'dark:border-amber-900' },
  job: { icon: Briefcase, label: 'Job', color: 'text-pink-600', darkColor: 'dark:text-pink-400', bg: 'bg-pink-50', darkBg: 'dark:bg-pink-950/30', border: 'border-pink-100', darkBorder: 'dark:border-pink-900' },
  rent: { icon: HomeIcon, label: 'Rent', color: 'text-emerald-600', darkColor: 'dark:text-emerald-400', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-950/30', border: 'border-emerald-100', darkBorder: 'dark:border-emerald-900' },
  service: { icon: Wrench, label: 'Service', color: 'text-violet-600', darkColor: 'dark:text-violet-400', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-950/30', border: 'border-violet-100', darkBorder: 'dark:border-violet-900' },
  apply: { icon: FileText, label: 'Apply', color: 'text-rose-600', darkColor: 'dark:text-rose-400', bg: 'bg-rose-50', darkBg: 'dark:bg-rose-950/30', border: 'border-rose-100', darkBorder: 'dark:border-rose-900' },
};

function getTypeConfig(type: string) {
  return typeConfig[type] || typeConfig.sell;
}

export function MarketplaceFeedCard({
  listing,
  isLiked,
  isSaved,
  likesCount,
  commentsCount,
  currentUserId,
  onLike,
  onSave,
  onComment,
  onShare,
  onChat,
  onDelete,
  onEdit,
  onViewProfile,
  index = 0,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = listing.user_id === currentUserId;
  const media = listing.media_urls || [];
  const hasMedia = media.length > 0;
  const tConfig = getTypeConfig(listing.type);
  const TypeIcon = tConfig.icon;

  const sellerName = listing.mp_profile?.username || listing.profiles?.name || 'Seller';
  const isVerified = listing.mp_profile?.is_phone_verified || false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card',
        'shadow-sm hover:shadow-md transition-shadow duration-300'
      )}
    >
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <button
          onClick={() => onViewProfile(listing.user_id)}
          className="relative shrink-0 w-[108px] h-[108px] rounded-xl overflow-hidden bg-muted border border-border"
        >
          {hasMedia ? (
            <img
              src={media[0]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
            </div>
          )}
          {/* Type badge */}
          <div className={cn('absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border backdrop-blur-sm', tConfig.bg, tConfig.darkBg, tConfig.border, tConfig.darkBorder, tConfig.color, tConfig.darkColor)}>
            <TypeIcon className="w-3 h-3 inline mr-0.5 -mt-px" />
            {tConfig.label}
          </div>
          {/* Image count */}
          {media.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
              +{media.length - 1}
            </div>
          )}
        </button>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top row: seller + price + menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar className="w-5 h-5 ring-1 ring-border/50">
                <AvatarImage src={listing.profiles?.avatar_url || undefined} />
                <AvatarFallback className="text-[9px] font-bold bg-secondary text-foreground">
                  {listing.profiles?.name?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-foreground truncate">{sellerName}</span>
              {isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {listing.price != null && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
                  {listing.currency || 'NPR'} {listing.price.toLocaleString()}
                </span>
              )}
              {isOwner ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-muted transition-colors">
                      <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="z-[100] bg-popover shadow-xl" align="end">
                    <DropdownMenuItem onClick={() => onEdit?.(listing)}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete?.(listing.id)} className="text-destructive">
                      <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => onShare(listing)}
                  className="p-1 rounded-md hover:bg-muted transition-colors active:scale-90"
                >
                  <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-foreground mt-1.5 line-clamp-1 leading-tight">{listing.title}</h3>

          {/* Location + time */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
            {listing.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {listing.location}
              </span>
            )}
            <span className="flex items-center gap-0.5 shrink-0">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Description */}
          {listing.description && (
            <div className="mt-1">
              <p className={cn('text-xs text-muted-foreground leading-relaxed', !expanded && 'line-clamp-2')}>
                {listing.description}
              </p>
              {listing.description.length > 90 && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-[10px] font-semibold text-primary hover:underline mt-0.5 flex items-center gap-0.5"
                >
                  {expanded ? 'See less' : 'See more'}
                  <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
                </button>
              )}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onLike(listing.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-all active:scale-90"
              >
                <Heart className={cn('w-4 h-4', isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground')} />
                <span className="text-[11px] font-medium text-muted-foreground">{likesCount}</span>
              </button>
              <button
                onClick={() => onComment(listing.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-all active:scale-90"
              >
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">{commentsCount}</span>
              </button>
              {!isOwner && (
                <button
                  onClick={() => onSave(listing.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted transition-all active:scale-90"
                >
                  <Bookmark className={cn('w-4 h-4', isSaved ? 'fill-primary text-primary' : 'text-muted-foreground')} />
                </button>
              )}
            </div>

            {/* CTA row */}
            {!isOwner && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onChat(listing.user_id, listing.id, listing.title)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                >
                  <MessageCircle className="w-3 h-3" />
                  Message
                </button>
                {listing.mp_profile?.phone && (
                  <a
                    href={`tel:${listing.mp_profile.phone}`}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                )}
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => onEdit?.(listing)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-muted text-foreground hover:bg-muted/80 transition-all active:scale-95"
              >
                <Edit3 className="w-3 h-3" />
                Edit listing
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
