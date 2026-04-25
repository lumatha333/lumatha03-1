import { useMemo, useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreVertical, Edit3, Trash2, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface GalleryListing {
  id: string;
  title: string;
  description?: string;
  media_urls?: string[];
  price?: number;
  type: string; // sell, buy, job, rent, service, apply
  location?: string;
  created_at: string;
  user_id: string;
  seller?: {
    name: string;
    avatar_url?: string;
    verified: boolean;
    phone?: string;
    whatsapp?: string;
    showPhoneTo?: string;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

interface MarketplaceGalleryProps {
  listing: GalleryListing;
  onTap: () => void; // Click anywhere except action bar
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onComment: () => void;
  onMessage: () => void;
  onWhatsApp?: () => void;
  onPhone?: () => void;
  currentUserId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  variant?: 'featured' | 'compact';
}

type BadgeKey = 'service' | 'sell' | 'rent' | 'wanted';

const TYPE_TO_BADGE: Record<string, BadgeKey> = {
  service: 'service',
  sell: 'sell',
  rent: 'rent',
  buy: 'wanted',
  job: 'service',
  apply: 'wanted',
};

const BADGE_STYLES: Record<BadgeKey, { label: string; badgeClass: string; priceClass: string }> = {
  service: {
    label: 'Service',
    badgeClass: 'bg-violet-100 text-violet-700 border-violet-300/70',
    priceClass: 'text-violet-700 dark:text-violet-300',
  },
  sell: {
    label: 'Sell',
    badgeClass: 'bg-blue-100 text-blue-700 border-blue-300/70',
    priceClass: 'text-blue-700 dark:text-blue-300',
  },
  rent: {
    label: 'Rent',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-300/70',
    priceClass: 'text-emerald-700 dark:text-emerald-300',
  },
  wanted: {
    label: 'Wanted',
    badgeClass: 'bg-amber-100 text-amber-700 border-amber-300/70',
    priceClass: 'text-amber-700 dark:text-amber-300',
  },
};

export function MarketplaceGalleryCard({
  listing,
  onTap,
  onLike,
  onSave,
  onShare,
  onComment,
  onMessage,
  onWhatsApp,
  onPhone,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  variant = 'compact',
}: MarketplaceGalleryProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  const media = listing.media_urls || [];
  const badgeKey = TYPE_TO_BADGE[listing.type] || 'sell';
  const badgeStyle = BADGE_STYLES[badgeKey];
  const timestamp = useMemo(() => {
    const date = new Date(listing.created_at);
    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }

    return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
  }, [listing.created_at]);

  const likesCount = listing.likesCount ?? 0;
  const commentsCount = listing.commentsCount ?? 0;
  const imageCountLabel = `1/${Math.max(media.length, 1)}`;
  const displayLocation = listing.location || listing.seller?.name || 'Location unavailable';
  const callHandler = onPhone || onWhatsApp;
  const hasPrice = typeof listing.price === 'number' && !Number.isNaN(listing.price) && listing.price > 0;
  const pressFeedbackClass = 'transition-all active:scale-95 active:translate-y-px';
  const imageFrameClass = variant === 'featured'
    ? 'aspect-square md:aspect-auto md:h-full md:min-h-[420px]'
    : 'aspect-square';

  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const onToggleLike = (e: React.MouseEvent) => {
    stopClick(e);
    onLike();
  };

  const onToggleSave = (e: React.MouseEvent) => {
    stopClick(e);
    onSave();
  };

  const onOpenComments = (e: React.MouseEvent) => {
    stopClick(e);
    onComment();
  };

  const onShareListing = (e: React.MouseEvent) => {
    stopClick(e);
    onShare();
  };

  const onMessageSeller = (e: React.MouseEvent) => {
    stopClick(e);
    onMessage();
  };

  const onCallSeller = (e: React.MouseEvent) => {
    stopClick(e);
    callHandler?.();
  };


  const callButtonLabel = onPhone ? 'Call' : onWhatsApp ? 'WhatsApp' : 'No phone';
  const isOwner = Boolean(currentUserId) && currentUserId === listing.user_id;

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={stopClick}
          className="rounded-full p-2 text-white/85 transition-colors hover:bg-black/30"
          aria-label="Listing actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[120]">
        {isOwner ? (
          <>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
              <Edit3 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReport?.(); }}>
            <Flag className="mr-2 h-4 w-4" /> Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const imageSection = (
    <div className={cn('relative w-full overflow-hidden bg-secondary', imageFrameClass)}>
      {media.length > 0 ? (
        <img
          src={media[0]}
          alt={listing.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-secondary/60">
          <span className="text-4xl opacity-30">🛍️</span>
        </div>
      )}

      <span
        className={cn(
          'absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm',
          badgeStyle.badgeClass,
        )}
      >
        {badgeStyle.label}
      </span>

      <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {imageCountLabel}
      </span>

    </div>
  );

  const actionBar = (
    <div className="flex items-center justify-between px-3.5 py-2.5 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        <button onClick={onToggleLike} className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', pressFeedbackClass)} aria-label="Like listing">
          <Heart className={cn('h-4 w-4', listing.isLiked ? 'fill-red-500 text-red-500' : '')} />
          <span>{likesCount}</span>
        </button>
        <button onClick={onOpenComments} className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', pressFeedbackClass)} aria-label="Open comments">
          <MessageCircle className="h-4 w-4" />
          <span>{commentsCount}</span>
        </button>
        <button onClick={onShareListing} className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', pressFeedbackClass)} aria-label="Share listing">
          <Share2 className="h-4 w-4" />
        </button>
        <button onClick={onToggleSave} className={cn('inline-flex items-center gap-1.5 transition-colors hover:text-foreground', pressFeedbackClass)} aria-label="Save listing">
          <Bookmark className={cn('h-4 w-4', listing.isSaved ? 'fill-red-500 text-red-500' : '')} />
        </button>
      </div>
      <span>{timestamp}</span>
    </div>
  );

  const ctas = (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3.5 pb-3.5 items-center">
      <button
        onClick={onMessageSeller}
        className={cn('h-10 rounded-lg bg-blue-600 text-sm font-semibold text-white transition-colors hover:bg-blue-700', pressFeedbackClass)}
      >
        Message
      </button>
      <button
        onClick={onCallSeller}
        disabled={!callHandler}
        className={cn('h-10 rounded-lg border border-emerald-500 bg-transparent text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60', pressFeedbackClass)}
      >
        {callButtonLabel}
      </button>
      <div className="flex items-center justify-center h-10">
        {menu}
      </div>
    </div>
  );

  if (variant === 'featured') {
    return (
      <article
        onClick={onTap}
        className="w-full overflow-hidden rounded-none md:rounded-2xl border-y border-x-0 md:border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/35"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          {imageSection}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-3 px-4 pt-4">
              <div className="flex min-w-0 items-start gap-2.5">
                <img
                  src={listing.seller?.avatar_url || '/placeholder.svg'}
                  alt={listing.seller?.name || 'Seller'}
                  className="h-10 w-10 rounded-full border border-border/60 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{listing.seller?.name || 'Seller'}</p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{listing.seller?.verified ? 'Verified seller' : 'Seller'}</span>
                  </div>
                </div>
              </div>
              {hasPrice ? (
                <span className={cn('shrink-0 text-xl font-bold', badgeStyle.priceClass)}>
                  NPR {listing.price!.toLocaleString()}
                </span>
              ) : (
                <span className={cn('shrink-0 text-sm font-semibold', badgeStyle.priceClass)}>Price on request</span>
              )}
            </div>

            <div className="px-4 pt-3">
              <h3 className="text-xl font-bold leading-tight text-foreground">{listing.title}</h3>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{displayLocation}</span>
              </div>
            </div>

            <div className="px-4 pt-3 text-sm text-muted-foreground">
              <p className={cn('leading-relaxed', showFullDescription ? '' : 'line-clamp-3')}>
                {listing.description || 'No description provided.'}
              </p>
              {!!listing.description && listing.description.length > 80 && (
                <button
                  onClick={(e) => {
                    stopClick(e);
                    setShowFullDescription((prev) => !prev);
                  }}
                  className="mt-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  See more
                </button>
              )}
            </div>

            <div className="mt-3 border-t border-border/70" />
            {actionBar}
            {ctas}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onTap}
      className="overflow-hidden rounded-none md:rounded-2xl border-y border-x-0 md:border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/35"
    >
      {imageSection}

      <div className="px-3.5 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-start gap-2.5">
            <img
              src={listing.seller?.avatar_url || '/placeholder.svg'}
              alt={listing.seller?.name || 'Seller'}
              className="h-8 w-8 rounded-full border border-border/60 object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{listing.seller?.name || 'Seller'}</p>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{listing.seller?.verified ? 'Verified' : 'Seller'}</span>
              </div>
            </div>
          </div>
          {hasPrice ? (
            <span className={cn('shrink-0 text-base font-bold', badgeStyle.priceClass)}>
              NPR {listing.price!.toLocaleString()}
            </span>
          ) : (
            <span className={cn('shrink-0 text-xs font-semibold', badgeStyle.priceClass)}>Price on request</span>
          )}
        </div>

        <h3 className="mt-2 text-[15px] font-semibold leading-snug text-foreground">{listing.title}</h3>

        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate">{displayLocation}</span>
        </div>

        <div className="mt-2 text-sm text-muted-foreground">
          <p className={cn('leading-relaxed', showFullDescription ? '' : 'line-clamp-2')}>
            {listing.description || 'No description provided.'}
          </p>
          {!!listing.description && listing.description.length > 70 && (
            <button
              onClick={(e) => {
                stopClick(e);
                setShowFullDescription((prev) => !prev);
              }}
              className="ml-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              See more
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 border-t border-border/70" />
      {actionBar}
      {ctas}
    </article>
  );
}
