import { useMemo, useState } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

type SortOption = 'recent' | 'most-liked' | 'most-saved';

export default function Liked() {
  const { posts, saved, toggleSave, toggleLike, deletePost, updatePost, likes, likesCount } = useSupabaseData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const likedPostIds = useMemo(() => new Set(likes.map((entry) => entry.post_id)), [likes]);

  const filteredPosts = useMemo(() => {
    let filtered = posts.filter((post) => likedPostIds.has(post.id));

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchLower) ||
          post.content?.toLowerCase().includes(searchLower) ||
          post.category?.toLowerCase().includes(searchLower) ||
          post.subcategory?.toLowerCase().includes(searchLower) ||
          post.profiles?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (sortBy === 'most-liked') {
      filtered = [...filtered].sort((a, b) => (likesCount[b.id] || 0) - (likesCount[a.id] || 0));
    }

    return filtered;
  }, [posts, likedPostIds, search, sortBy, likesCount]);

  return (
    <div className="space-y-6 p-2 md:p-4">
      <h1 className="text-3xl md:text-4xl font-black flex items-center gap-2">
        ❤️ Liked Posts
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search liked posts..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-10 glass-card border-border"
        />
      </div>

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

      <div className="grid grid-cols-1 gap-3">
        {filteredPosts.length === 0 ? (
          <div className="col-span-full">
            <div className="glass-card hover-lift border-border p-8 md:p-12 text-center">
              <p className="text-muted-foreground">No liked posts yet. Like posts to keep them here.</p>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <EnhancedPostCard
              key={post.id}
              post={post}
              isSaved={saved.includes(post.id)}
              isLiked={likedPostIds.has(post.id)}
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
