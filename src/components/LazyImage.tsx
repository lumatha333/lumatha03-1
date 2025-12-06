import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string; // pass e.g. "16/9" to enforce; defaults to auto (free size)
  sizes?: string; // responsive sizes hint
}

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio = 'auto',
  sizes = '100vw',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hasFixedAspect = aspectRatio && aspectRatio !== 'auto';

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted', className)}
      style={hasFixedAspect ? { aspectRatio } : undefined}
    >
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          sizes={sizes}
          className={cn(
            'transition-opacity duration-300',
            hasFixedAspect ? 'w-full h-full object-cover' : 'w-full h-auto object-contain',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      )}

      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          Image not available
        </div>
      )}
    </div>
  );
}
