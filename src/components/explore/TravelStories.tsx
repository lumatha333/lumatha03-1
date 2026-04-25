import { useMemo, useState } from 'react';
import { Bookmark, ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCardSkeleton, FeedSkeleton } from '@/components/ui/skeleton-loaders';
import { toast } from 'sonner';
import { useTravelStories } from '@/hooks/useTravelStories';
import { CreateTravelStory } from '@/components/explore/CreateTravelStory';
import { AdventureCommentsDialog } from '@/components/AdventureCommentsDialog';
import { StoryReader } from '@/components/adventure/StoryReader';

const FALLBACK_STORY_IMAGE = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80&auto=format&fit=crop';

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Just now';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function TravelStories() {
  const { stories, loading, error, createStory, likeStory, saveStory } = useTravelStories();
  const [createOpen, setCreateOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [selectedStoryTitle, setSelectedStoryTitle] = useState('');
  const [carouselIndexByStory, setCarouselIndexByStory] = useState<Record<string, number>>({});
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerStoryId, setReaderStoryId] = useState<string | null>(null);

  const sortedStories = useMemo(
    () => [...stories].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [stories],
  );

  const getCurrentIndex = (storyId: string, photosCount: number) => {
    const current = carouselIndexByStory[storyId] || 0;
    if (current >= photosCount) return 0;
    return current;
  };

  const goToPhoto = (storyId: string, direction: 'prev' | 'next', total: number) => {
    setCarouselIndexByStory((prev) => {
      const current = prev[storyId] || 0;
      const next = direction === 'next' ? (current + 1) % total : (current - 1 + total) % total;
      return { ...prev, [storyId]: next };
    });
  };

  const readerStory = useMemo(() => {
    if (!readerStoryId) return null;
    const story = sortedStories.find((item) => item.id === readerStoryId);
    if (!story) return null;
    return {
      id: story.id,
      title: story.title || 'Travel Story',
      content: story.description || '',
      location: story.location || 'Unknown',
      image: story.photos?.[0] || FALLBACK_STORY_IMAGE,
      author: story.profiles.username || story.profiles.username || 'Traveler',
      authorAvatar: (story.profiles.username || story.profiles.username || 'T').charAt(0).toUpperCase(),
      createdAt: story.created_at,
      likes: story.likes_count,
      comments: story.comments_count,
      photos: story.photos,
    };
  }, [readerStoryId, sortedStories]);

  return (
    <div className="space-y-4 [touch-action:pan-y]">
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/80 p-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Travel Stories</h2>
          <p className="text-sm text-muted-foreground">Share your journey and discover new places.</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)} className="gap-1.5 touch-manipulation">
          <Plus className="h-4 w-4" />
          Share Story
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setCreateOpen(true)}
        className="group relative w-full overflow-hidden rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-left transition-all duration-300 hover:border-primary/30 hover:bg-primary/15 touch-manipulation"
      >
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">Share Your Journey</p>
            <p className="text-xs text-muted-foreground">Add a travel cover and story details in seconds.</p>
          </div>
          <Plus className="h-4 w-4 text-primary" />
        </div>
      </button>

      {loading && (
        <div>
          <FeedSkeleton count={2} />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {!loading && !error && sortedStories.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/70 p-8 text-center">
          <p className="text-base font-medium text-foreground">No travel stories yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to post one.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>Create Story</Button>
        </div>
      )}

      {!loading && !error && sortedStories.map((story) => {
        const photos = story.photos.length > 0 ? story.photos : [''];
        const currentIndex = getCurrentIndex(story.id, photos.length);
        const activePhoto = photos[currentIndex] || FALLBACK_STORY_IMAGE;
        const avatarSrc = story.profiles.avatar_url || undefined;

        return (
          <article key={story.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card/80">
            <header className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback>{(story.profiles.username || 'T').charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{story.profiles.username}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(story.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{story.location || 'Unknown'}</span>
              </div>
            </header>

            <div className="relative bg-black/60">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt={story.title || 'Travel story cover'}
                  className="h-64 w-full object-cover sm:h-80"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_STORY_IMAGE;
                  }}
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground sm:h-80">
                  No photo
                </div>
              )}

              {photos.length > 1 && (
                <>
                  <button
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                    onClick={() => goToPhoto(story.id, 'prev', photos.length)}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                    onClick={() => goToPhoto(story.id, 'next', photos.length)}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
                    {photos.map((photo, index) => (
                      <span
                        key={`${story.id}-${photo}`}
                        className={`h-1.5 rounded-full transition-all ${index === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2 px-4 py-3">
              <h3 className="text-base font-semibold text-foreground">{story.title}</h3>
              <p className="text-sm text-muted-foreground">{story.description}</p>

              <div className="flex items-center border-t border-border/50 pt-3">
                <div className="flex flex-nowrap items-center gap-4 sm:gap-5">
                  <button
                    className={`flex items-center gap-1 text-sm touch-manipulation ${story.is_liked ? 'text-red-400' : 'text-muted-foreground'}`}
                    onClick={() => {
                      void likeStory(story.id);
                    }}
                    aria-label="Like story"
                  >
                    <Heart className={`h-4 w-4 ${story.is_liked ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    className="flex items-center gap-1 text-sm text-muted-foreground touch-manipulation"
                    onClick={() => {
                      setSelectedStoryId(story.id);
                      setSelectedStoryTitle(story.title || 'Travel Story');
                      setCommentsOpen(true);
                    }}
                    aria-label="Comment"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>

                  <button
                    className={`flex items-center gap-1 text-sm touch-manipulation ${story.is_saved ? 'text-amber-300' : 'text-muted-foreground'}`}
                    onClick={() => {
                      void saveStory(story.id);
                    }}
                    aria-label="Save story"
                  >
                    <Bookmark className={`h-4 w-4 ${story.is_saved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    className="flex items-center gap-1 text-sm text-muted-foreground touch-manipulation"
                    onClick={() => {
                      setReaderStoryId(story.id);
                      setReaderOpen(true);
                    }}
                    aria-label="Read story"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Read</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      <CreateTravelStory
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={createStory}
      />

      <AdventureCommentsDialog
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        itemId={selectedStoryId}
        itemTitle={selectedStoryTitle}
        itemType="travel"
      />

      <StoryReader
        story={readerStory}
        open={readerOpen}
        onOpenChange={setReaderOpen}
        isLiked={Boolean(sortedStories.find((story) => story.id === readerStoryId)?.is_liked)}
        onLike={() => {
          if (!readerStoryId) return;
          void likeStory(readerStoryId);
        }}
        onComment={() => {
          if (!readerStoryId) return;
          const story = sortedStories.find((item) => item.id === readerStoryId);
          if (!story) return;
          setSelectedStoryId(story.id);
          setSelectedStoryTitle(story.title || 'Travel Story');
          setCommentsOpen(true);
        }}
        onShare={() => {
          if (!readerStoryId) return;
          const link = `${window.location.origin}/search?story=${readerStoryId}`;
          void navigator.clipboard.writeText(link);
          toast.success('Story link copied');
        }}
      />
    </div>
  );
}
