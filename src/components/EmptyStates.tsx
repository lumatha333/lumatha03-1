// Lumatha Empty State Illustrations
// Minimal, rounded SVG illustrations for dark UI

import { cn } from '@/lib/utils';

interface IllustrationProps {
  className?: string;
  title: string;
  subtitle?: string;
}

function IllustrationWrapper({ className, title, subtitle, children }: IllustrationProps & { children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="w-24 h-24 mb-4 opacity-60">
        {children}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">{subtitle}</p>}
    </div>
  );
}

export function EmptyTasks({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No tasks yet" subtitle="Add your first task to get started">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="22" width="60" height="52" rx="12" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <rect x="30" y="36" width="24" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        <rect x="30" y="44" width="32" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        <rect x="30" y="52" width="18" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        <circle cx="24" cy="37" r="3" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
        <circle cx="24" cy="45" r="3" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
        <circle cx="24" cy="53" r="3" stroke="currentColor" strokeWidth="1.5" className="text-primary/50" />
        <path d="M22 37l1.5 1.5L27 36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60" />
        {/* Sparkles */}
        <circle cx="72" cy="20" r="2" fill="currentColor" className="text-primary/40" />
        <circle cx="78" cy="28" r="1.5" fill="currentColor" className="text-secondary/40" />
        <circle cx="68" cy="14" r="1" fill="currentColor" className="text-primary/30" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyNotes({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No notes yet" subtitle="Create a note to capture your thoughts">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="16" width="44" height="56" rx="8" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <path d="M66 16v12a4 4 0 004 4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/30" />
        <rect x="32" y="30" width="28" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        <rect x="32" y="38" width="20" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        <rect x="32" y="46" width="24" height="2" rx="1" fill="currentColor" className="text-muted-foreground/30" />
        {/* Pen */}
        <line x1="70" y1="58" x2="80" y2="48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/50" />
        <line x1="80" y1="48" x2="82" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/50" />
        <circle cx="70" cy="58" r="1" fill="currentColor" className="text-primary/50" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyMessages({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No messages yet" subtitle="Start a conversation">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="20" width="48" height="34" rx="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <path d="M24 54v8l10-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40" />
        <rect x="34" y="42" width="48" height="28" rx="10" stroke="currentColor" strokeWidth="2" className="text-primary/30" />
        <path d="M72 70v6l-8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/30" />
        <circle cx="30" cy="35" r="2" fill="currentColor" className="text-muted-foreground/30" />
        <circle cx="38" cy="35" r="2" fill="currentColor" className="text-muted-foreground/30" />
        <circle cx="46" cy="35" r="2" fill="currentColor" className="text-muted-foreground/30" />
        {/* Stars */}
        <circle cx="76" cy="18" r="1.5" fill="currentColor" className="text-primary/40" />
        <circle cx="82" cy="24" r="1" fill="currentColor" className="text-secondary/40" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyPosts({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No posts yet" subtitle="Share something with the community">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Floating cards */}
        <rect x="16" y="28" width="36" height="44" rx="8" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" transform="rotate(-6 16 28)" />
        <rect x="28" y="24" width="36" height="44" rx="8" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30" transform="rotate(3 28 24)" />
        <rect x="22" y="26" width="36" height="44" rx="8" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
        {/* Content lines */}
        <rect x="30" y="40" width="20" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
        <rect x="30" y="46" width="14" height="2" rx="1" fill="currentColor" className="text-muted-foreground/20" />
        {/* Plus */}
        <circle cx="72" cy="22" r="10" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
        <line x1="72" y1="17" x2="72" y2="27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/50" />
        <line x1="67" y1="22" x2="77" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/50" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptySearch({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No results found" subtitle="Try a different search term">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="42" cy="42" r="20" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <line x1="56" y1="56" x2="72" y2="72" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-muted-foreground/40" />
        {/* Dots inside */}
        <circle cx="35" cy="42" r="2" fill="currentColor" className="text-muted-foreground/25" />
        <circle cx="42" cy="42" r="2" fill="currentColor" className="text-muted-foreground/25" />
        <circle cx="49" cy="42" r="2" fill="currentColor" className="text-muted-foreground/25" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyNotifications({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No notifications" subtitle="You're all caught up">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M48 18c-14 0-22 10-22 22v14l-6 8h56l-6-8V40c0-12-8-22-22-22z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40" />
        <path d="M40 62c0 4.4 3.6 8 8 8s8-3.6 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/40" />
        {/* Zzz */}
        <text x="62" y="28" fontSize="10" fontWeight="bold" fill="currentColor" className="text-primary/40">z</text>
        <text x="68" y="22" fontSize="8" fontWeight="bold" fill="currentColor" className="text-primary/30">z</text>
        <text x="74" y="16" fontSize="6" fontWeight="bold" fill="currentColor" className="text-primary/20">z</text>
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptySaved({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No saved items" subtitle="Bookmark items to find them here">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 16h36a4 4 0 014 4v56l-22-14-22 14V20a4 4 0 014-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-muted-foreground/40" />
        {/* Glow circle */}
        <circle cx="48" cy="40" r="12" stroke="currentColor" strokeWidth="1.5" className="text-primary/30" />
        <circle cx="48" cy="40" r="6" fill="currentColor" fillOpacity="0.1" className="text-primary/40" />
        {/* Star in center */}
        <path d="M48 34l2 4 4.5.7-3.25 3.2.8 4.5L48 44.2l-4.05 2.2.8-4.5-3.25-3.2 4.5-.7z" fill="currentColor" className="text-primary/40" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyDocuments({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No documents" subtitle="Upload your first document">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="16" width="40" height="52" rx="6" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <path d="M52 16v12a4 4 0 004 4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-muted-foreground/30" />
        <rect x="34" y="36" width="20" height="2" rx="1" fill="currentColor" className="text-muted-foreground/25" />
        <rect x="34" y="42" width="16" height="2" rx="1" fill="currentColor" className="text-muted-foreground/25" />
        <rect x="34" y="48" width="22" height="2" rx="1" fill="currentColor" className="text-muted-foreground/25" />
        {/* Upload arrow */}
        <circle cx="68" cy="60" r="12" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
        <path d="M68 66V54m-4 4l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyVideos({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No videos" subtitle="Upload educational videos to share">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="24" width="64" height="42" rx="10" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        {/* Play triangle */}
        <path d="M42 37v18l14-9z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-primary/50" />
        {/* Film strip lines */}
        <line x1="16" y1="32" x2="80" y2="32" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
        <line x1="16" y1="58" x2="80" y2="58" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
      </svg>
    </IllustrationWrapper>
  );
}

export function EmptyFolders({ className }: { className?: string }) {
  return (
    <IllustrationWrapper className={className} title="No folders yet" subtitle="Create folders to organize your content">
      <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 32a6 6 0 016-6h16l6 8h30a6 6 0 016 6v28a6 6 0 01-6 6H22a6 6 0 01-6-6V32z" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40" />
        <path d="M16 38h64" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
        {/* Plus */}
        <line x1="48" y1="48" x2="48" y2="60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" />
        <line x1="42" y1="54" x2="54" y2="54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary/40" />
      </svg>
    </IllustrationWrapper>
  );
}
