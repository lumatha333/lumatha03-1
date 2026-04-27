import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EnhancedPostCard } from '@/components/EnhancedPostCard';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';
import { FriendTick } from '@/components/lumatha/FriendTick';
import { 
  ArrowLeft, UserPlus, UserMinus, Settings, User, Image, FileText, 
  MapPin, Calendar, Globe, Star, Trophy, Eye, MessageCircle, UserCheck, 
  Clock, Users, UserCircle2, X, Shield, Ban, Flag, Lock, Play, Share2, Camera, Pencil, Trash2, BookOpen, Download, ExternalLink, MoreVertical, Menu
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { EditProfileSheet } from '@/components/EditProfileSheet';
import { StoriesBar } from '@/components/stories/StoriesBar';
import { useVisibleTabContent } from '@/hooks/useProfileOptimization';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Post = Database['public']['Tables']['posts']['Row'] & { profiles?: Profile };
type Document = Database['public']['Tables']['documents']['Row'];

interface SavedTravelStory {
  id: string;
  title: string;
  description: string;
  location: string;
  photos: string[];
  created_at: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 600;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.floor(progress * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{display}</>;
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0f1e' }}>
      {/* Profile pic higher up with no cover image space */}
      <div className="px-5 pt-5">
        <div className="flex items-start gap-4">
          <Skeleton className="w-[86px] h-[86px] rounded-full shrink-0" style={{ boxShadow: '0 0 0 2px #7C3AED' }} />
          <div className="flex-1 pt-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-4 mt-3">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
        <Skeleton className="h-4 w-3/4 mt-3" />
      </div>
      <div className="px-5 mt-4 space-y-3">
        <Skeleton className="h-11 w-full rounded-2xl" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-20 rounded-full" />)}
        </div>
      </div>
      <div className="px-4 mt-5 space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-36 rounded-3xl" />)}
      </div>
    </div>
  );
}

