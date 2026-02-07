import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Heart, MessageCircle, Bookmark, BookmarkCheck, MoreVertical,
  ExternalLink, Download, Trash2, Play, Pause, File,
  Volume2, VolumeX, Maximize, X
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
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFileIcon = (fileType?: string) => {
    const ext = fileType?.toLowerCase() || '';
    if (ext === 'pdf') return <span className="text-red-400 font-bold text-xs">PDF</span>;
    if (['doc', 'docx'].includes(ext)) return <span className="text-blue-400 font-bold text-xs">DOC</span>;
    if (['ppt', 'pptx'].includes(ext)) return <span className="text-orange-400 font-bold text-xs">PPT</span>;
    if (['xls', 'xlsx'].includes(ext)) return <span className="text-green-400 font-bold text-xs">XLS</span>;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <span className="text-purple-400 font-bold text-xs">IMG</span>;
    return <File className="w-4 h-4" />;
  };

  const getPreviewUrl = () => {
    const ext = doc.file_type?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return doc.file_url;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return doc.file_url;
    if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`;
    }
    return null;
  };

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(doc.file_type?.toLowerCase() || '');
  const previewUrl = getPreviewUrl();

  return (
    <>
      <Card className="group hover:border-primary/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3 cursor-pointer" onClick={() => previewUrl ? setPreviewOpen(true) : onOpen()}>
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
                {previewUrl && (
                  <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                )}
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
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-medium text-sm truncate">{doc.title}</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                  const a = document.createElement('a');
                  a.href = doc.file_url;
                  a.download = doc.file_name;
                  a.target = '_blank';
                  a.click();
                }}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpen}>
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {isImage ? (
                <img src={doc.file_url} alt={doc.title} className="w-full h-full object-contain" />
              ) : (
                <iframe src={previewUrl || ''} className="w-full h-full border-0" title={doc.title} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoUrl = video.media_urls?.[0] || video.file_url;

  const togglePlay = useCallback(() => {
    const ref = fullscreen ? fullscreenVideoRef : videoRef;
    if (!ref.current) return;
    if (ref.current.paused) {
      ref.current.play().catch(() => {});
    } else {
      ref.current.pause();
    }
  }, [fullscreen]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const ref = fullscreen ? fullscreenVideoRef : videoRef;
    if (ref.current) {
      ref.current.muted = !muted;
      setMuted(!muted);
    }
  }, [muted, fullscreen]);

  const handleTimeUpdate = useCallback(() => {
    const ref = fullscreen ? fullscreenVideoRef : videoRef;
    if (ref.current) {
      const ct = ref.current.currentTime;
      const dur = ref.current.duration || 1;
      setCurrentTime(ct);
      setDuration(dur);
      setProgress((ct / dur) * 100);
    }
  }, [fullscreen]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const ref = fullscreen ? fullscreenVideoRef : videoRef;
    if (!ref.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    ref.current.currentTime = pct * (ref.current.duration || 0);
  }, [fullscreen]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const openFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setFullscreen(true);
    setPlaying(false);
  };

  return (
    <>
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
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No video available
            </div>
          )}
          
          {/* Play overlay */}
          {!playing && videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
            </div>
          )}
          
          {/* Controls overlay */}
          {videoUrl && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Progress bar */}
              <div className="w-full h-1 bg-white/20 rounded-full cursor-pointer mb-2" onClick={(e) => { e.stopPropagation(); seekTo(e); }}>
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                    {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={toggleMute}>
                    {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </Button>
                  <span className="text-[10px] text-white/80 ml-1">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={openFullscreen}>
                  <Maximize className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-3">
          <h3 className="font-medium text-sm truncate">{video.title}</h3>
          {video.content && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{video.content}</p>}
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {videoUrl && (
                  <>
                    <DropdownMenuItem onClick={() => window.open(videoUrl, '_blank')}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in browser
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const a = document.createElement('a');
                      a.href = videoUrl;
                      a.download = video.title || 'video';
                      a.target = '_blank';
                      a.click();
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  </>
                )}
                {isOwner && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen Video Dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-0 bg-black rounded-none [&>button]:hidden">
          <div className="relative w-full h-full flex items-center justify-center" onClick={togglePlay}>
            {videoUrl && (
              <video
                ref={fullscreenVideoRef}
                src={videoUrl}
                className="max-w-full max-h-full object-contain"
                muted={muted}
                playsInline
                autoPlay
                onEnded={() => setPlaying(false)}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (fullscreenVideoRef.current) setDuration(fullscreenVideoRef.current.duration);
                  setPlaying(true);
                }}
              />
            )}
            
            {/* Fullscreen controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3" onClick={(e) => { e.stopPropagation(); seekTo(e); }}>
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                    {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20" onClick={toggleMute}>
                    {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <span className="text-sm text-white/80">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Play overlay in fullscreen */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
