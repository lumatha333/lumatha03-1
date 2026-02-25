import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, ShoppingBag, Briefcase, Home as HomeIcon, SlidersHorizontal, Sliders, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SwipeableTabs } from '@/components/SwipeableTabs';
import { MarketplaceListingCard } from '@/components/marketplace/MarketplaceListingCard';
import { MarketplaceCreateDialog } from '@/components/marketplace/MarketplaceCreateDialog';
import { MarketplaceCommentsDialog } from '@/components/marketplace/MarketplaceCommentsDialog';
import { MarketplaceController } from '@/components/marketplace/MarketplaceController';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'all', label: 'All', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { id: 'sell', label: 'Buy', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  { id: 'job', label: 'Jobs', icon: <Briefcase className="w-3.5 h-3.5" /> },
  { id: 'rent', label: 'Rent', icon: <HomeIcon className="w-3.5 h-3.5" /> },
  { id: 'controller', label: 'Me', icon: <Sliders className="w-3.5 h-3.5" /> },
];

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedSet, setLikedSet] = useState<Set<string>>(new Set());
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editListing, setEditListing] = useState<any>(null);
  const [commentListingId, setCommentListingId] = useState('');
  const [commentOpen, setCommentOpen] = useState(false);

  const fetchListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase.from('marketplace_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });

    if (activeTab !== 'all' && activeTab !== 'controller') {
      query = query.eq('type', activeTab);
    }

    if (searchQuery.trim()) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
    }

    const { data } = await query.limit(50);

    if (data) {
      // Fetch profiles
      const userIds = [...new Set(data.map(d => d.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, username').in('id', userIds);
      const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
      const enriched = data.map(d => ({ ...d, profiles: profileMap[d.user_id] }));
      setListings(enriched);

      // Likes
      const ids = data.map(d => d.id);
      const { data: myLikes } = await supabase.from('marketplace_likes').select('listing_id').eq('user_id', user.id).in('listing_id', ids);
      setLikedSet(new Set((myLikes || []).map(l => l.listing_id)));

      // Saved
      const { data: mySaved } = await supabase.from('marketplace_saved').select('listing_id').eq('user_id', user.id).in('listing_id', ids);
      setSavedSet(new Set((mySaved || []).map(s => s.listing_id)));

      // Count likes per listing
      const counts: Record<string, number> = {};
      for (const d of data) counts[d.id] = d.likes_count || 0;
      setLikeCounts(counts);

      const cCounts: Record<string, number> = {};
      for (const d of data) cCounts[d.id] = d.comments_count || 0;
      setCommentCounts(cCounts);
    }

    setLoading(false);
  }, [user, activeTab, searchQuery]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const toggleLike = async (id: string) => {
    if (!user) return;
    const liked = likedSet.has(id);
    if (liked) {
      await supabase.from('marketplace_likes').delete().eq('user_id', user.id).eq('listing_id', id);
      setLikedSet(prev => { const n = new Set(prev); n.delete(id); return n; });
      setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
    } else {
      await supabase.from('marketplace_likes').insert({ user_id: user.id, listing_id: id });
      setLikedSet(prev => new Set(prev).add(id));
      setLikeCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    }
  };

  const toggleSave = async (id: string) => {
    if (!user) return;
    const saved = savedSet.has(id);
    if (saved) {
      await supabase.from('marketplace_saved').delete().eq('user_id', user.id).eq('listing_id', id);
      setSavedSet(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      await supabase.from('marketplace_saved').insert({ user_id: user.id, listing_id: id });
      setSavedSet(prev => new Set(prev).add(id));
    }
  };

  const deleteListing = async (id: string) => {
    await supabase.from('marketplace_listings').delete().eq('id', id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/marketplace?listing=${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Check out this listing', url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const renderListings = () => {
    if (loading) return Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />);
    if (listings.length === 0) return (
      <div className="text-center py-12">
        <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No listings found</p>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-3 gap-1">
          <Plus className="w-4 h-4" />Post something
        </Button>
      </div>
    );
    return listings.map(l => (
      <MarketplaceListingCard
        key={l.id}
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
        onChat={(userId) => navigate(`/chat/${userId}`)}
        onDelete={deleteListing}
        onEdit={(listing) => { setEditListing(listing); setCreateOpen(true); }}
        onViewProfile={(userId) => navigate(`/profile/${userId}`)}
      />
    ));
  };

  return (
    <div className="space-y-3 pb-20">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search listings, locations, categories..."
            className="pl-9 text-sm h-9"
          />
        </div>
        <Button size="sm" onClick={() => { setEditListing(null); setCreateOpen(true); }} className="h-9 gap-1">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Post</span>
        </Button>
      </div>

      {/* Swipeable tabs */}
      <SwipeableTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
        {/* All */}
        <div className="space-y-3">{activeTab === 'all' && renderListings()}</div>
        {/* Sell/Buy */}
        <div className="space-y-3">{activeTab === 'sell' && renderListings()}</div>
        {/* Jobs */}
        <div className="space-y-3">{activeTab === 'job' && renderListings()}</div>
        {/* Rent */}
        <div className="space-y-3">{activeTab === 'rent' && renderListings()}</div>
        {/* Controller */}
        <div>{activeTab === 'controller' && <MarketplaceController />}</div>
      </SwipeableTabs>

      {/* Dialogs */}
      <MarketplaceCreateDialog
        open={createOpen}
        onOpenChange={(o) => { setCreateOpen(o); if (!o) setEditListing(null); }}
        editListing={editListing}
        onSuccess={fetchListings}
      />

      <MarketplaceCommentsDialog
        open={commentOpen}
        onOpenChange={setCommentOpen}
        listingId={commentListingId}
        onCountChange={(count) => setCommentCounts(prev => ({ ...prev, [commentListingId]: count }))}
      />
    </div>
  );
}
