import { useState, useMemo } from 'react';
import { 
  Heart, MessageCircle, Bookmark, Share2, MoreHorizontal,
  MapPin, Clock, Shield, Phone, MessageSquare, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// ============ TYPES ============
export type ListingType = 'sell' | 'buy' | 'job' | 'rent' | 'service' | 'apply';
export type CTAType = 'contact' | 'message' | 'book' | 'call' | 'apply';

export interface MediaFirstCardProps {
  id: string;
  title: string;
  description?: string;
  mediaUrls: string[];
  type: ListingType;
  price?: number;
  location?: string;
  createdAt: string;
  
  // Seller info
  seller: {
    id: string;
    name: string;
    avatarUrl?: string;
    verified?: boolean;
    phone?: string;
  };
  
  // Engagement
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isOwner: boolean;
  
  // Actions
  onTap: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onComment: () => void;
  onCTA: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

// ============ CONFIGURATION ============
const TYPE_CONFIG: Record<ListingType, {
  label: string;
  badgeGradient: string;
  ctaText: string;
  ctaType: CTAType;
  icon: React.ReactNode;
}> = {
  sell: {
    label: 'For Sale',
    badgeGradient: 'from-blue-500 to-cyan-400',
    ctaText: 'Contact Seller',
    ctaType: 'contact',
    icon: <span className="text-lg">🏷️</span>,
  },
  buy: {
    label: 'Wanted',
    badgeGradient: 'from-amber-500 to-orange-400',
    ctaText: 'Message',
    ctaType: 'message',
    icon: <span className="text-lg">🔍</span>,
  },
  job: {
    label: 'Hiring',
    badgeGradient: 'from-violet-500 to-purple-400',
    ctaText: 'Apply Now',
    ctaType: 'apply',
    icon: <span className="text-lg">💼</span>,
  },
  rent: {
    label: 'For Rent',
    badgeGradient: 'from-emerald-500 to-teal-400',
    ctaText: 'Book Viewing',
    ctaType: 'book',
    icon: <span className="text-lg">🏠</span>,
  },
  service: {
    label: 'Service',
    badgeGradient: 'from-rose-500 to-pink-400',
    ctaText: 'Book Service',
    ctaType: 'book',
    icon: <span className="text-lg">🛠️</span>,
  },
  apply: {
    label: 'Seeking Work',
    badgeGradient: 'from-indigo-500 to-blue-400',
    ctaText: 'Contact',
    ctaType: 'contact',
    icon: <span className="text-lg">📄</span>,
  },
};

// ============ MAIN COMPONENT ============
export function MediaFirstCard({
  title,
  description,
  mediaUrls,
  type,
  price,
  location,
  createdAt,
  seller,
  likesCount,
  commentsCount,
  isLiked,
  isSaved,
  isOwner,
  onTap,
  onLike,
  onSave,
  onShare,
  onComment,
  onCTA,
  onEdit,
  onDelete,
  onReport,
}: MediaFirstCardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const config = TYPE_CONFIG[type];
  const hasMedia = mediaUrls.length > 0;
  
  const timestamp = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
        .replace('about ', '');
    } catch {
      return 'Recently';
    }
  }, [createdAt]);

  const formattedPrice = useMemo(() => {
    if (price === undefined || price === null) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(price);
  }, [price]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike();
  };

  const handleDoubleTap = () => {
    onLike();
  };

  return (
    <article 
      className="w-full bg-[#0a0f1e] overflow-hidden"
      style={{ borderRadius: '16px' }}
    >
      {/* MEDIA AREA - 80% Visual Dominance */}
      <div 
        className="relative w-full aspect-[4/5] sm:aspect-square cursor-pointer overflow-hidden"
        onClick={onTap}
        onDoubleClick={handleDoubleTap}
        style={{ borderRadius: '16px 16px 0 0' }}
      >
        {hasMedia ? (
          <>
            <img
              src={mediaUrls[0]}
              alt={title}
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-105"
              )}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
            <span className="text-6xl opacity-20">{config.icon}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

        {/* Type Badge - Top Left */}
        <div className="absolute top-4 left-4">
          <span className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold text-white",
            "bg-gradient-to-r shadow-lg",
            config.badgeGradient
          )}>
            {config.label}
          </span>
        </div>

        {/* Menu Button - Top Right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/50 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full right-0 mt-2 w-40 bg-[#111827] rounded-xl border border-white/10 shadow-xl overflow-hidden z-20"
              >
                {isOwner ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit?.(); setShowMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete?.(); setShowMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/5 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onReport?.(); setShowMenu(false); }}
                    className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 transition-colors"
                  >
                    Report
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Image Counter */}
        {mediaUrls.length > 1 && (
          <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
            1/{mediaUrls.length}
          </div>
        )}

        {/* Price Overlay - Bottom Left */}
        {formattedPrice && (
          <div className="absolute bottom-4 left-4">
            <span className="text-2xl font-bold text-white drop-shadow-lg">
              {formattedPrice}
            </span>
          </div>
        )}
      </div>

      {/* TOP BAR - Avatar + Username + Time */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={seller.avatarUrl || '/placeholder.svg'}
              alt={seller.name}
              className="w-9 h-9 rounded-full object-cover border border-white/10"
            />
            {seller.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{seller.name}</p>
            <p className="text-xs text-white/40">{timestamp}</p>
          </div>
        </div>
      </div>

      {/* DESCRIPTION - Smart Collapse */}
      <div className="px-4 pb-3">
        <h3 className="text-lg font-bold text-white leading-tight mb-2">{title}</h3>
        
        {description && (
          <div className="relative">
            <p 
              className={cn(
                "text-sm text-white/60 leading-relaxed",
                !showFullDesc && "line-clamp-2"
              )}
            >
              {description}
            </p>
            {!showFullDesc && description.length > 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0a0f1e] to-transparent" />
            )}
            {description.length > 80 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                {showFullDesc ? 'less' : 'more'}
              </button>
            )}
          </div>
        )}
        
        {/* Location */}
        {location && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
            <MapPin className="w-3.5 h-3.5" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* ACTION ROW - Clean Minimal Icons */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-6">
          <ActionButton
            active={isLiked}
            count={likesCount}
            onClick={handleLike}
            icon={<Heart className={cn("w-5 h-5", isLiked && "fill-current")} />}
            activeColor="text-red-500"
          />
          
          <ActionButton
            count={commentsCount}
            onClick={(e) => { e.stopPropagation(); onComment(); }}
            icon={<MessageCircle className="w-5 h-5" />}
          />
          
          <ActionButton
            active={isSaved}
            onClick={(e) => { e.stopPropagation(); onSave(); }}
            icon={<Bookmark className={cn("w-5 h-5", isSaved && "fill-current")} />}
            activeColor="text-amber-500"
          />
        </div>
        
        <button
          onClick={(e) => { e.stopPropagation(); onShare(); }}
          className="p-2 rounded-full text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* DYNAMIC CTA ROW */}
      <div className="px-4 pb-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={(e) => { e.stopPropagation(); onCTA(); }}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm text-white",
            "bg-gradient-to-r shadow-lg transition-all",
            config.badgeGradient
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {type === 'sell' || type === 'apply' ? <MessageSquare className="w-4 h-4" /> : 
             type === 'job' ? <Calendar className="w-4 h-4" /> : 
             type === 'rent' || type === 'service' ? <Calendar className="w-4 h-4" /> :
             <Phone className="w-4 h-4" />}
            {config.ctaText}
          </span>
        </motion.button>
      </div>
    </article>
  );
}

// ============ SUB COMPONENTS ============
function ActionButton({
  active,
  count,
  onClick,
  icon,
  activeColor = "text-white",
}: {
  active?: boolean;
  count?: number;
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-white/50 hover:text-white/80 transition-colors",
        active && activeColor
      )}
    >
      {icon}
      {count !== undefined && count > 0 && (
        <span className="text-xs font-medium">{count}</span>
      )}
    </button>
  );
}

// ============ SKELETON LOADER ============
export function MediaFirstCardSkeleton() {
  return (
    <div className="w-full bg-[#0a0f1e] overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Media Skeleton */}
      <div className="w-full aspect-[4/5] bg-white/5 animate-pulse" />
      
      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10" />
          <div className="space-y-1.5">
            <div className="w-24 h-3 bg-white/10 rounded" />
            <div className="w-16 h-2.5 bg-white/5 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-white/10 rounded" />
          <div className="w-3/4 h-4 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
}

export default MediaFirstCard;
