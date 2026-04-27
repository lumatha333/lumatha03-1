import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, MapPin, ChevronRight, MessageCircle, X, ArrowLeft,
  ShoppingBag, Briefcase, Home as HomeIcon, Loader2, Sparkles, 
  Share2, Bookmark, Heart, Phone, ChevronLeft, AlertTriangle, Star, ImagePlus, Check, MoreVertical, Edit3, Trash2, Clock, ChevronDown, SearchX, SlidersHorizontal, Sliders } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { MarketplaceCommentsDialog } from '@/components/marketplace/MarketplaceCommentsDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { validateMarketplaceAccess } from '@/lib/marketplaceValidation';
import { useRouteLoadTrace } from '@/hooks/useRouteLoadTrace';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { MarketplaceCreateDialog } from '@/components/marketplace/MarketplaceCreateDialog';
import { MarketplaceController } from '@/components/marketplace/MarketplaceController';

// ===== CONSTANTS =====
const TABS = [
  { id: 'all', label: 'All', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { id: 'sell', label: 'Buy/Sell', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: 'job', label: 'Jobs', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'rent', label: 'Rent', icon: <HomeIcon className="w-3.5 h-3.5" /> },
  { id: 'controller', label: 'Me', icon: <Sliders className="w-3.5 h-3.5" /> },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
};

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  
  const [createOpen, setCreateOpen] = useState(false);
  const [editListing, setEditListing] = useState<any>(null);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentListingId, setCommentListingId] = useState<string | null>(null);

  useRouteLoadTrace('Marketplace');

  const fetchListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (activeTab !== 'all' && activeTab !== 'controller') {
        query = query.eq('type', activeTab);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      
      // Handle missing table or other schema errors gracefully
      if (error) {
        if (error.code === '42P01') { // undefined_table
          console.error('Marketplace table not found. Please run the SQL migration.');
          setListings([]);
          return;
        }
        throw error;
      }
      
      if (!data || data.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      // Fetch profiles separately to avoid join/relationship errors
      const userIds = [...new Set(data.map(d => d.user_id))];
      // Defensive select: only request columns we are reasonably sure exist, or handle failure
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, avatar_url, username')
        .in('id', userIds);
      
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      
      const enriched = data.map(d => ({ 
        ...d, 
        profiles: profileMap[d.user_id] || { name: 'User', avatar_url: null, username: null, id: d.user_id }
      }));
      setListings(enriched);

      // Fetch likes/saves for current user
      const ids = data.map(d => d.id);
      try {
        const [likesRes, savesRes] = await Promise.all([
          supabase.from('marketplace_likes').select('listing_id').eq('user_id', user.id).in('listing_id', ids),
          supabase.from('marketplace_saved').select('listing_id').eq('user_id', user.id).in('listing_id', ids)
        ]);
        
        setLikedSet(new Set((likesRes.data || []).map(l => l.listing_id)));
        setSavedSet(new Set((savesRes.data || []).map(s => s.listing_id)));
      } catch (err) {
        console.warn('Could not fetch likes/saves:', err);
      }

      // Populate counts
      const lCounts: Record<string, number> = {};
      const cCounts: Record<string, number> = {};
      data.forEach(l => {
        lCounts[l.id] = l.likes_count || 0;
        cCounts[l.id] = l.comments_count || 0;
      });
      setLikeCounts(lCounts);
      setCommentCounts(cCounts);

    } catch (err: any) {
      console.error('Marketplace fetch error:', err);
      // Only show toast for non-404 errors to avoid spamming if table is missing
      if (err.code !== '42P01') {
        toast.error(err.message || 'Error fetching marketplace data');
      }
    } finally {
      setLoading(false);
    }
  }, [user, activeTab, searchQuery]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle URL listing parameter
  useEffect(() => {
    const listingId = searchParams.get('listing');
    if (listingId && listings.length > 0) {
      // Logic for detail view could go here if needed
    }
  }, [searchParams, listings]);

  const toggleLike = async (id: string) => {
    if (!user) return navigate('/auth');
    
    const isLiked = likedSet.has(id);
    setLikedSet(prev => {
      const next = new Set(prev);
      if (isLiked) next.delete(id);
      else next.add(id);
      return next;
    });

    setLikeCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + (isLiked ? -1 : 1))
    }));

    if (isLiked) {
      await supabase.from('marketplace_likes').delete().eq('user_id', user.id).eq('listing_id', id);
    } else {
      await supabase.from('marketplace_likes').insert({ user_id: user.id, listing_id: id });
    }
  };

  const toggleSave = async (id: string) => {
    if (!user) return navigate('/auth');
    
    const isSaved = savedSet.has(id);
    setSavedSet(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    if (isSaved) {
      await supabase.from('marketplace_saved').delete().eq('user_id', user.id).eq('listing_id', id);
      toast.success('Removed from saved');
    } else {
      await supabase.from('marketplace_saved').insert({ user_id: user.id, listing_id: id });
      toast.success('Saved to collection');
    }
  };

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/marketplace?listing=${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this listing',
          url: url
        });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleChat = (userId: string, listingId: string) => {
    navigate(`/chat/${userId}?listing=${listingId}`);
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete listing');
    } else {
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing deleted');
    }
  };

  const handleOpenCreate = async () => {
    const validation = await validateMarketplaceAccess(user?.id);
    if (!validation.allowed) {
      toast.error(validation.message || 'You cannot post right now');
      return;
    }
    setEditListing(null);
    setCreateOpen(true);
  };

  const renderListings = () => {
    if (loading) return (
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
      </div>
    );
    
    if (listings.length === 0) return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <SearchX className="w-14 h-14 mx-auto text-muted-foreground/20 mb-4" />
        <p className="text-sm font-medium text-muted-foreground mb-1">No results found</p>
        <p className="text-xs text-muted-foreground/60 mb-6">Try a different search or category</p>
        <Button size="sm" onClick={handleOpenCreate} className="gap-2">
          <Plus className="w-4 h-4" />Post something new
        </Button>
      </motion.div>
    );

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4"
      >
        {listings.map(l => (
          <motion.div key={l.id} variants={itemVariants}>
            <MarketplaceListingCard
              listing={l}
              isLiked={likedSet.has(l.id)}
              isSaved={savedSet.has(l.id)}
              likesCount={likeCounts[l.id] || 0}
              commentsCount={commentCounts[l.id] || 0}
              currentUserId={user?.id || ''}
              onLike={toggleLike}
              onSave={toggleSave}
              onComment={(id) => { setCommentListingId(id); setCommentOpen(true); }}
              onShare={handleShare}
              onChat={handleChat}
              onDelete={deleteListing}
              onEdit={(listing) => { setEditListing(listing); setCreateOpen(true); }}
              onViewProfile={(userId) => navigate(`/marketplace/profile/${userId}`)}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-4">
      {/* Search & Post Bar */}
      <div className="flex gap-2 sticky top-4 z-40 bg-background/80 backdrop-blur-xl p-1 rounded-2xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search marketplace..."
            className="pl-9 h-10 bg-transparent border-0 focus-visible:ring-0"
          />
        </div>
        <Button onClick={handleOpenCreate} className="h-10 px-4 gap-2 bg-primary hover:opacity-90 rounded-xl shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/50 border overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap flex-1 justify-center text-xs font-bold uppercase tracking-wider",
              activeTab === tab.id
                ? "bg-background text-primary shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'controller' ? (
          <MarketplaceController />
        ) : (
          renderListings()
        )}
      </div>

      <MarketplaceCreateDialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditListing(null);
        }}
        editListing={editListing}
        onSuccess={() => {
          setCreateOpen(false);
          setEditListing(null);
          fetchListings();
        }}
      />

      <MarketplaceCommentsDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        listingId={commentListingId || ''}
        onCountChange={() => fetchListings()}
      />
    </div>
  );
}
