import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Image as ImageIcon, Link2, Play } from 'lucide-react';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MediaTab = 'pics' | 'videos' | 'shared' | 'pdf';

type PicsItem = { id: string; url: string };
type VideosItem = { id: string; url: string };
type SharedItem = { id: string; url: string; title: string; domain: string; createdAt?: string | null };
type PdfItem = { id: string; url: string; name: string; createdAt?: string | null };

interface MediaPageState {
  from?: string;
  title?: string;
  initialTab?: MediaTab;
  mediaData?: {
    pics: PicsItem[];
    videos: VideosItem[];
    shared: SharedItem[];
    pdf: PdfItem[];
  };
}

const isDirectImage = (url: string) => /\.(png|jpe?g|gif|webp|avif)$/i.test(url);
const isDirectVideo = (url: string) => /\.(mp4|webm|mov|m4v|mkv)$/i.test(url);

export default function Media() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as MediaPageState;

  const [tab, setTab] = useState<MediaTab>(state.initialTab || 'pics');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerUrls, setViewerUrls] = useState<string[]>([]);
  const [viewerTypes, setViewerTypes] = useState<string[]>([]);

  const mediaData = state.mediaData || { pics: [], videos: [], shared: [], pdf: [] };

  const allVisualMedia = useMemo(
    () => [
      ...mediaData.pics.map((item) => ({ url: item.url, type: 'image' as const })),
      ...mediaData.videos.map((item) => ({ url: item.url, type: 'video' as const })),
    ],
    [mediaData.pics, mediaData.videos],
  );

  const openVisual = (url: string) => {
    const index = allVisualMedia.findIndex((item) => item.url === url);
    const safeIndex = index >= 0 ? index : 0;
    setViewerUrls(allVisualMedia.map((item) => item.url));
    setViewerTypes(allVisualMedia.map((item) => item.type));
    setViewerIndex(safeIndex);
    setViewerOpen(true);
  };

  const openSharedItem = async (item: SharedItem) => {
    if (isDirectImage(item.url) || isDirectVideo(item.url)) {
      setViewerUrls([item.url]);
      setViewerTypes([isDirectVideo(item.url) ? 'video' : 'image']);
      setViewerIndex(0);
      setViewerOpen(true);
      return;
    }

    const postMatch = item.url.match(/[?&]post=([a-f0-9-]{36})/i);
    const postId = postMatch?.[1];
    if (postId) {
      const { data, error } = await supabase
        .from('posts')
        .select('media_urls,media_types,file_url,file_type')
        .eq('id', postId)
        .maybeSingle();

      if (!error && data) {
        const urls = data.media_urls?.length ? data.media_urls : (data.file_url ? [data.file_url] : []);
        const types = data.media_types?.length ? data.media_types : (data.file_type ? [data.file_type] : urls.map(() => 'image'));

        if (urls.length > 0) {
          setViewerUrls(urls);
          setViewerTypes(types);
          setViewerIndex(0);
          setViewerOpen(true);
          return;
        }
      }
    }

    toast.info('No preview media available for this shared item.');
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1e] text-white">
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1e]/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (state.from) {
                navigate(state.from);
                return;
              }
              navigate(-1);
            }}
            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">{state.title || 'Medias'}</h1>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(['pics', 'videos', 'shared', 'pdf'] as MediaTab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`h-10 rounded-full text-sm font-medium transition ${tab === item ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
            >
              {item === 'pics' ? `Pics (${mediaData.pics.length})` : null}
              {item === 'videos' ? `Videos (${mediaData.videos.length})` : null}
              {item === 'shared' ? `Shared (${mediaData.shared.length})` : null}
              {item === 'pdf' ? `PDF (${mediaData.pdf.length})` : null}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-20">
        {tab === 'pics' ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {mediaData.pics.map((item) => (
              <button key={item.id} onClick={() => openVisual(item.url)} className="aspect-square rounded-lg overflow-hidden bg-slate-800">
                <img src={item.url} alt="pic" className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
            {mediaData.pics.length === 0 ? <p className="col-span-full text-center text-slate-400 py-16">No photos</p> : null}
          </div>
        ) : null}

        {tab === 'videos' ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {mediaData.videos.map((item) => (
              <button key={item.id} onClick={() => openVisual(item.url)} className="aspect-video rounded-lg overflow-hidden bg-slate-800 relative">
                <video src={item.url} className="w-full h-full object-cover pointer-events-none" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </button>
            ))}
            {mediaData.videos.length === 0 ? <p className="col-span-full text-center text-slate-400 py-16">No videos</p> : null}
          </div>
        ) : null}

        {tab === 'shared' ? (
          <div className="space-y-2">
            {mediaData.shared.map((item) => (
              <button
                key={item.id}
                onClick={() => void openSharedItem(item)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10"
              >
                <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.domain}</p>
              </button>
            ))}
            {mediaData.shared.length === 0 ? <p className="text-center text-slate-400 py-16">No shared items</p> : null}
          </div>
        ) : null}

        {tab === 'pdf' ? (
          <div className="space-y-2">
            {mediaData.pdf.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-violet-300" />
                <span className="text-sm flex-1 truncate">{item.name}</span>
                <Link2 className="w-4 h-4 text-slate-400" />
              </a>
            ))}
            {mediaData.pdf.length === 0 ? <p className="text-center text-slate-400 py-16">No PDF files</p> : null}
          </div>
        ) : null}
      </div>

      <FullScreenMediaViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        mediaUrls={viewerUrls}
        mediaTypes={viewerTypes}
        initialIndex={viewerIndex}
        minimal
      />
    </div>
  );
}
