import { useEffect } from 'react';

interface UseKeyboardGalleryOptions {
  open: boolean;
  total: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

/**
 * Adds keyboard navigation to a fullscreen gallery:
 *  - ArrowRight / ArrowDown → next item
 *  - ArrowLeft  / ArrowUp   → previous item
 *  - Escape                  → close gallery
 */
export function useKeyboardGallery({
  open,
  total,
  currentIndex,
  onNext,
  onPrev,
  onClose,
}: UseKeyboardGalleryOptions) {
  useEffect(() => {
    if (!open || total <= 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < total - 1) onNext();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) onPrev();
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, total, currentIndex, onNext, onPrev, onClose]);
}
