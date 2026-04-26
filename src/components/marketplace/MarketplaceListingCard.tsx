import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreVertical, Edit3, Trash2, Phone, Image as ImageIcon } from 'lucide-react';
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
    // In a real app, this might open a phone dialer or showing a number
    window.location.href = `tel:+977000000000`; // Placeholder
  };

  return (
    <div className="mp-card">
      {/* Top Row */}
      <div className="flex items-center gap-2">
        <button onClick={() => onViewProfile(listing.user_id)} className="mp-av">
          <Avatar className="w-full h-full">
            <AvatarImage src={listing.profiles?.avatar_url || undefined} />
            <AvatarFallback className="bg-transparent text-[var(--mp-text-info)] text-[10px] font-bold">
              {listing.profiles?.name?.[0]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        </button>
        <div className="flex-1 min-w-0">
          <button 
            onClick={() => onViewProfile(listing.user_id)} 
            className="text-[13px] font-medium text-[var(--mp-text-primary)] leading-tight block text-left truncate"
          >
            {listing.profiles?.name || 'User'}
            <small className="block text-[11px] font-normal text-[var(--mp-text-secondary)]">
              {isOwner ? 'You' : 'Verified seller'}
            </small>
          </button>
        </div>
        {listing.price != null && (
          <div className="mp-price">
            {listing.currency || 'NPR'} {listing.price.toLocaleString()}
          </div>
        )}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className="text-[var(--mp-text-secondary)] opacity-60 hover:opacity-100 p-1">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-[100] bg-popover shadow-xl border-border/50">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(listing)}>
                  <Edit3 className="w-4 h-4 mr-2" />Edit Listing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete?.(listing.id)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />Delete Listing
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => onViewProfile(listing.user_id)}>
                View Profile
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Body */}
      <div className="flex gap-2.5">
        <div className="mp-thumb">
          {media.length > 0 ? (
            <img 
              src={media[0]} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon className="w-7 h-7 text-[var(--mp-text-secondary)] opacity-30" />
          )}
          <div className="mp-sell-pill">
            {listing.type === 'sell' ? 'Sell' : listing.type === 'job' ? 'Job' : 'Rent'}
          </div>
          {hasMultipleImages && (
            <div className="mp-count-pill">1/{media.length}</div>
          )}
        </div>
        
        <div className="mp-detail">
          <div className="text-[14px] font-medium text-[var(--mp-text-primary)] leading-snug line-clamp-1">
            {listing.title}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[var(--mp-text-secondary)]">
            <MapPin className="w-2.5 h-2.5" />
            <span className="truncate">{listing.location || 'Nepal'}</span>
          </div>
          <div className="text-[12px] text-[var(--mp-text-secondary)] leading-[1.55] flex-1 overflow-hidden mt-0.5">
            {listing.description && (
              <>
                <span className={cn(!isExpanded && "line-clamp-2")}>
                  {listing.description}
                </span>
                {listing.description.length > 60 && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-[var(--mp-text-info)] ml-1 font-medium hover:underline inline"
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
      <div className="flex items-center gap-0.5 mt-[-4px]">
        <button 
          onClick={() => onLike(listing.id)}
          className={cn("mp-action-btn", isLiked && "liked")}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          <span>{likesCount}</span>
        </button>
        <button 
          onClick={() => onComment(listing.id)}
          className="mp-action-btn"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount}</span>
        </button>
        <button 
          onClick={() => onShare(listing.id)}
          className="mp-action-btn"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onSave(listing.id)}
          className={cn("mp-action-btn", isSaved && "saved")}
        >
          <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
        </button>
        <div className="flex-1" />
        <div className="text-[11px] text-[var(--mp-text-secondary)] opacity-60 pr-1">
          {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
        </div>
      </div>

      {/* CTA */}
      {!isOwner && (
        <div className="flex gap-2">
          <button 
            onClick={() => onChat(listing.user_id, listing.id)}
            className="mp-cta-msg"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message
          </button>
          <button 
            onClick={handleCall}
            className="mp-cta-call"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </button>
        </div>
      )}
    </div>
  );
}