export default function Profile() {
  const { userId: rawUserId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const userId = rawUserId === 'me' ? (currentUser?.id ?? undefined) : rawUserId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowedBy, setIsFollowedBy] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersList, setFollowersList] = useState<Profile[]>([]);
  const [followingList, setFollowingList] = useState<Profile[]>([]);
  const [friendsList, setFriendsList] = useState<Profile[]>([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [unfollowConfirm, setUnfollowConfirm] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [likes, setLikes] = useState<{ post_id: string }[]>([]);
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const skeletonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState('posts');
  const [savedStories, setSavedStories] = useState<SavedTravelStory[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<any[]>([]);
  const [marketplaceProfile, setMarketplaceProfile] = useState<any | null>(null);
  const [mutualFriendsCount, setMutualFriendsCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasBlockedMe, setHasBlockedMe] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [profileStories, setProfileStories] = useState<SavedTravelStory[]>([]);
  const [profileMediaViewer, setProfileMediaViewer] = useState<{ open: boolean; urls: string[]; types: string[]; index: number }>({ open: false, urls: [], types: [], index: 0 });
  const [postFilter, setPostFilter] = useState<'all' | 'pictures' | 'videos' | 'thoughts'>('all');
  const [postSort, setPostSort] = useState<'latest' | 'oldest' | 'popular'>('latest');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'pictures' | 'videos'>('all');
  const [mediaSort, setMediaSort] = useState<'latest' | 'oldest' | 'popular'>('latest');
  const [marketplaceLoaded, setMarketplaceLoaded] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [marketplaceLoading, setMarketplaceLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  useEffect(() => { if (userId && userId !== 'me') fetchProfileData(); }, [userId]);

  const downloadDocument = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download document');
    }
  };

  const editDocumentTitle = async (doc: Document) => {
    if (!currentUser || currentUser.id !== userId) return;
    const nextTitle = window.prompt('Edit document title', doc.title)?.trim();
    if (!nextTitle || nextTitle === doc.title) return;
    try {
      const { error } = await supabase.from('documents').update({ title: nextTitle }).eq('id', doc.id).eq('user_id', currentUser.id);
      if (error) throw error;
      setDocuments((prev) => prev.map((item) => (item.id === doc.id ? { ...item, title: nextTitle } : item)));
      toast.success('Document updated');
    } catch {
      toast.error('Failed to update document');
    }
  };

  const deleteDocument = async (docId: string, fileUrl: string, coverUrl?: string | null) => {
    if (!currentUser || currentUser.id !== userId) return;

    const extractDocumentPath = (url?: string | null) => {
      if (!url) return null;
      const parts = url.split('/documents/');
      return parts[1] || null;
    };

    try {
      const filePath = extractDocumentPath(fileUrl);
      const coverPath = extractDocumentPath(coverUrl);

      const pathsToRemove = [filePath, coverPath].filter((path): path is string => Boolean(path));
      if (pathsToRemove.length > 0) {
        await supabase.storage.from('documents').remove(pathsToRemove);
      }

      await supabase.from('documents').delete().eq('id', docId).eq('user_id', currentUser.id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      toast.success('Document deleted');
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const fetchProfileData = async () => {
    if (!userId) return;
    setLoading(true);
    setShowSkeleton(false);
    if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    skeletonTimerRef.current = setTimeout(() => setShowSkeleton(true), 400);

    try {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profileError) throw profileError;
      setProfile(profileData);

      const { data: postsData } = await supabase.from('posts').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false });
      setPosts(postsData || []);

      const { data: followers } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
      const { data: following } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
      
      setFollowersCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);

      if (currentUser) {
        setIsFollowing(following?.some(f => f.following_id === currentUser.id) || false);
        setIsFollowedBy(followers?.some(f => f.follower_id === currentUser.id) || false);

        const { data: blocked } = await supabase.from('blocks').select('*').or(`and(blocker_id.eq.${currentUser.id},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUser.id})`);
        setIsBlocked(blocked?.some(b => b.blocker_id === currentUser.id) || false);
        setHasBlockedMe(blocked?.some(b => b.blocker_id === userId) || false);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
      setShowSkeleton(false);
      if (skeletonTimerRef.current) clearTimeout(skeletonTimerRef.current);
    }
  };

  const handleFollow = async () => {
    if (!currentUser || !userId) return;
    try {
      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch {
      toast.error('Failed to update follow status');
    }
  };

  const loadFollowers = async () => {
    if (!userId) return;
    const { data } = await supabase.from('follows').select('profiles!follows_follower_id_fkey(*)').eq('following_id', userId);
    setFollowersList(data?.map(d => d.profiles as any) || []);
    setShowFollowers(true);
  };

  const loadFollowing = async () => {
    if (!userId) return;
    const { data } = await supabase.from('follows').select('profiles!follows_following_id_fkey(*)').eq('follower_id', userId);
    setFollowingList(data?.map(d => d.profiles as any) || []);
    setShowFollowing(true);
  };

  if (loading && showSkeleton) return <ProfileSkeleton />;
  if (!profile) return <div className="min-h-screen" />;

  const isOwnProfile = currentUser?.id === userId;
  const hasOpenableAvatar = !!profile.avatar_url;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0f1e' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0B0D1F]/60 backdrop-blur-md">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('lumatha_mobile_sidebar_toggle'))} 
          className="w-10 h-10 flex items-center justify-center rounded-xl transition-transform active:scale-90 hover:bg-white/5"
        >
          <Menu className="w-6 h-6 text-blue-500" strokeWidth={2} />
        </button>
        
        <div className="flex flex-col flex-1 min-w-0">
          <p className="text-base font-black tracking-wide text-blue-600 leading-none">LUMATHA</p>
          <h2 className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-widest truncate">
            {profile.name || 'Profile'}
          </h2>
        </div>

        {(!isOwnProfile || window.history.length > 1) && (
          <button onClick={() => navigate(-1)} className="text-xs text-muted-foreground hover:text-white">
            Back
          </button>
        )}
      </div>

      {/* Unfollow confirmation */}
      {unfollowConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setUnfollowConfirm(false)}>
          <div className="w-72 rounded-2xl overflow-hidden shadow-2xl" style={{ background: '#111827' }} onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center">
              <Avatar className="w-16 h-16 mx-auto mb-3 ring-2 ring-primary/20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback>{profile.name?.[0]}</AvatarFallback>
              </Avatar>
              <p className="text-white text-sm font-semibold mb-1">Unfollow {profile.name}?</p>
            </div>
            <button onClick={handleFollow} className="w-full py-3 text-sm font-bold active:bg-red-500/10 transition-colors" style={{ color: '#ef4444', borderTop: '1px solid #1f2937' }}>
              Unfollow
            </button>
            <button onClick={() => setUnfollowConfirm(false)} className="w-full py-3 text-sm text-white active:bg-white/5 transition-colors" style={{ borderTop: '1px solid #1f2937' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFollowers && <PeopleList people={followersList} title="Followers" onClose={() => setShowFollowers(false)} />}
      {showFollowing && <PeopleList people={followingList} title="Following" onClose={() => setShowFollowing(false)} />}

      <div className="px-5 pt-5">
        <div className="flex items-start gap-4">
          <div
            className={cn('w-[86px] h-[86px] rounded-full overflow-hidden relative shrink-0', hasOpenableAvatar ? 'cursor-pointer' : 'cursor-default')}
            onClick={() => {
              if (!hasOpenableAvatar || !profile.avatar_url) return;
              setProfileMediaViewer({ open: true, urls: [profile.avatar_url], types: ['image'], index: 0 });
            }}
            style={{
              border: '2px solid #111827',
              boxShadow: '0 0 0 2px #7C3AED',
            }}
          >
            <Avatar className="w-full h-full">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-3xl font-bold text-white" style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)' }}>
                {profile.name?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center shadow-lg" style={{ background: '#7C3AED' }}>
                <Pencil className="w-3 h-3 text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="min-w-0 flex-1">
                <h1 className="text-white truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>{profile.name}</h1>
                {profile.username && <p style={{ color: '#94A3B8', fontSize: 13, fontFamily: "'Inter'" }}>@{profile.username}</p>}
              </div>
              
              <div className="flex items-center gap-2">
                {!isOwnProfile && currentUser && !hasBlockedMe && !isBlocked && (
                  <button
                    onClick={handleFollow}
                    className={cn(
                      "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 border shadow-lg",
                      isFollowing ? "bg-slate-800 text-white border-white/20" : "bg-orange-500 text-white border-white"
                    )}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
                {isOwnProfile && (
                  <button onClick={() => navigate('/settings')} className="p-2 rounded-full bg-slate-800 border border-white/10 text-white active:scale-95 transition-all">
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-2.5 flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm font-bold text-white">{posts.length}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#94A3B8' }}>Posts</p>
              </div>
              <button onClick={loadFollowers} className="text-center group">
                <p className="text-sm font-bold text-white group-active:scale-95 transition-transform">{followersCount}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#94A3B8' }}>Followers</p>
              </button>
              <button onClick={loadFollowing} className="text-center group">
                <p className="text-sm font-bold text-white group-active:scale-95 transition-transform">{followingCount}</p>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#94A3B8' }}>Following</p>
              </button>
            </div>
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="px-5 mt-3 text-[14px] text-slate-200 leading-relaxed font-medium" style={{ fontFamily: "'Inter'" }}>
          {profile.bio}
        </p>
      )}

      {/* Profile actions for others */}
      {!isOwnProfile && !isBlocked && !hasBlockedMe && (
        <div className="flex gap-2 px-5 mt-4">
          <button 
            onClick={() => navigate(`/chat/${userId}`)}
            className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold active:scale-95 transition-all shadow-lg shadow-blue-900/20"
          >
            Message
          </button>
          <button className="px-4 py-2 rounded-xl bg-slate-800 border border-white/10 text-white text-sm active:scale-95 transition-all">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6 flex gap-2 px-5 border-b border-white/5 overflow-x-auto no-scrollbar">
        {['posts', 'media', 'marketplace'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-xs font-bold uppercase tracking-widest transition-all relative",
              activeTab === tab ? "text-blue-500" : "text-slate-500"
            )}
          >
            {tab}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-4">
        {activeTab === 'posts' && posts.map(post => (
          <EnhancedPostCard key={post.id} post={post} />
        ))}
      </div>

      <FullScreenMediaViewer
        open={profileMediaViewer.open}
        onOpenChange={(open) => setProfileMediaViewer(prev => ({ ...prev, open }))}
        mediaUrls={profileMediaViewer.urls}
        mediaTypes={profileMediaViewer.types}
        initialIndex={profileMediaViewer.index}
      />
    </div>
  );
}

function PeopleList({ people, title, onClose }: { people: Profile[]; title: string; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden bg-[#111827] rounded-3xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {people.length === 0 ? (
            <p className="text-center py-10 text-slate-500">No one here yet</p>
          ) : (
            people.map(person => (
              <button 
                key={person.id} 
                className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-white/5 transition-all text-left"
                onClick={() => { onClose(); navigate(`/profile/${person.id}`); }}
              >
                <Avatar className="w-12 h-12">
                  <AvatarImage src={person.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-800 text-white font-bold">{person.name?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{person.name}</p>
                  {person.username && <p className="text-xs text-slate-500 truncate">@{person.username}</p>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
