import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { FriendTick } from '@/components/lumatha/FriendTick';
import { 
  ArrowLeft, UserPlus, UserMinus, Settings, User, Image, FileText, Mountain, ShoppingBag,
  MapPin, Calendar, Globe, Star, Trophy, Eye, MessageCircle, UserCheck, Clock, Users,
  UserCircle2, X, Shield, Ban, Flag, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & { profiles?: Profile };
type Document = Database['public']['Tables']['documents']['Row'];

// Smooth blur-up avatar with ring like Facebook
function ProfileAvatar({ src, name, size = 'lg', onClick }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg'; onClick?: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const sizeClass = size === 'lg' ? 'w-28 h-28 sm:w-32 sm:h-32' : size === 'md' ? 'w-16 h-16' : 'w-10 h-10';
  const textSize = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-xl' : 'text-sm';

  return (
    <div
      className={cn(
        sizeClass,
        'relative rounded-full flex-shrink-0',
        onClick && 'cursor-pointer group'
      )}
      onClick={onClick}
      style={{ boxShadow: '0 0 0 4px hsl(var(--background)), 0 0 0 6px hsl(var(--primary) / 0.4)' }}
    >
      {/* Background skeleton */}
      {!loaded && src && (
        <div className={cn('absolute inset-0 rounded-full bg-muted animate-pulse')} />
      )}
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'w-full h-full rounded-full object-cover transition-all duration-500',
            loaded ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
            onClick && 'group-hover:opacity-90'
          )}
          onLoad={() => setLoaded(true)}
        />
      ) : (
        <div className={cn('w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center', textSize, 'font-bold text-primary-foreground')}>
          {name?.[0]?.toUpperCase() || <UserCircle2 />}
        </div>
      )}
    </div>
  );
}

// Profile skeleton loader
function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-4 p-3 pb-24">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-16" />
      </div>
      <Card className="glass-card border-border overflow-hidden">
        <CardContent className="p-4">
          {/* Cover skeleton */}
          <Skeleton className="h-24 w-full rounded-lg mb-4" />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Skeleton className="w-28 h-28 rounded-full flex-shrink-0 -mt-8" />
            <div className="flex-1 space-y-3 pt-2">
              <Skeleton className="h-6 w-40" />
              <div className="flex gap-6">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
              </div>
              <Skeleton className="h-4 w-60" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

