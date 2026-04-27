import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MapPin, MoreVertical, Edit3, Trash2, ShoppingBag, Briefcase, Home as HomeIcon, DollarSign, Search, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';

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
  profiles?: { name: string; avatar_url: string | null; username: string | null; id: string; phone?: string | null };
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
  const [imgIndex, setImgIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const isOwner = listing.user_id === currentUserId;
  const media = listing.media_urls || [];

  const handleCall = () => {
    if (listing.profiles?.phone) {
      window.location.href = `tel:${listing.profiles.phone}`;
    } else {
      onChat(listing.user_id, listing.id);
    }
  };

  return (
    <Card className={cn(
      "border border-white/5 overflow-hidden animate-fade-in backdrop-blur-sm shadow-xl bg-[#0B0D1F]/60",
    )}>
      <div className="flex flex-col md:flex-row">
        {/* Left Side: Media (Halves) */}
        <div className="w-full md:w-1/2 relative group/media aspect-[4/3] md:aspect-square overflow-hidden bg-black/20">
          {media.length > 0 ? (
            <img
              src={media[imgIndex]}
              alt={listing.title}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover/media:scale-105"
              loading="lazy"
              onClick={() => setViewerOpen(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
              <ShoppingBag className="w-12 h-12 text-slate-700" />
            </div>
          )}
          
          {media.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full opacity-0 group-hover/media:opacity-100 transition-opacity">
              {media.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                  className={cn("w-1.5 h-1.5 rounded-full transition-all", i === imgIndex ? "bg-white w-3" : "bg-white/40")}
                />
              ))}
            </div>
          )}
          
          <Badge className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border-white/10 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
            {listing.type === 'sell' ? 'Market' : listing.type}
          </Badge>
        </div>

        {/* Right Side: Description (Halves) */}
        <div className="w-full md:w-1/2 flex flex-col p-4 md:p-5">
          {/* Seller Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <button onClick={() => onViewProfile(listing.user_id)} className="shrink-0">
                <Avatar className="w-8 h-8 ring-1 ring-white/10">
                  <AvatarImage src={listing.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-800 text-[10px] font-black">{listing.profiles?.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
              <div className="min-w-0">
                <button onClick={() => onViewProfile(listing.user_id)} className="font-black text-xs text-white hover:text-blue-400 transition-colors block truncate uppercase tracking-wider">
                  {listing.profiles?.name || 'User'}
                </button>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-bold uppercase">
                  <span>{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
                  {listing.location && (
                    <span className="flex items-center gap-0.5 truncate max-w-[100px]"><MapPin className="w-2.5 h-2.5" />{listing.location}</span>
                  )}
                </div>
              </div>
            </div>
            
            {isOwner && (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-[100] bg-[#0d1117] border-white/10 shadow-2xl">
                  <DropdownMenuItem onClick={() => onEdit?.(listing)} className="gap-2 font-bold text-xs uppercase"><Edit3 className="w-3.5 h-3.5" />Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete?.(listing.id)} className="gap-2 font-bold text-xs uppercase text-red-400"><Trash2 className="w-3.5 h-3.5" />Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Listing Details */}
          <div className="flex-1 space-y-2">
            <h3 className="font-black text-base text-white uppercase tracking-wider leading-tight line-clamp-2">{listing.title}</h3>
            
            {listing.price != null && (
              <div className="text-xl font-black text-emerald-400 flex items-baseline gap-1">
                <span className="text-xs uppercase tracking-widest opacity-70">{listing.currency || 'NPR'}</span>
                {listing.price.toLocaleString()}
              </div>
            )}

            {listing.description && (
              <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed font-medium">
                {listing.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {listing.category && <Badge variant="secondary" className="bg-white/5 text-slate-400 border-white/5 text-[9px] uppercase font-bold">{listing.category}</Badge>}
              {listing.salary_range && <Badge variant="secondary" className="bg-white/5 text-slate-400 border-white/5 text-[9px] uppercase font-bold">{listing.salary_range}</Badge>}
            </div>
          </div>

          {/* Social Stats */}
          <div className="flex items-center gap-4 py-4 border-t border-white/5 mt-4">
            <button onClick={() => onLike(listing.id)} className={cn("flex items-center gap-1.5 text-[11px] font-bold uppercase transition-colors", isLiked ? "text-red-500" : "text-slate-500 hover:text-red-400")}>
              <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
              <span>{likesCount}</span>
            </button>
            <button onClick={() => onComment(listing.id)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500 hover:text-blue-400 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{commentsCount}</span>
            </button>
            <button onClick={() => onShare(listing.id)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-slate-500 hover:text-sky-400 transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => onSave(listing.id)} className={cn("ml-auto transition-colors", isSaved ? "text-blue-500" : "text-slate-500 hover:text-blue-400")}>
              <Bookmark className={cn("w-4 h-4", isSaved && "fill-current")} />
            </button>
          </div>

          {/* CTA Buttons */}
          {!isOwner && (
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <Button 
                onClick={() => onChat(listing.user_id, listing.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-blue-900/20"
              >
                <MessageCircle className="w-3.5 h-3.5 mr-2" />
                Message
              </Button>
              <Button 
                onClick={handleCall}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest h-10 shadow-lg shadow-emerald-900/20"
              >
                <Phone className="w-3.5 h-3.5 mr-2" />
                Call
              </Button>
            </div>
          )}
        </div>
      </div>

      <FullScreenMediaViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        media={media.map(url => ({ url, type: 'image' }))}
        initialIndex={imgIndex}
      />
    </Card>
  );
}
