import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyBlurImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderClassName?: string;
}

// Generate a consistent blur placeholder gradient based on image seed
const generateBlurPlaceholder = (src: string): string => {
  // Create a simple hash from the src string
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    const char = src.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate colors based on hash
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  
  return `linear-gradient(135deg, hsl(${hue1}, 30%, 70%) 0%, hsl(${hue2}, 40%, 60%) 100%)`;
};

const LazyBlurImage: React.FC<LazyBlurImageProps> = ({
  src,
  alt,
  className = '',
  placeholderClassName = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const blurGradient = generateBlurPlaceholder(src);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  return (
    <div 
      ref={imgRef} 
      className={cn('relative overflow-hidden', className)}
    >
      {/* Blur placeholder with shimmer effect */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isLoaded ? 'opacity-0' : 'opacity-100',
          placeholderClassName
        )}
        style={{ background: blurGradient }}
      >
        {!isLoaded && (
          <div className="absolute inset-0 shimmer" />
        )}
      </div>

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}

      {/* Fallback for error */}
      {hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={{ background: blurGradient }}
        >
          <span className="text-muted-foreground text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default LazyBlurImage;
