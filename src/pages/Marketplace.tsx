import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, MapPin, ChevronRight, MessageCircle, X, ArrowLeft,
  ShoppingBag, Briefcase, Home as HomeIcon, Loader2, Sparkles, 
  Share2, Bookmark, Heart, Phone, ChevronLeft, AlertTriangle, Star, ImagePlus, Check, MoreVertical, Edit3, Trash2, Clock, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { MarketplaceCommentsDialog } from '@/components/marketplace/MarketplaceCommentsDialog';
import { MarketplaceGalleryCard } from '@/components/marketplace/MarketplaceGalleryCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { validateMarketplaceAccess } from '@/lib/marketplaceValidation';
import { useRouteLoadTrace } from '@/hooks/useRouteLoadTrace';

import { ListingTypeSelector, LISTING_TYPES } from '@/components/marketplace/ListingTypeSelector';
import { SellForm } from '@/components/marketplace/forms/SellForm';
import { BuyForm } from '@/components/marketplace/forms/BuyForm';
import { RentForm } from '@/components/marketplace/forms/RentForm';
import { JobForm } from '@/components/marketplace/forms/JobForm';
import { ApplyForm } from '@/components/marketplace/forms/ApplyForm';
import { ServiceForm } from '@/components/marketplace/forms/ServiceForm';

// ===== CONSTANTS =====
// Global marketplace categories with multi-country support
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '🏪' },
  { id: 'sell', label: 'Buy/Sell', icon: '🛍️' },
  { id: 'buy', label: 'Wanted', icon: '🔍' },
  { id: 'job', label: 'Jobs', icon: '💼' },
  { id: 'apply', label: 'Applicants', icon: '📄' },
  { id: 'rent', label: 'Rent', icon: '🏠' },
  { id: 'service', label: 'Services', icon: '🛠️' },
  { id: 'electronics', label: 'Electronics', icon: '📱' },
  { id: 'books', label: 'Books', icon: '📚' },
];

