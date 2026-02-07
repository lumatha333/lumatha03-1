import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Heart, MessageCircle, Bookmark, BookmarkCheck, MoreVertical,
  ExternalLink, Download, Trash2, Play, File,
  Volume2, VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Database } from '@/integrations/supabase/types';

type Document = Database['public']['Tables']['documents']['Row'];
type Post = Database['public']['Tables']['posts']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface DocumentCardProps {
  doc: Document & { profiles?: Profile };
  isOwner: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onDelete: () => void;
  onOpenComments: () => void;
  onOpen: () => void;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export function EducationDocCard({
  doc, isOwner, isSaved, onToggleSave, onDelete, onOpenComments, onOpen,
  likesCount = 0, commentsCount = 0, isLiked = false, onToggleLike
}: DocumentCardProps) {
  const getFileIcon = (fileType?: string) => {
    const ext = fileType?.toLowerCase() || '';
    if (ext === 'pdf') return <span className="text-red-400 font-bold text-xs">PDF</span>;
    if (['doc', 'docx'].includes(ext)) return <span className="text-blue-400 font-bold text-xs">DOC</span>;
    if (['ppt', 'pptx'].includes(ext)) return <span className="text-orange-400 font-bold text-xs">PPT</span>;
    if (['xls', 'xlsx'].includes(ext)) return <span className="text-green-400 font-bold text-xs">XLS</span>;
    return <File className="w-4 h-4" />;
  };

  return (
    <Card className="group hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {getFileIcon(doc.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{doc.title}</h3>
            {doc.description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{doc.description}</p>
            )}
            {doc.profiles && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Avatar className="w-4 h-4">
                  <AvatarImage src={doc.profiles.avatar_url || ''} />
                  <AvatarFallback className="text-[8px]">{doc.profiles.name?.[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{doc.profiles.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={onToggleLike}>
              <Heart className={cn("w-4 h-4", isLiked && "fill-red-500 text-red-500")} />
              {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" onClick={onOpenComments}>
              <MessageCircle className="w-4 h-4" />
              {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onToggleSave}>
              {isSaved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onOpen}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in browser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const a = document.createElement('a');
                a.href = doc.file_url;
                a.download = doc.file_name;
                a.target = '_blank';
                a.click();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuItem>
              {isOwner && (
                <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

interface VideoCardProps {
  video: Post & { profiles?: Profile };
  isOwner: boolean;
  isSaved: boolean;
  onToggleSave: () => void;
  onDelete?: () => void;
  onOpenComments: () => void;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export function EducationVideoCard({
  video, isOwner, isSaved, onToggleSave, onDelete, onOpenComments,
  likesCount = 0, commentsCount = 0, isLiked = false, onToggleLike
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setPlaying(!playing);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const videoUrl = video.media_urls?.[0] || video.file_url;

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-video bg-black relative cursor-pointer" onClick={togglePlay}>
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            muted={muted}
            playsInline
            preload="metadata"
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No video
          </div>
        )}
        
        {/* Play/Pause overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
          </div>
        )}
        
        {/* Mute button */}
        {playing && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
            onClick={toggleMute}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="font-medium text-sm truncate">{video.title}</h3>
        {video.profiles && (
          <div className="flex items-center gap-1.5 mt-1">
            <Avatar className="w-4 h-4">
              <AvatarImage src={video.profiles.avatar_url || ''} />
              <AvatarFallback className="text-[8px]">{video.profiles.name?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">{video.profiles.name}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-1.5" onClick={onToggleLike}>
              <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-red-500 text-red-500")} />
              {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-1.5" onClick={onOpenComments}>
              <MessageCircle className="w-3.5 h-3.5" />
              {commentsCount > 0 && <span className="text-xs">{commentsCount}</span>}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-1.5" onClick={onToggleSave}>
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" /> : <Bookmark className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {videoUrl && (
                  <DropdownMenuItem onClick={() => window.open(videoUrl, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in browser
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