// Mini people list for dialogs
const PeopleList = ({ 
  people, 
  title, 
  onClose, 
  onNavigate, 
  isOwner, 
  onAddFriend 
}: { 
  people: Profile[]; 
  title: string; 
  onClose: () => void; 
  onNavigate: (id: string) => void;
  isOwner: (id: string) => boolean;
  onAddFriend: (id: string) => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in duration-200" onClick={onClose}>
    <div 
      className="bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden glass-card border-border animate-in slide-in-from-bottom duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-bold gradient-text">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {people.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground italic text-sm">No {title.toLowerCase()} yet</div>
        ) : (
          people.map((person) => (
            <div 
              key={person.id} 
              className="flex items-center justify-between p-3 hover:bg-primary/5 rounded-xl transition-all cursor-pointer group"
              onClick={() => { onNavigate(person.id); onClose(); }}
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar src={person.avatar_url} name={person.name} size="sm" />
                <div>
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{person.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{person.bio || 'Explorer'}</p>
                </div>
              </div>
              {!isOwner(person.id) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="h-8 text-xs font-bold px-4 rounded-full active:scale-90"
                  onClick={(e) => { e.stopPropagation(); onAddFriend(person.id); }}
                >
                  Add
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0, friends: 0 });
  const [isOwner, setIsOwner] = useState(false);
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<{ post_id: string }[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [adventurePoints, setAdventurePoints] = useState({ challenges: 0, discovery: 0, explore: 0, total: 0 });
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const { sendFriendRequest, acceptFriendRequest } = useFriends();

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    
    // Check if we're visiting ourselves
    const isSelf = userId === currentUser?.id || userId === 'me';
    const effectiveUserId = userId === 'me' ? currentUser?.id : userId;
    
    if (!effectiveUserId) return;

    setLoading(true);

    try {
      // Step 1: Fetch profile first to ensure it exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectiveUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setIsOwner(currentUser?.id === profileData.id);

      // Step 2: Fetch everything else in parallel
      const [postsRes, docsRes, userPointsRes, friendsCountRes, followStatusRes, savedRes, likesRes, friendRequestRes, mutualRes, blockRes] = await Promise.all([
        supabase.from('posts').select('*, profiles(*)').eq('user_id', effectiveUserId).eq('visibility', 'public').neq('category', 'ghost').order('created_at', { ascending: false }),
        supabase.from('documents').select('*').eq('user_id', effectiveUserId).eq('visibility', 'public').order('created_at', { ascending: false }),
        supabase.from('user_points').select('total_points').eq('user_id', effectiveUserId).maybeSingle(),
        supabase.from('friend_requests').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${effectiveUserId},receiver_id.eq.${effectiveUserId}`).eq('status', 'accepted'),
        currentUser ? supabase.from('follows').select('id').eq('follower_id', currentUser.id).eq('following_id', effectiveUserId).maybeSingle() : Promise.resolve({ data: null }),
        currentUser ? supabase.from('saved').select('post_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] }),
        currentUser ? supabase.from('likes').select('post_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] }),
        currentUser ? supabase.from('friend_requests').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${effectiveUserId}),and(sender_id.eq.${effectiveUserId},receiver_id.eq.${currentUser.id})`).maybeSingle() : Promise.resolve({ data: null }),
        currentUser && currentUser.id !== effectiveUserId ? (supabase.rpc as any)('get_mutual_friends_count', { user1: currentUser.id, user2: effectiveUserId }) : Promise.resolve({ data: 0 }),
        currentUser ? supabase.from('blocks').select('blocker_id').or(`and(blocker_id.eq.${currentUser.id},blocked_id.eq.${effectiveUserId}),and(blocker_id.eq.${effectiveUserId},blocked_id.eq.${currentUser.id})`) : Promise.resolve({ data: [] }),
      ]);

      // Set state from parallel results
      const postsData = postsRes.data || [];
      setPosts(postsData);
      setDocuments(docsRes.data || []);
      setFriendsCount(friendsCountRes.count || 0);

      if (userPointsRes.data) {
        const pts = userPointsRes.data.total_points;
        setAdventurePoints({ challenges: Math.floor(pts * 0.4), discovery: Math.floor(pts * 0.35), explore: Math.floor(pts * 0.25), total: pts });
      }

      if (postsData.length > 0) {
        const postIds = postsData.map(p => p.id);
        const { data: allLikes } = await supabase.from('likes').select('post_id').in('post_id', postIds);
        const counts: Record<string, number> = {};
        postIds.forEach(id => { counts[id] = 0; });
        allLikes?.forEach(like => { counts[like.post_id] = (counts[like.post_id] || 0) + 1; });
        setLikesCount(counts);
      }

      setIsFollowing(!!followStatusRes.data);
      setSaved(savedRes.data?.map((s: any) => s.post_id) || []);
      setLikes(likesRes.data || []);
      setMutualFriendsCount(mutualRes.data || 0);

      const blockData = blockRes.data || [];
      setIsBlocked(blockData.some((b: any) => b.blocker_id === currentUser?.id));
      setHasBlockedMe(blockData.some((b: any) => b.blocker_id === effectiveUserId));

      const friendData = friendRequestRes.data;
      if (friendData) {
        if (friendData.status === 'accepted') { setIsFriend(true); setFriendRequestStatus('accepted'); }
        else if (friendData.status === 'pending') { setFriendRequestStatus(friendData.sender_id === currentUser?.id ? 'pending_sent' : 'pending_received'); }
      } else { setIsFriend(false); setFriendRequestStatus('none'); }

      setStats({
        posts: postsData.length,
        followers: profileData.total_followers ?? 0,
        following: profileData.total_following ?? 0,
        friends: friendsCountRes.count || 0
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Lazy-load followers list
  const loadFollowers = async () => {
    const { data } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);
    if (data && data.length > 0) {
      const ids = data.map(f => f.follower_id);
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, bio').in('id', ids);
      setFollowersList(profiles as Profile[] || []);
    }
    setShowFollowers(true);
  };

  // Lazy-load following list
  const loadFollowing = async () => {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (data && data.length > 0) {
      const ids = data.map(f => f.following_id);
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, bio').in('id', ids);
      setFollowingList(profiles as Profile[] || []);
    }
    setShowFollowing(true);
  };

  // Lazy-load friends (only if own profile)
  const loadFriends = async () => {
    const { data } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (data && data.length > 0) {
      const ids = data.map(f => f.sender_id === userId ? f.receiver_id : f.sender_id);
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url, bio').in('id', ids);
      setFriendsList(profiles as Profile[] || []);
    }
    setShowFriends(true);
  };

  const handleFollow = async () => {
    if (!currentUser) { toast.error('Please login to follow users'); return; }
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
        setIsFollowing(false);
        toast.success('Unfollowed');
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
        toast.success('Following!');
      }
    } catch { toast.error('Failed to update follow status'); }
  };

  const toggleSave = async (postId: string) => {
    if (!currentUser) return;
    try {
      if (saved.includes(postId)) {
        await supabase.from('saved').delete().eq('user_id', currentUser.id).eq('post_id', postId);
        setSaved(saved.filter(id => id !== postId));
      } else {
        await supabase.from('saved').insert({ user_id: currentUser.id, post_id: postId });
        setSaved([...saved, postId]);
      }
    } catch { toast.error('Failed to update saved status'); }
  };

  const toggleLike = async (postId: string) => {
    if (!currentUser) return;
    try {
      const isLiked = likes.some(l => l.post_id === postId);
      if (isLiked) {
        await supabase.from('likes').delete().eq('user_id', currentUser.id).eq('post_id', postId);
        setLikes(likes.filter(l => l.post_id !== postId));
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 1) - 1 }));
      } else {
        await supabase.from('likes').insert({ user_id: currentUser.id, post_id: postId });
        setLikes([...likes, { post_id: postId }]);
        setLikesCount(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
      }
    } catch { toast.error('Failed to update like status'); }
  };

  if (loading) return <ProfileSkeleton />;

  if (!profile && !loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto">The profile you are looking for might have been removed or is private.</p>
        <Button onClick={() => navigate(-1)} className="rounded-full px-8 shadow-glow active:scale-90 transition-all">Go Back</Button>
      </div>
    );
  }

  // Final check to prevent rendering with null profile if loading somehow finished without profile
  if (!profile) return <ProfileSkeleton />;

  const isOwnProfile = currentUser?.id === profile.id;
  const mediaPosts = posts.filter(post => post.file_url || (post.media_urls && post.media_urls.length > 0));

  const getLevel = (points: number) => {
    if (points >= 5000) return { level: 5, title: 'Legend', stars: 5 };
    if (points >= 2000) return { level: 4, title: 'Expert', stars: 4 };
    if (points >= 1000) return { level: 3, title: 'Advanced', stars: 3 };
    if (points >= 500) return { level: 2, title: 'Intermediate', stars: 2 };
    return { level: 1, title: 'Beginner', stars: 1 };
  };
  const levelInfo = getLevel(adventurePoints.total);

  return (
    <div className="max-w-3xl mx-auto space-y-4 p-3 pb-24 animate-in fade-in duration-500">
      {/* People List Modals */}
      {showFollowers && (
        <PeopleList 
          people={followersList} 
          title="Followers" 
          onClose={() => setShowFollowers(false)} 
          onNavigate={(id) => navigate(`/profile/${id}`)}
          isOwner={(id) => currentUser?.id === id}
          onAddFriend={sendFriendRequest}
        />
      )}
      {showFollowing && (
        <PeopleList 
          people={followingList} 
          title="Following" 
          onClose={() => setShowFollowing(false)} 
          onNavigate={(id) => navigate(`/profile/${id}`)}
          isOwner={(id) => currentUser?.id === id}
          onAddFriend={sendFriendRequest}
        />
      )}
      {showFriends && (
        <PeopleList 
          people={friendsList} 
          title="Friends" 
          onClose={() => setShowFriends(false)} 
          onNavigate={(id) => navigate(`/profile/${id}`)}
          isOwner={(id) => currentUser?.id === id}
          onAddFriend={sendFriendRequest}
        />
      )}

      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)} 
          className="gap-1.5 h-8 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        {isOwnProfile && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings')} 
            className="gap-1.5 h-8 rounded-full hover:bg-primary/10 active:scale-90 transition-all"
          >
            <Settings className="w-4 h-4" /> Settings
          </Button>
        )}
      </div>

      {/* Profile Header Card */}
      <Card className="glass-card border-border overflow-hidden">
        {/* Facebook-style cover */}
        <div className="h-28 bg-gradient-to-br from-primary/30 via-secondary/20 to-primary/10 relative overflow-hidden">
          {profile.cover_url && (
            <img src={profile.cover_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </div>

        <CardContent className="p-4 -mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            {/* Facebook-style avatar overlapping cover */}
            <ProfileAvatar
              src={profile.avatar_url}
              name={profile.name}
              size="lg"
              onClick={() => setAvatarOpen(true)}
            />

            <div className="flex-1 min-w-0 space-y-2 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold truncate">{profile.name}</h1>
                <FriendTick friendsCount={friendsCount} showLabel />
              </div>

              <div className="flex gap-5 flex-wrap">
                {/* Friends — only owner can view list */}
                <button
                  className="flex flex-col items-center hover:opacity-80 transition-all active:scale-95 group"
                  onClick={isOwnProfile ? loadFriends : undefined}
                  disabled={!isOwnProfile}
                  title={!isOwnProfile ? 'Friends list is private' : 'View friends'}
                >
                  <span className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{friendsCount}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Friends</span>
                </button>

                {/* Followers — public, anyone can view */}
                <button
                  className="flex flex-col items-center hover:opacity-80 transition-all active:scale-95 group"
                  onClick={loadFollowers}
                >
                  <span className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{profile.total_followers ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Followers</span>
                </button>

                {/* Following — public, anyone can view */}
                <button
                  className="flex flex-col items-center hover:opacity-80 transition-all active:scale-95 group"
                  onClick={loadFollowing}
                >
                  <span className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{profile.total_following ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Following</span>
                </button>

                <div className="flex flex-col items-center group">
                  <span className="text-lg font-bold text-primary group-hover:scale-110 transition-transform">{posts.length}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-black">Posts</span>
                </div>
              </div>

              {profile.bio && <p className="text-sm text-muted-foreground leading-snug">{profile.bio}</p>}

              {profile.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {profile.location}
                </div>
              )}
            </div>
          </div>

          {/* Mutual friends indicator */}
          {!isOwnProfile && currentUser && mutualFriendsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Users className="w-3 h-3" />
              <span>{mutualFriendsCount} mutual friend{mutualFriendsCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Blocked state */}
          {hasBlockedMe ? (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
              <Ban className="w-5 h-5 mx-auto text-destructive mb-1" />
              <p className="text-xs text-destructive">This profile is not available</p>
            </div>
          ) : isBlocked ? (
            <div className="flex flex-wrap gap-2 mt-4">
              <Button size="sm" variant="outline" className="gap-1.5 border-destructive/30 text-destructive"
                onClick={async () => {
                  await supabase.from('blocks').delete().eq('blocker_id', currentUser!.id).eq('blocked_id', userId);
                  setIsBlocked(false);
                  toast.success('Unblocked');
                }}>
                <Ban className="w-4 h-4" /> Unblock
              </Button>
            </div>
          ) : !isOwnProfile && currentUser && (
            <div className="space-y-2 mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Follow Button */}
                <Button size="sm" onClick={handleFollow}
                  className={cn("gap-1.5 font-semibold transition-all duration-300",
                    isFollowing ? "bg-muted/60 text-muted-foreground border border-border hover:bg-destructive/10 hover:text-destructive" : "text-white border-0"
                  )}
                  style={!isFollowing ? { background: 'linear-gradient(135deg, hsl(175 70% 45%), hsl(160 60% 50%), hsl(200 70% 55%))' } : undefined}>
                  {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {isFollowing ? 'Unfollow' : '+ Follow'}
                </Button>

                {/* Friend request states */}
                {friendRequestStatus === 'none' && (
                  <Button size="sm" variant="outline" onClick={() => { sendFriendRequest(userId!); setFriendRequestStatus('pending_sent'); }} className="gap-1.5 border-primary/30 hover:bg-primary/10">
                    <UserPlus className="w-4 h-4" /> Add Friend
                  </Button>
                )}
                {friendRequestStatus === 'pending_sent' && (
                  <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-60">
                    <Clock className="w-4 h-4" /> Request Sent
                  </Button>
                )}
                {friendRequestStatus === 'pending_received' && (
                  <Button size="sm" onClick={async () => {
                    const { data } = await supabase.from('friend_requests').select('id').eq('sender_id', userId).eq('receiver_id', currentUser.id).single();
                    if (data) { acceptFriendRequest(data.id, userId!); setFriendRequestStatus('accepted'); setIsFriend(true); }
                  }} className="gap-1.5" style={{ background: 'linear-gradient(135deg, hsl(270 70% 60%), hsl(340 75% 58%))' }}>
                    <UserCheck className="w-4 h-4" /> Accept
                  </Button>
                )}
                {friendRequestStatus === 'accepted' && (
                  <Button size="sm" variant="outline" disabled className="gap-1.5 border-emerald-500/40 text-emerald-400">
                    <UserCheck className="w-4 h-4" /> Friends
                  </Button>
                )}

                {/* Message */}
                {isFriend ? (
                  <Button size="sm" variant="secondary" onClick={() => navigate('/chat')} className="gap-1.5">
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-40" title="Only friends can message">
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                )}
              </div>

              {/* Block & Report — subtle row */}
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="gap-1 text-[10px] text-muted-foreground h-6 px-2 hover:text-destructive"
                  onClick={async () => {
                    await supabase.from('blocks').insert({ blocker_id: currentUser!.id, blocked_id: userId! });
                    // Remove follow & friend
                    await supabase.from('follows').delete().eq('follower_id', currentUser!.id).eq('following_id', userId);
                    await supabase.from('follows').delete().eq('follower_id', userId).eq('following_id', currentUser!.id);
                    setIsBlocked(true); setIsFollowing(false);
                    toast.success('User blocked');
                  }}>
                  <Ban className="w-3 h-3" /> Block
                </Button>
                <Button size="sm" variant="ghost" className="gap-1 text-[10px] text-muted-foreground h-6 px-2 hover:text-amber-500">
                  <Flag className="w-3 h-3" /> Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Screen Avatar Dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="max-w-sm p-0 bg-black/95 border-none" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Profile Photo</DialogTitle>
          <img src={profile.avatar_url || '/placeholder.svg'} alt={profile.name} className="w-full h-auto" />
        </DialogContent>
      </Dialog>

      {/* Profile Tabs — 5 tabs (liked moved to Private) */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="glass-card w-full grid grid-cols-5 h-auto p-1 rounded-2xl mb-6 shadow-glow border-border/40">
          <TabsTrigger 
            value="posts" 
            className="flex flex-col gap-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary active:scale-90"
          >
            <Image className="w-4 h-4" /> Posts
          </TabsTrigger>
          <TabsTrigger 
            value="info" 
            className="flex flex-col gap-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary active:scale-90"
          >
            <User className="w-4 h-4" /> Info
          </TabsTrigger>
          <TabsTrigger 
            value="docs" 
            className="flex flex-col gap-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary active:scale-90"
          >
            <FileText className="w-4 h-4" /> Docs
          </TabsTrigger>
          <TabsTrigger 
            value="adventure" 
            className="flex flex-col gap-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary active:scale-90"
          >
            <Mountain className="w-4 h-4" /> Adventure
          </TabsTrigger>
          <TabsTrigger 
            value="marketplace" 
            className="flex flex-col gap-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow-primary active:scale-90"
          >
            <ShoppingBag className="w-4 h-4" /> Market
          </TabsTrigger>
        </TabsList>

        {/* POSTS TAB — own posts */}
        <TabsContent value="posts" className="space-y-4 mt-4">
          {posts.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-12 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <EnhancedPostCard key={post.id} post={post} isSaved={saved.includes(post.id)} isLiked={likes.some(l => l.post_id === post.id)} likesCount={likesCount[post.id] || 0} currentUserId={currentUser?.id || ''} onToggleSave={toggleSave} onToggleLike={toggleLike} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* INFO TAB */}
        <TabsContent value="info" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-sm mb-3">Profile Information</h3>
              {profile.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.country && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>{profile.country}</span>
                </div>
              )}
              {profile.age_group && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span>Age group: {profile.age_group}</span>
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{profile.website}</a>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>Joined {new Date(profile.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              </div>

              {/* Social stats in info card */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                <button
                  className={cn('flex flex-col items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors', !isOwnProfile && 'cursor-default opacity-70')}
                  onClick={isOwnProfile ? loadFriends : undefined}
                >
                  <Users className="w-4 h-4 text-primary mb-1" />
                  <span className="font-bold text-sm">{friendsCount}</span>
                  <span className="text-[10px] text-muted-foreground">Friends {!isOwnProfile && '🔒'}</span>
                </button>
                <button
                  className="flex flex-col items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={loadFollowers}
                >
                  <UserPlus className="w-4 h-4 text-blue-500 mb-1" />
                  <span className="font-bold text-sm">{profile.total_followers ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Followers</span>
                </button>
                <button
                  className="flex flex-col items-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  onClick={loadFollowing}
                >
                  <UserCheck className="w-4 h-4 text-green-500 mb-1" />
                  <span className="font-bold text-sm">{profile.total_following ?? 0}</span>
                  <span className="text-[10px] text-muted-foreground">Following</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="space-y-3 mt-4">
          {mediaPosts.length === 0 ? (
            <Card className="glass-card border-border">
              <CardContent className="py-12 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No media posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mediaPosts.map((post) => (
                <EnhancedPostCard
                  key={post.id}
                  post={post}
                  isSaved={saved.includes(post.id)}
                  isLiked={likes.some(l => l.post_id === post.id)}
                  likesCount={likesCount[post.id] || 0}
                  currentUserId={currentUser?.id || ''}
                  onToggleSave={toggleSave}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* DOCS TAB */}
        <TabsContent value="docs" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Documents</h3>
                <span className="text-xs text-muted-foreground">{documents.length} documents</span>
              </div>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground text-sm">No public documents</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => window.open(doc.file_url, '_blank')}>
                      <FileText className="w-8 h-8 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.title}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.file_type || 'Document'}</p>
                      </div>
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADVENTURE TAB */}
        <TabsContent value="adventure" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <div className="text-center mb-6">
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < levelInfo.stars ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                  ))}
                </div>
                <h3 className="text-xl font-bold">{levelInfo.title}</h3>
                <p className="text-xs text-muted-foreground">Level {levelInfo.level}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <Trophy className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="font-bold">{adventurePoints.challenges}</p>
                  <p className="text-[9px] text-muted-foreground">Challenges</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <Mountain className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="font-bold">{adventurePoints.discovery}</p>
                  <p className="text-[9px] text-muted-foreground">Discovery</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-500/10">
                  <Globe className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                  <p className="font-bold">{adventurePoints.explore}</p>
                  <p className="text-[9px] text-muted-foreground">Explore</p>
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10">
                <p className="text-3xl font-bold gradient-text">{adventurePoints.total}</p>
                <p className="text-xs text-muted-foreground">Total Adventure Points</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MARKETPLACE TAB */}
        <TabsContent value="marketplace" className="space-y-3 mt-4">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">Marketplace Listings</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '🛒', label: 'Sell / Buy', count: 0 },
                  { icon: '🏠', label: 'Rent', count: 0 },
                  { icon: '💼', label: 'Business', count: 0 },
                  { icon: '💚', label: 'NGOs', count: 0 },
                  { icon: '👔', label: 'Jobs', count: 0 },
                ].map((category) => (
                  <div key={category.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                    <span className="text-xl">{category.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-medium">{category.label}</p>
                      <p className="text-[10px] text-muted-foreground">{category.count} listings</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center py-8 mt-4">
                <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No marketplace listings yet</p>
                {isOwnProfile && (
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('/marketplace')}>
                    Create Listing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