// Premium global marketplace with 20+ countries and major cities
const COUNTRIES_LIST = [
  { name: 'Nepal', code: 'NP', cities: ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar'] },
  { name: 'India', code: 'IN', cities: ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Jaipur'] },
  { name: 'United States', code: 'US', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Seattle', 'Austin', 'Boston'] },
  { name: 'United Kingdom', code: 'UK', cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh', 'Oxford'] },
  { name: 'Canada', code: 'CA', cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg'] },
  { name: 'Australia', code: 'AU', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra'] },
  { name: 'Germany', code: 'DE', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart', 'Dusseldorf'] },
  { name: 'France', code: 'FR', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille'] },
  { name: 'Japan', code: 'JP', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka'] },
  { name: 'Thailand', code: 'TH', cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Samui', 'Rayong'] },
  { name: 'Pakistan', code: 'PK', cities: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Multan'] },
  { name: 'Sri Lanka', code: 'LK', cities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo'] },
  { name: 'Bangladesh', code: 'BD', cities: ['Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet'] },
  { name: 'Indonesia', code: 'ID', cities: ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'] },
  { name: 'Malaysia', code: 'MY', cities: ['Kuala Lumpur', 'George Town', 'Johor Bahru', 'Shah Alam'] },
  { name: 'Mexico', code: 'MX', cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancun', 'Playa del Carmen'] },
  { name: 'Brazil', code: 'BR', cities: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia', 'Salvador', 'Fortaleza'] },
  { name: 'South Korea', code: 'KR', cities: ['Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon'] },
  { name: 'Singapore', code: 'SG', cities: ['Singapore', 'Marina Bay', 'Sentosa'] },
  { name: 'United Arab Emirates', code: 'AE', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
]

const CATEGORY_PILLS = [
  '📱 Electronics', '👕 Clothing', '🍕 Food', '🏠 Property', '🚗 Vehicles',
  '📚 Books', '🎮 Gaming', '🛠️ Services', '💄 Beauty', '🌿 Plants', '🎵 Music', '📦 Other'
];

const CONDITION_OPTIONS = ['✨ New', '👍 Like New', '📦 Used'];
const PAYMENT_METHODS = ['💵 Cash', '📱 eSewa', '📱 Khalti', '🏦 Bank Transfer'];

const TYPE_STYLE: Record<string, { accent: string; label: string }> = {
  sell: { accent: 'text-emerald-500 dark:text-emerald-400', label: '🛍️ For Sale' },
  buy: { accent: 'text-blue-500 dark:text-blue-400', label: '🔍 Wanted' },
  job: { accent: 'text-violet-500 dark:text-violet-400', label: '💼 Hiring' },
  rent: { accent: 'text-amber-500 dark:text-amber-400', label: '🏠 For Rent' },
  apply: { accent: 'text-pink-500 dark:text-pink-400', label: '📄 Seeking Work' },
  service: { accent: 'text-teal-500 dark:text-teal-400', label: '🛠️ Service' },
};

const CONDITION_COLORS: Record<string, string> = {
  'New': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  'Like New': 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
  'Used': 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
};

// ===== MARKETPLACE PAGE =====
export default function Marketplace() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Track route performance for Marketplace page
  useRouteLoadTrace('Marketplace', 250);
  
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [editListing, setEditListing] = useState<any>(null);
  const [detailListing, setDetailListing] = useState<any>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentListingId, setCommentListingId] = useState('');
  const [detectedLocation, setDetectedLocation] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from('marketplace_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });

    if (activeCategory === 'sell' || activeCategory === 'buy' || activeCategory === 'job' || activeCategory === 'rent' || activeCategory === 'apply' || activeCategory === 'service') {
      query = query.eq('type', activeCategory);
    } else if (activeCategory !== 'all') {
      query = query.ilike('category', `%${activeCategory}%`);
    }

    if (debouncedSearch.trim()) {
      query = query.or(`title.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,location.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
    }

    const { data } = await query.limit(50);
    if (data) {
      const userIds = [...new Set(data.map(d => d.user_id))];
      const [{ data: profiles }, { data: mpProfiles }] = await Promise.all([
        supabase.from('profiles').select('id, name, avatar_url, username').in('id', userIds),
        supabase.from('marketplace_profiles').select('user_id, is_phone_verified, location, username, phone, whatsapp, show_phone_to, whatsapp_same').in('user_id', userIds),
      ]);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      const mpMap = Object.fromEntries((mpProfiles || []).map((p: any) => [p.user_id, p]));
      setListings(data.map(d => ({ ...d, profiles: profileMap[d.user_id], mp_profile: mpMap[d.user_id] })));

      const ids = data.map(d => d.id);
      if (ids.length) {
        const [{ data: myLikes }, { data: mySaved }] = await Promise.all([
          supabase.from('marketplace_likes').select('listing_id').eq('user_id', user.id).in('listing_id', ids),
          supabase.from('marketplace_saved').select('listing_id').eq('user_id', user.id).in('listing_id', ids),
        ]);
        setLikedSet(new Set((myLikes || []).map(l => l.listing_id)));
        setSavedSet(new Set((mySaved || []).map(s => s.listing_id)));
      }
    }
    setLoading(false);
  }, [user, activeCategory, debouncedSearch]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  useEffect(() => {
    const listingId = searchParams.get('listing');
    if (listingId && listings.length > 0) {
      const found = listings.find(l => l.id === listingId);
      if (found) setDetailListing(found);
    }
  }, [searchParams, listings]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    let isCancelled = false;
    setDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        if (isCancelled) return;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
          );

          if (!response.ok) throw new Error('Location lookup failed');
          const data = await response.json();
          const city = data?.address?.city || data?.address?.town || data?.address?.village || data?.address?.county;
          const country = data?.address?.country;
          const label = [city, country].filter(Boolean).join(', ');
          setDetectedLocation(label || `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        } catch {
          setDetectedLocation(`${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        } finally {
          if (!isCancelled) {
            setDetectingLocation(false);
          }
        }
      },
      () => {
        if (!isCancelled) {
          setDetectingLocation(false);
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  const toggleSave = async (id: string) => {
    if (!user) return;
    if (savedSet.has(id)) {
      await supabase.from('marketplace_saved').delete().eq('user_id', user.id).eq('listing_id', id);
      setSavedSet(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      await supabase.from('marketplace_saved').insert({ user_id: user.id, listing_id: id });
      setSavedSet(prev => new Set(prev).add(id));
    }
  };

  const toggleLike = async (id: string) => {
    if (!user) return;
    const wasLiked = likedSet.has(id);

    setListings(prev => prev.map(l => {
      if (l.id !== id) return l;
      const nextCount = Math.max(0, (l.likes_count || 0) + (wasLiked ? -1 : 1));
      return { ...l, likes_count: nextCount };
    }));
    setDetailListing(prev => {
      if (!prev || prev.id !== id) return prev;
      const nextCount = Math.max(0, (prev.likes_count || 0) + (wasLiked ? -1 : 1));
      return { ...prev, likes_count: nextCount };
    });

    if (likedSet.has(id)) {
      await supabase.from('marketplace_likes').delete().eq('user_id', user.id).eq('listing_id', id);
      setLikedSet(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      await supabase.from('marketplace_likes').insert({ user_id: user.id, listing_id: id });
      setLikedSet(prev => new Set(prev).add(id));
    }
  };

  const handleChat = (userId: string, listingId: string, title: string) => {
    navigate(`/chat/${userId}?listing=${listingId}&msg=${encodeURIComponent(`Hi! I'm interested in "${title}". Is it still available?`)}`);
  };

  const handleShare = async (listing: any) => {
    const url = `${window.location.origin}/marketplace?listing=${listing.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: listing.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const reportListing = (listing: any) => {
    toast.success(`Report submitted for \"${listing.title}\". Our team will review it.`);
  };

  const deleteListing = async (id: string) => {
    await supabase.from('marketplace_listings').delete().eq('id', id);
    setListings(prev => prev.filter(l => l.id !== id));
    setDetailListing(null);
    toast.success('Listing deleted');
  };

  const handleOpenCreate = async () => {
    const validation = await validateMarketplaceAccess(user?.id);

    if (!validation.canPost) {
      if (validation.requiresSetup) {
        toast.error(validation.reason);
        if (validation.setupUrl) {
          navigate(validation.setupUrl);
        }
      } else {
        toast.error(validation.reason);
      }
      return;
    }

    // Can post, but maybe not verified
    if (validation.requiresPhone && !validation.isPhoneVerified) {
      toast.info('⚠️ Posting as unverified. Verify phone for trusted badge.');
    }

    setEditListing(null);
    setCreateOpen(true);
  };

  const buildCardListing = (listing: any) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    media_urls: listing.media_urls,
    price: listing.price,
    type: listing.type,
    location: listing.location || listing.mp_profile?.location || '',
    created_at: listing.created_at,
    user_id: listing.user_id,
    seller: {
      name: listing.mp_profile?.username || listing.profiles?.name || 'Seller',
      avatar_url: listing.profiles?.avatar_url,
      verified: listing.mp_profile?.is_phone_verified || false,
      phone: listing.mp_profile?.phone,
      whatsapp: listing.mp_profile?.whatsapp,
      showPhoneTo: listing.mp_profile?.show_phone_to,
    },
    isLiked: likedSet.has(listing.id),
    isSaved: savedSet.has(listing.id),
    likesCount: listing.likes_count || 0,
    commentsCount: listing.comments_count || 0,
  });

  const featuredListing = listings[0] || null;
  const gridListings = listings.slice(1);

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Top Bar - Profile Left, Search Middle, + Button Right */}
      <div className="relative z-10 px-3 md:px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          {/* Profile Pic with dropdown arrow */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/marketplace/profile/${user?.id}`)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground transition-colors overflow-hidden shrink-0"
            >
              <Avatar className="w-9 h-9">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="text-[11px] font-bold bg-secondary text-foreground">
                  {profile?.name?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </div>

          {/* Search Bar - curved like quests */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search listings, locations..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-sm text-foreground bg-card border border-border placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* + Button */}
          <button
            onClick={handleOpenCreate}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {(detectingLocation || detectedLocation) && (
          <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{detectingLocation ? 'Detecting your location...' : `Near ${detectedLocation}`}</span>
          </div>
        )}
      </div>

      {/* Category pills — horizontal scroll */}
      <div className="px-0 md:px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar story-circles-row pb-1">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 transition-colors active:scale-95",
                  isActive
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                <span className="text-sm leading-none">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Listings */}
      <div className="px-0 md:px-4 pb-6">
        {loading ? (
          <div className="space-y-4">
            <div className="rounded-2xl overflow-hidden animate-pulse bg-card border border-border">
              <div className="aspect-square bg-secondary" />
              <div className="p-4 space-y-2">
                <div className="h-4 rounded bg-secondary w-2/3" />
                <div className="h-3 rounded bg-secondary w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse bg-card border border-border">
                  <div className="aspect-square bg-secondary" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 rounded bg-secondary w-3/4" />
                    <div className="h-3 rounded bg-secondary w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-3">
              {activeCategory === 'job' ? '💼' : activeCategory === 'rent' ? '🏠' : '🛍️'}
            </div>
            <p className="text-lg font-bold text-foreground">
              No {activeCategory === 'all' ? '' : activeCategory} listings yet
            </p>
            <p className="text-sm mt-1 text-muted-foreground">Be the first to post!</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-6 py-3 rounded-full font-semibold text-primary-foreground bg-primary text-sm transition-all active:scale-95"
            >
              Post Listing →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-semibold text-foreground">Marketplace listings</h2>
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearch('');
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                See all →
              </button>
            </div>

            {featuredListing && (
              <MarketplaceGalleryCard
                listing={buildCardListing(featuredListing)}
                variant="featured"
                currentUserId={user?.id}
                onTap={() => setDetailListing(featuredListing)}
                onLike={() => toggleLike(featuredListing.id)}
                onSave={() => toggleSave(featuredListing.id)}
                onShare={() => handleShare(featuredListing)}
                onComment={() => { setCommentListingId(featuredListing.id); setCommentOpen(true); }}
                onMessage={() => handleChat(featuredListing.user_id, featuredListing.id, featuredListing.title)}
                onEdit={featuredListing.user_id === user?.id ? () => { setEditListing(featuredListing); setCreateOpen(true); } : undefined}
                onDelete={featuredListing.user_id === user?.id ? () => deleteListing(featuredListing.id) : undefined}
                onReport={featuredListing.user_id !== user?.id ? () => reportListing(featuredListing) : undefined}
                onWhatsApp={() => {
                  const whatsapp = featuredListing.mp_profile?.whatsapp || featuredListing.mp_profile?.phone;
                  if (whatsapp) {
                    window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
                  }
                }}
                onPhone={() => {
                  if (featuredListing.mp_profile?.phone) {
                    window.location.href = `tel:${featuredListing.mp_profile.phone}`;
                  }
                }}
              />
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gridListings.map(listing => (
                <MarketplaceGalleryCard
                  key={listing.id}
                  listing={buildCardListing(listing)}
                  variant="compact"
                  currentUserId={user?.id}
                  onTap={() => setDetailListing(listing)}
                  onLike={() => toggleLike(listing.id)}
                  onSave={() => toggleSave(listing.id)}
                  onShare={() => handleShare(listing)}
                  onComment={() => { setCommentListingId(listing.id); setCommentOpen(true); }}
                  onMessage={() => handleChat(listing.user_id, listing.id, listing.title)}
                  onEdit={listing.user_id === user?.id ? () => { setEditListing(listing); setCreateOpen(true); } : undefined}
                  onDelete={listing.user_id === user?.id ? () => deleteListing(listing.id) : undefined}
                  onReport={listing.user_id !== user?.id ? () => reportListing(listing) : undefined}
                  onWhatsApp={() => {
                    const whatsapp = listing.mp_profile?.whatsapp || listing.mp_profile?.phone;
                    if (whatsapp) {
                      window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
                    }
                  }}
                  onPhone={() => {
                    if (listing.mp_profile?.phone) {
                      window.location.href = `tel:${listing.mp_profile.phone}`;
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {detailListing && (
        <ListingDetail
          listing={detailListing}
          isLiked={likedSet.has(detailListing.id)}
          isSaved={savedSet.has(detailListing.id)}
          currentUserId={user?.id || ''}
          onClose={() => setDetailListing(null)}
          onLike={() => toggleLike(detailListing.id)}
          onSave={() => toggleSave(detailListing.id)}
          onShare={() => handleShare(detailListing)}
          onChat={() => handleChat(detailListing.user_id, detailListing.id, detailListing.title)}
          onDelete={() => deleteListing(detailListing.id)}
          onEdit={() => { setEditListing(detailListing); setDetailListing(null); setCreateOpen(true); }}
          onViewProfile={() => { setDetailListing(null); navigate(`/marketplace/profile/${detailListing.user_id}`); }}
          onComment={() => { setCommentListingId(detailListing.id); setCommentOpen(true); }}
        />
      )}

      {createOpen && (
        <CreateListingSheet
          editListing={editListing}
          defaultDetectedLocation={detectedLocation}
          onClose={() => { setCreateOpen(false); setEditListing(null); }}
          onSuccess={() => { setCreateOpen(false); setEditListing(null); fetchListings(); }}
        />
      )}

      <MarketplaceCommentsDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        listingId={commentListingId}
        onCountChange={() => {}}
      />
    </div>
  );
}

// ===== IMAGE CAROUSEL (Instagram-style swipe) =====
function ImageCarousel({ images, aspectRatio = 'aspect-[4/3]' }: { images: string[]; aspectRatio?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIdx(idx);
  }, []);

  if (images.length === 0) return null;

  return (
    <div className="relative bg-secondary">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn("flex overflow-x-auto snap-x snap-mandatory scrollbar-hide", aspectRatio)}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={cn("w-full object-cover snap-center shrink-0", aspectRatio)}
            loading={i === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>
      {images.length > 1 && (
        <>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            {images.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-200 h-[5px]",
                  i === activeIdx ? "w-3 bg-white" : "w-[5px] bg-white/40"
                )}
              />
            ))}
          </div>
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-black/50 backdrop-blur-sm">
            {activeIdx + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}

// ===== FEED LISTING CARD (single column, like Instagram/Thread) =====
function FeedListingCard({ listing, isLiked, isSaved, onTap, onLike, onSave, onShare, onComment }: {
  listing: any; isLiked: boolean; isSaved: boolean;
  onTap: () => void; onLike: () => void; onSave: () => void; onShare: () => void; onComment: () => void;
}) {
  const media = listing.media_urls || [];
  const extra = (listing.extra_data || {}) as any;
  const lType = listing.type;
  const typeStyle = TYPE_STYLE[lType] || TYPE_STYLE.sell;
  const condition = listing.condition || extra?.condition || null;

  return (
    <div className="overflow-hidden bg-card border-y border-border">
      {/* Header: user info */}
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        <Avatar className="w-8 h-8 shrink-0 bg-secondary">
          <AvatarImage src={listing.profiles?.avatar_url || undefined} className="object-cover" />
          <AvatarFallback className="text-xs font-bold text-muted-foreground bg-transparent">
            {listing.profiles?.name?.[0] || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{listing.mp_profile?.username || listing.profiles?.name || 'Unknown'}</p>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground overflow-hidden">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true }).replace('about ', '')}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span
              className={cn(
                'hidden sm:inline shrink-0 px-1.5 py-0.5 rounded-full border',
                listing.mp_profile?.is_phone_verified
                  ? 'text-emerald-500 border-emerald-500/40 bg-emerald-500/10'
                  : 'text-slate-400 border-slate-500/30 bg-slate-500/10',
              )}
            >
              {listing.mp_profile?.is_phone_verified ? 'verified' : 'unverified'}
            </span>
          </div>
        </div>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-card", typeStyle.accent)}>
          {typeStyle.label}
        </span>
      </div>

      {/* Details section: title, price, location */}
      <div className="px-4 pb-2">
        <button onClick={onTap} className="text-left w-full">
          <h3 className="text-[15px] font-bold text-foreground leading-snug">{listing.title}</h3>
        </button>

        {listing.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{listing.description}</p>
        )}

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {lType === 'sell' && listing.price != null && (
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">NPR {listing.price.toLocaleString()}</span>
          )}
          {lType === 'rent' && listing.price != null && (
            <span className="text-base font-bold text-amber-600 dark:text-amber-400">NPR {listing.price.toLocaleString()}<span className="text-[10px] font-normal">/mo</span></span>
          )}
          {lType === 'service' && listing.price != null && (
            <span className="text-base font-bold text-teal-600 dark:text-teal-400">NPR {listing.price.toLocaleString()}{extra.pricingModel === '⏰ Per Hour' ? '/hr' : extra.pricingModel === '📅 Per Day' ? '/day' : ''}</span>
          )}
          {lType === 'buy' && (
            <span className="text-sm text-blue-600 dark:text-blue-400">{extra.anyBudget ? 'Any budget' : (extra.budgetMin || extra.budgetMax) ? `NPR ${extra.budgetMin || '?'} — ${extra.budgetMax || '?'}` : ''}</span>
          )}
          {lType === 'job' && listing.salary_range && (
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{listing.salary_range}</span>
          )}
          {lType === 'apply' && extra.roleSeeking && (
            <span className="text-sm text-pink-600 dark:text-pink-400">{extra.roleSeeking}</span>
          )}
          {listing.negotiable && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">🤝 Negotiable</span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {condition && (
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border font-medium", CONDITION_COLORS[condition.replace(/[^\w\s]/g, '').trim()] || 'bg-secondary text-muted-foreground border-border')}>
              {condition}
            </span>
          )}
          {listing.category && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">📦 {listing.category}</span>
          )}
          {listing.location && (
            <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
              <MapPin className="w-3 h-3" />{listing.location.split(',')[0]}
            </span>
          )}
        </div>
      </div>

      {/* Photos (Instagram-style carousel) */}
      {media.length > 0 && (
        <ImageCarousel images={media} aspectRatio="aspect-[4/3]" />
      )}

      {/* Action bar: like, comment, share, save */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-0.5">
          <button onClick={onLike} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Heart className={cn("w-5 h-5", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
          <button onClick={onComment} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={onShare} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <button onClick={onSave} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Bookmark className={cn("w-5 h-5", isSaved ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      </div>
    </div>
  );
}

// ===== LISTING DETAIL (info top → photos → actions) =====
function ListingDetail({ listing, isLiked, isSaved, currentUserId, onClose, onLike, onSave, onShare, onChat, onDelete, onEdit, onViewProfile, onComment }: {
  listing: any; isLiked: boolean; isSaved: boolean; currentUserId: string;
  onClose: () => void; onLike: () => void; onSave: () => void; onShare: () => void; onChat: () => void;
  onDelete: () => void; onEdit: () => void; onViewProfile: () => void; onComment: () => void;
}) {
  const media = listing.media_urls || [];
  const isOwner = listing.user_id === currentUserId;
  const typeStyle = TYPE_STYLE[listing.type] || TYPE_STYLE.sell;
  const condition = listing.condition || null;
  const extra = (listing.extra_data || {}) as any;
  const paymentMethods = listing.payment_methods || ['💵 Cash', '📱 eSewa', '📱 Khalti'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      {/* Top nav */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur-xl border-b border-border">
        <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center bg-card border border-border text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">Listing Details</span>
        <div className="w-9 h-9" />
      </div>

      {/* ── INFO SECTION (top) ── */}
      <div className="px-4 pt-4 pb-2">
        {/* Seller strip */}
        <button onClick={onViewProfile} className="flex items-center gap-2.5 mb-3 w-full">
          <Avatar className="w-10 h-10 shrink-0 bg-secondary">
            <AvatarImage src={listing.profiles?.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="text-sm font-bold text-muted-foreground bg-transparent">
              {listing.profiles?.name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{listing.profiles?.name || 'User'}</p>
            <p className="text-[11px] text-primary">View Profile →</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Title */}
        <h1 className="text-xl font-bold text-foreground leading-tight">{listing.title}</h1>

        {/* Price */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {listing.price != null && (
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              NPR {listing.price.toLocaleString()}
            </span>
          )}
          {listing.salary_range && (
            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{listing.salary_range}</span>
          )}
          {listing.negotiable && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              🤝 Negotiable
            </span>
          )}
        </div>

        {/* Tags: type, condition, category */}
        <div className="flex gap-1.5 mt-2.5 flex-wrap">
          <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border bg-card", typeStyle.accent)}>
            {typeStyle.label}
          </span>
          {condition && (
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", CONDITION_COLORS[condition] || 'bg-secondary text-muted-foreground border-border')}>
              {condition}
            </span>
          )}
          {listing.category && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground">📦 {listing.category}</span>
          )}
        </div>

        {/* Location & time */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground flex-wrap">
          {listing.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{listing.location}</span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}</span>
        </div>
      </div>

      {/* ── PHOTOS (below info) ── */}
      {media.length > 0 && (
        <div className="mt-2">
          <ImageCarousel images={media} aspectRatio="aspect-[4/3]" />
        </div>
      )}

      {/* ── ACTION BAR (below photos) ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-1">
          <button onClick={onLike} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Heart className={cn("w-5 h-5", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
          </button>
          <button onClick={onComment} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
          </button>
          <button onClick={onShare} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <button onClick={onSave} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <Bookmark className={cn("w-5 h-5", isSaved ? "fill-primary text-primary" : "text-muted-foreground")} />
        </button>
      </div>

      {/* ── MORE DETAILS ── */}
      <div className="px-4 pt-4 pb-32">
        {listing.description && (
          <>
            <h3 className="text-sm font-semibold text-foreground mb-1.5">About this listing</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{listing.description}</p>
            <div className="h-px my-4 bg-border" />
          </>
        )}

        {listing.type === 'job' && (listing.qualification || listing.salary_range) && (
          <>
            <h3 className="text-sm font-semibold text-foreground mb-2">Job Details</h3>
            <div className="space-y-1.5">
              {listing.salary_range && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Salary:</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">{listing.salary_range}</span>
                </div>
              )}
              {listing.qualification && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Qualification:</span>
                  <span className="font-semibold text-foreground">{listing.qualification}</span>
                </div>
              )}
              {extra.company && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-semibold text-foreground">{extra.company}</span>
                </div>
              )}
            </div>
            <div className="h-px my-4 bg-border" />
          </>
        )}

        <h3 className="text-sm font-semibold text-foreground mb-2">Payment Methods</h3>
        <div className="flex gap-1.5 flex-wrap">
          {paymentMethods.map((m: string) => (
            <span key={m} className="px-2.5 py-1.5 rounded-full text-xs bg-card border border-border text-muted-foreground">{m}</span>
          ))}
        </div>

        <div className="h-px my-4 bg-border" />

        {/* Safety Tips */}
        <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Safety Tips</span>
          </div>
          <ul className="text-xs space-y-1 pl-1 text-muted-foreground">
            <li>• Meet in public places</li>
            <li>• Don't pay before seeing item</li>
            <li>• Trust your instincts</li>
          </ul>
        </div>

        {isOwner && (
          <div className="mt-4 flex gap-2">
            <button onClick={onEdit} className="flex-1 py-3 rounded-xl text-sm font-semibold text-foreground bg-secondary border border-border transition-all active:scale-[0.98]">Edit Listing</button>
            <button onClick={onDelete} className="py-3 px-6 rounded-xl text-sm font-semibold bg-destructive/10 border border-destructive/20 text-destructive transition-all active:scale-95">Delete</button>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {!isOwner && (
        <div className="fixed bottom-0 left-0 right-0 px-4 py-3 flex gap-3 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
          <button onClick={onChat} className="flex-1 py-3.5 rounded-xl text-[15px] font-bold text-primary-foreground bg-primary flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
            <MessageCircle className="w-5 h-5" /> Message Seller
          </button>
        </div>
      )}
    </div>
  );
}

// ===== CREATE LISTING SHEET =====
function CreateListingSheet({ editListing, defaultDetectedLocation, onClose, onSuccess }: {
  editListing?: any; defaultDetectedLocation?: string; onClose: () => void; onSuccess: () => void;
}) {
  const { user, profile } = useAuth();
  const LOCATION_STORAGE_KEY = 'lumatha.marketplace.lastUsedLocation';
  const isEditing = !!editListing;
  const [step, setStep] = useState<'type' | 'form'>(isEditing ? 'form' : 'type');
  const [type, setType] = useState(editListing?.type || '');
  const [formData, setFormData] = useState<any>(() => {
    if (editListing) {
      const extra = editListing.extra_data || {};
      return { title: editListing.title || '', description: editListing.description || '', price: editListing.price?.toString() || '', location: editListing.location || '', category: editListing.category || '', condition: editListing.condition || '', negotiable: editListing.negotiable || false, paymentMethods: editListing.payment_methods || ['💵 Cash'], ...extra };
    }

    const rememberedLocation = typeof window !== 'undefined' ? window.localStorage.getItem(LOCATION_STORAGE_KEY) || '' : '';
    return { paymentMethods: ['💵 Cash'], location: rememberedLocation };
  });
  const [files, setFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>(editListing?.media_urls || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    if (!defaultDetectedLocation) return;
    if ((formData.location || '').trim()) return;

    setFormData((prev: any) => ({ ...prev, location: defaultDetectedLocation }));
  }, [defaultDetectedLocation, formData.location, isEditing]);

  useEffect(() => {
    const locationText = (formData.location || '').trim();
    if (!locationText) return;
    if (isEditing) return;

    try {
      window.localStorage.setItem(LOCATION_STORAGE_KEY, locationText);
    } catch {
      // Ignore localStorage write failure.
    }
  }, [LOCATION_STORAGE_KEY, formData.location, isEditing]);

  const typeInfo = LISTING_TYPES.find(t => t.id === type);
  const canPublish = type && (formData.title || '').trim() && (formData.location || isEditing);

  const handleSubmit = async () => {
    if (!user || !canPublish) return;
    setSaving(true);
    try {
      let mediaUrls = [...existingUrls];
      let mediaTypes: string[] = existingUrls.map(() => 'image');
      for (const file of files) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('marketplace-media').upload(path, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('marketplace-media').getPublicUrl(path);
        mediaUrls.push(publicUrl);
        mediaTypes.push(file.type.startsWith('video') ? 'video' : 'image');
      }
      let salaryRange = null;
      if ((type === 'job' || type === 'apply') && (formData.salaryMin || formData.salaryMax)) {
        salaryRange = `${formData.salaryMin || '?'}k-${formData.salaryMax || '?'}k/month`;
      }
      const { title, description, price, location, category, condition, negotiable, paymentMethods, ...extraFields } = formData;
      const payload: any = {
        type, title: (title || '').trim(), description: (description || '').trim() || null,
        price: price ? parseFloat(price) : null, location: (location || '').trim() || null,
        category: category || null, condition: condition || null, negotiable: negotiable || false,
        payment_methods: paymentMethods || ['💵 Cash'], salary_range: salaryRange,
        media_urls: mediaUrls, media_types: mediaTypes, extra_data: extraFields,
      };
      if (isEditing) { await supabase.from('marketplace_listings').update(payload).eq('id', editListing.id); }
      else { await supabase.from('marketplace_listings').insert({ ...payload, user_id: user.id }); }
      toast.success(isEditing ? 'Listing updated!' : 'Listing posted! 🎉');
      onSuccess();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between bg-background/95 backdrop-blur-xl border-b border-border">
        <button onClick={() => step === 'form' && !isEditing ? setStep('type') : onClose()} className="w-9 h-9 rounded-full flex items-center justify-center text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {step === 'type' ? 'New Listing' : isEditing ? 'Edit Listing' : (typeInfo?.title || 'Create')}
        </span>
        <div className="w-16" />
      </div>

      {step === 'type' && <ListingTypeSelector onSelect={(t) => { setType(t); setStep('form'); }} />}

      {step === 'form' && (
        <div className="px-4 py-3 pb-28">
          {!isEditing && !!defaultDetectedLocation && (
            <div className="mb-3 rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">Current location detected</p>
                  <p className="truncate text-xs text-muted-foreground">{defaultDetectedLocation}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev: any) => ({ ...prev, location: defaultDetectedLocation }));
                    try {
                      window.localStorage.setItem(LOCATION_STORAGE_KEY, defaultDetectedLocation);
                    } catch {
                      // Ignore localStorage write failure.
                    }
                  }}
                  className="shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                >
                  Use this
                </button>
              </div>
            </div>
          )}

          {type === 'sell' && <SellForm data={formData} onChange={setFormData} files={files} existingUrls={existingUrls} onFilesChange={setFiles} onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))} />}
          {type === 'buy' && <BuyForm data={formData} onChange={setFormData} />}
          {type === 'rent' && <RentForm data={formData} onChange={setFormData} files={files} existingUrls={existingUrls} onFilesChange={setFiles} onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))} />}
          {type === 'job' && <JobForm data={formData} onChange={setFormData} />}
          {type === 'apply' && <ApplyForm data={formData} onChange={setFormData} files={files} existingUrls={existingUrls} onFilesChange={setFiles} onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))} profileName={profile?.name} />}
          {type === 'service' && <ServiceForm data={formData} onChange={setFormData} files={files} existingUrls={existingUrls} onFilesChange={setFiles} onRemoveExisting={i => setExistingUrls(p => p.filter((_, idx) => idx !== i))} />}
        </div>
      )}

      {step === 'form' && (
        <div className="fixed bottom-0 left-0 right-0 px-5 py-3 z-10 bg-background/95 backdrop-blur-xl border-t border-border">
          <button onClick={handleSubmit} disabled={!canPublish || saving} className={cn(
            "w-full py-4 rounded-2xl text-base font-bold text-primary-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-all",
            canPublish ? "bg-primary" : "bg-muted text-muted-foreground"
          )} style={{ opacity: saving ? 0.5 : 1 }}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isEditing ? 'Update Listing' : 'Post Listing ✨'}
          </button>
        </div>
      )}
    </div>
  );
}
