import { cn } from '@/lib/utils';

/**
 * Advanced Skeleton Loaders with proper shadows and multi-level animation
 * Inspired by Facebook, Instagram, YouTube skeleton implementations
 */

// Base skeleton with enhanced animation and shadow
export function SkeletonBase({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md',
        'bg-gradient-to-r from-[#1a2547] via-[#111c2e] to-[#1a2547]',
        'shadow-md',
        'relative overflow-hidden',
        className
      )}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.1)',
      }}
      {...props}
    />
  );
}

// Post Card Skeleton - Full featured
export function PostCardSkeleton() {
  return (
    <div className="bg-[#0d1625] rounded-lg shadow-lg p-4 mb-4 space-y-4 border border-[#1e2d45]">
      {/* Header: Avatar + Name + Time */}
      <div className="flex items-center gap-3">
        <SkeletonBase className="w-12 h-12 rounded-full shadow-md" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="h-4 w-32 shadow-sm" />
          <SkeletonBase className="h-3 w-24 shadow-sm" />
        </div>
      </div>

      {/* Post Text Content */}
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-full shadow-sm" />
        <SkeletonBase className="h-4 w-5/6 shadow-sm" />
        <SkeletonBase className="h-4 w-4/6 shadow-sm" />
      </div>

      {/* Post Image/Media */}
      <SkeletonBase className="w-full h-64 rounded-lg shadow-md" />

      {/* Engagement Stats */}
      <div className="flex gap-4">
        <SkeletonBase className="h-4 w-16 shadow-sm" />
        <SkeletonBase className="h-4 w-16 shadow-sm" />
        <SkeletonBase className="h-4 w-16 shadow-sm" />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-around pt-2 border-t border-[#1e2d45]">
        <SkeletonBase className="h-10 w-20 rounded shadow-sm" />
        <SkeletonBase className="h-10 w-20 rounded shadow-sm" />
        <SkeletonBase className="h-10 w-20 rounded shadow-sm" />
      </div>
    </div>
  );
}

// Feed Skeleton - Multiple posts
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Message Skeleton - For chat list
export function MessageSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-[#111c2e] rounded-lg">
      {/* Avatar */}
      <SkeletonBase className="w-12 h-12 rounded-full flex-shrink-0" />

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-32" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-4/5" />
      </div>

      {/* Time */}
      <SkeletonBase className="h-3 w-12" />
    </div>
  );
}

// Chat Message Skeleton - Full message bubble
export function ChatMessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <div className={cn('flex gap-2 mb-3', isOwn && 'flex-row-reverse')}>
      {!isOwn && <SkeletonBase className="w-8 h-8 rounded-full flex-shrink-0" />}
      <SkeletonBase className={cn('h-12 rounded-2xl', isOwn ? 'w-32 ml-auto' : 'w-40')} />
    </div>
  );
}

// Comment Skeleton
export function CommentSkeleton() {
  return (
    <div className="flex gap-2 mb-3">
      {/* Avatar */}
      <SkeletonBase className="w-8 h-8 rounded-full flex-shrink-0" />

      {/* Comment Content */}
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-3 w-24" />
        <SkeletonBase className="h-3 w-full" />
        <SkeletonBase className="h-3 w-3/4" />
      </div>
    </div>
  );
}

// Comments Section Skeleton
export function CommentsSectionSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
}

// Messages List Skeleton
export function MessagesListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

// Profile Header Skeleton
export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-lg shadow-md p-4 space-y-4">
      <div className="flex gap-4">
        {/* Avatar */}
        <SkeletonBase className="w-24 h-24 rounded-full flex-shrink-0" />

        {/* Profile Info */}
        <div className="flex-1 space-y-3">
          <SkeletonBase className="h-6 w-32" />
          <SkeletonBase className="h-4 w-24" />
          <div className="flex gap-6">
            <div className="space-y-1">
              <SkeletonBase className="h-5 w-8" />
              <SkeletonBase className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <SkeletonBase className="h-5 w-8" />
              <SkeletonBase className="h-3 w-12" />
            </div>
            <div className="space-y-1">
              <SkeletonBase className="h-5 w-8" />
              <SkeletonBase className="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Video Grid Skeleton (3 columns)
export function VideoGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="w-full aspect-video rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Picture Grid Skeleton (3 columns - like Explore)
export function PictureGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <SkeletonBase className="w-full aspect-square rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// Notification Item Skeleton
export function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-3 border-b border-gray-200 dark:border-gray-800">
      <SkeletonBase className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
      <SkeletonBase className="w-12 h-12 rounded" />
    </div>
  );
}

// Notifications Panel Skeleton
export function NotificationsPanelSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-0">
      {[...Array(count)].map((_, i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}

// Full Page Loading Skeleton (for initial load)
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <ProfileHeaderSkeleton />
      <FeedSkeleton count={2} />
    </div>
  );
}

// Spinner with shimmer effect (for small loading states)
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
      <div
        className={cn(
          'absolute inset-0 rounded-full border-2 border-transparent',
          'border-t-current border-r-current',
          'text-primary',
          'spinner'
        )}
      />
    </div>
  );
}

// Chat Input Area Skeleton
export function ChatInputSkeleton() {
  return (
    <div className="flex items-end gap-2 p-4 border-t border-gray-200 dark:border-gray-800">
      <SkeletonBase className="w-10 h-10 rounded-full" />
      <SkeletonBase className="flex-1 h-10 rounded-full" />
      <SkeletonBase className="w-10 h-10 rounded-full" />
    </div>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 p-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <SkeletonBase className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-32" />
            <SkeletonBase className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Inline CSS for shimmer animation (to be added to global styles if not present)
export const SHIMMER_STYLES = `
  @keyframes shimmer {
    0%, 100% {
      background-position: 200% 0;
    }
    50% {
      background-position: -200% 0;
    }
  }

  .animate-pulse-shimmer {
    animation: shimmer 2s infinite;
  }
`;
