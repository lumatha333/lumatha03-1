import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FullScreenMediaViewer } from '@/components/FullScreenMediaViewer';

interface ChatImageGridProps {
  urls: string[];
  isOwn?: boolean;
}

/**
 * Messenger-style multi-image grid:
 * 1 → full width
 * 2 → side by side
 * 3 → 2 top + 1 bottom
 * 4 → 2×2
 * 5+ → 2×2 + "+N more" overlay
 */
export function ChatImageGrid({ urls, isOwn = false }: ChatImageGridProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (!urls.length) return null;

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const count = urls.length;
  const displayUrls = urls.slice(0, 4);
  const extraCount = count > 4 ? count - 4 : 0;

  const gridClass = cn(
    'grid gap-0.5 rounded-2xl overflow-hidden',
    count === 1 && 'grid-cols-1',
    count === 2 && 'grid-cols-2',
    count >= 3 && 'grid-cols-2'
  );

  const getImageStyle = (index: number): string => {
    if (count === 1) return 'aspect-[4/3] w-full';
    if (count === 2) return 'aspect-square';
    if (count === 3) {
      if (index === 2) return 'aspect-[2/1] col-span-2';
      return 'aspect-square';
    }
    // 4+
    return 'aspect-square';
  };

  return (
    <>
      <div className={gridClass}>
        {displayUrls.map((url, i) => (
          <button
            key={i}
            className={cn(
              'relative overflow-hidden focus:outline-none group',
              getImageStyle(i)
            )}
            onClick={() => openViewer(i)}
          >
            <img
              src={url}
              alt=""
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
              draggable={false}
            />
            {/* "+N more" overlay on last visible image */}
            {i === 3 && extraCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">+{extraCount}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      <FullScreenMediaViewer
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        mediaUrls={urls}
        mediaTypes={urls.map(() => 'image')}
        initialIndex={viewerIndex}
      />
    </>
  );
}
