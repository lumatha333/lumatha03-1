import { useState, useMemo } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { PostCard } from '@/components/PostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type SortOption = 'recent' | 'most-liked' | 'most-saved';

export default function Saved() {
  const { posts, saved, toggleSave, toggleLike, deletePost, updatePost, likes, likesCount } = useSupabaseData();
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const filteredPosts = useMemo(() => {
    let filtered = posts.filter((p) => saved.includes(p.id));

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title?.toLowerCase().includes(searchLower) ||
          p.content?.toLowerCase().includes(searchLower) ||
          p.category?.toLowerCase().includes(searchLower) ||
          p.subcategory?.toLowerCase().includes(searchLower) ||
          p.profiles?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (sortBy === 'most-liked') {
      filtered = [...filtered].sort((a, b) => (likesCount[b.id] || 0) - (likesCount[a.id] || 0));
    } else if (sortBy === 'most-saved') {
      // Already filtered by saved, so just keep order
    }

    return filtered;
  }, [posts, saved, search, sortBy, likesCount]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2">
        ⭐ Saved Posts
      </h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search saved posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 glass-card border-border"
        />
      </div>

      {/* Sort Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={sortBy === 'recent' ? 'default' : 'outline'}
          onClick={() => setSortBy('recent')}
          className="rounded-full text-xs md:text-sm"
        >
          Recent
        </Button>
        <Button
          variant={sortBy === 'most-liked' ? 'default' : 'outline'}
          onClick={() => setSortBy('most-liked')}
          className="rounded-full text-xs md:text-sm"
        >
          Most Liked
        </Button>
        <Button
          variant={sortBy === 'most-saved' ? 'default' : 'outline'}
          onClick={() => setSortBy('most-saved')}
          className="rounded-full text-xs md:text-sm"
        >
          Most Saved
        </Button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full">
            <div className="glass-card hover-lift border-border p-8 md:p-12 text-center">
              <p className="text-muted-foreground">No saved posts yet. Start saving your favorites!</p>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isSaved={saved.includes(post.id)}
              isLiked={likes.some(l => l.post_id === post.id)}
              likesCount={likesCount[post.id] || 0}
              currentUserId={user?.id || ''}
              onToggleSave={toggleSave}
              onToggleLike={toggleLike}
              onDelete={deletePost}
              onUpdate={updatePost}
            />
          ))
        )}
      </div>
    </div>
  );
}
