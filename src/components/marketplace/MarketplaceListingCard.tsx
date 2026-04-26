import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreVertical, Edit3, Trash2, Phone, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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

export function MarketplaceListingCard({
  listing, isLiked, isSaved, likesCount, commentsCount,
  currentUserId, onLike, onSave, onComment, onShare, onChat,
  onDelete, onEdit, onViewProfile
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isOwner = listing.user_id === currentUserId;
  const media = listing.media_urls || [];
  const hasMultipleImages = media.length > 1;

  const handleCall = () => {
    window.location.href = `tel:+977000000000`; // Placeholder
  };

  return (
    <motion.div 
      layout
      className="mp-card"
    >
      {/* Top Row */}
      <div className="flex items-center gap-2.5">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => onViewProfile(listing.user_id)} 
          className="mp-av"
        >
          <Avatar className="w-full h-full">
            <AvatarImage src={listing.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-transparent text-[var(--mp-text-info)] text-[10px] font-bold">
              {listing.profiles?.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </motion.button>
        <div className="flex-1 min-w-0">
          <button 
            onClick={() => onViewProfile(listing.user_id)} 
            className="text-[14px] font-bold text-[var(--mp-text-primary)] leading-tight block text-left truncate group"
          >
            <span className="group-hover:text-primary transition-colors">{listing.profiles?.name || 'User'}</span>
            <small className="block text-[11px] font-normal text-[var(--mp-text-secondary)] mt-0.5 opacity-80">
              {isOwner ? 'You' : 'Verified seller'}
            </small>
          </button>
        </div>
        {listing.price != null && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mp-price"
          >
            {listing.currency || 'NPR'} {listing.price.toLocaleString()}
          </motion.div>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-[var(--mp-text-secondary)] opacity-60 hover:opacity-100 p-1"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100] bg-popover/90 backdrop-blur-xl shadow-2xl border-border/50 rounded-2xl min-w-[160px]">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(listing)} className="py-2.5">
                  <Edit3 className="w-4 h-4 mr-2.5" />Edit Listing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(listing.id)} className="text-destructive py-2.5">
                  <Trash2 className="w-4 h-4 mr-2.5" />Delete Listing
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => onViewProfile(listing.user_id)} className="py-2.5">
                View Profile
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="flex gap-3">
        <motion.div 
          className="mp-thumb group"
          whileHover={{ scale: 1.02 }}
        >
          {media.length > 0 ? (
            <img 
              src={media[0]} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-[var(--mp-text-secondary)] opacity-20" />
          )}
          <div className="mp-sell-pill">
            {listing.type === 'sell' ? 'Sell' : listing.type === 'job' ? 'Job' : 'Rent'}
          </div>
          {hasMultipleImages && (
            <div className="mp-count-pill">1/{media.length}</div>
          )}
        </motion.div>
        
        <div className="mp-detail">
          <div className="text-[15px] font-bold text-[var(--mp-text-primary)] leading-tight line-clamp-1">
            {listing.title}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--mp-text-secondary)] font-medium">
            <MapPin className="w-3 h-3 text-primary/70" />
            <span className="truncate">{listing.location || 'Nepal'}</span>
          </div>
          <div className="text-[12px] text-[var(--mp-text-secondary)] leading-[1.6] flex-1 overflow-hidden mt-1 relative">
            {listing.description && (
              <>
                <motion.span 
                  layout
                  className={cn("block", !isExpanded && "line-clamp-2")}
                >
                  {listing.description}
                </motion.span>
                {listing.description.length > 60 && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary mt-1 text-[11px] font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    {isExpanded ? 'see less' : 'see more'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 mt-[-2px]">
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => onLike(listing.id)}
          className={cn("mp-action-btn", isLiked && "liked")}
        >
          <Heart className={cn("w-4 h-4 transition-all duration-300", isLiked && "fill-current scale-110")} />
          <motion.span
            key={likesCount}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {likesCount}
          </motion.span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => onComment(listing.id)}
          className="mp-action-btn"
        >
          <MessageCircle className="w-4 h-4" />
          <motion.span
            key={commentsCount}
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {commentsCount}
          </motion.span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => onShare(listing.id)}
          className="mp-action-btn"
        >
          <Share2 className="w-4 h-4" />
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8 }}
          onClick={() => onSave(listing.id)}
          className={cn("mp-action-btn", isSaved && "saved")}
        >
          <Bookmark className={cn("w-4 h-4 transition-all duration-300", isSaved && "fill-current scale-110")} />
        </motion.button>
        <div className="flex-1" />
        <div className="text-[10px] font-medium text-[var(--mp-text-secondary)] opacity-50 bg-[var(--mp-bg-subtle)] px-2 py-0.5 rounded-full">
          {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* CTA */}
      {!isOwner && (
        <div className="flex gap-3 pt-1">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChat(listing.user_id, listing.id)}
            className="mp-cta-msg group"
          >
            <MessageCircle className="w-4 h-4 transition-transform group-hover:rotate-12" />
            Message
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCall}
            className="mp-cta-call group"
          >
            <Phone className="w-4 h-4 transition-transform group-hover:scale-110" />
            Call
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}

