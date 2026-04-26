/**
 * Message Reactions Limiter
 * Limit users to reacting with maximum 2 emoji/sticker reactions per message
 * Positioned in the message center for clean UI
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageReaction {
  id: string;
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (reactionId: string) => void;
  maxReactions?: number;
  messageId: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '😍', '🙌'];

export function MessageReactions({
  reactions,
  onAddReaction,
  onRemoveReaction,
  maxReactions = 2,
  messageId,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const userReactionCount = reactions.filter(r => r.userReacted).length;
  const canAddMore = userReactionCount < maxReactions;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted transition-colors"
        >
          <span className="text-sm cursor-pointer hover:scale-110 transition-transform">
            {reaction.emoji}
          </span>
          {reaction.count > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              {reaction.count}
            </span>
          )}
          {reaction.userReacted && (
            <button
              onClick={() => onRemoveReaction(reaction.id)}
              className="text-xs text-muted-foreground hover:text-foreground p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {/* Add reaction button - only show if can add more */}
      {canAddMore && (
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className={cn(
              'inline-flex items-center justify-center w-7 h-7 rounded-full',
              'bg-muted/60 hover:bg-muted transition-colors',
              'text-xs font-semibold',
              showPicker && 'bg-primary text-primary-foreground'
            )}
            title={`Add reaction (${userReactionCount}/${maxReactions})`}
          >
            +
          </button>

          {/* Reaction picker */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-2 flex gap-1 p-2 bg-background rounded-2xl border border-border shadow-lg z-40 animate-in scale-in-50">
              {QUICK_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction(emoji);
                    setShowPicker(false);
                  }}
                  className="w-8 h-8 text-lg hover:scale-125 transition-transform hover:bg-muted rounded-lg flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Reaction count badge */}
          {userReactionCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-[10px] font-bold flex items-center justify-center">
              {userReactionCount}
            </div>
          )}
        </div>
      )}

      {/* Max reactions reached message */}
      {!canAddMore && (
        <span className="text-[10px] text-muted-foreground">
          Max {maxReactions} reactions
        </span>
      )}
    </div>
  );
}

/**
 * Quick Sticker Panel - Appears below chat when no message
 * Heart as primary, single tap to send, double/long-press to add as quick sticker
 */
interface QuickStickerPanelProps {
  onSelectSticker: (sticker: string) => void;
  onEditStickers: () => void;
  isVisible: boolean;
}

const defaultQuickStickers = ['❤️', '👍', '😂', '✨', '🔥', '🙏'];

export function QuickStickerPanel({
  onSelectSticker,
  onEditStickers,
  isVisible,
}: QuickStickerPanelProps) {
  const [quickStickers, setQuickStickers] = useState(defaultQuickStickers);
  const [longPressTarget, setLongPressTarget] = useState<string | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const longPressActiveRef = React.useRef(false);

  // Load saved quick stickers on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('lumatha_quick_stickers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuickStickers(parsed);
        }
      } catch { /* ignore */ }
    }
  }, []);

  const handleMouseDown = (sticker: string) => {
    setIsLongPressing(true);
    longPressActiveRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      setLongPressTarget(sticker);
      setIsLongPressing(false);
      // Provide haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleMouseUp = (sticker: string) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    
    // If it was a long press, don't send - just keep the selection visible
    if (longPressActiveRef.current) {
      // Long press completed - sticker stays selected
      setIsLongPressing(false);
      return;
    }
    
    // Short tap - send the sticker
    setIsLongPressing(false);
    setLongPressTarget(null);
    onSelectSticker(sticker);
  };

  const handleMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    setIsLongPressing(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onEditStickers();
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-full left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 p-3 flex items-center justify-between gap-2 z-20 animate-in slide-in-from-bottom duration-300"
      style={{ 
        animation: 'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
      }}
    >
      <div className="flex gap-2 flex-1 items-center">
        {/* Heart as primary */}
        <button
          onMouseDown={() => handleMouseDown('❤️')}
          onMouseUp={() => handleMouseUp('❤️')}
          onMouseLeave={handleMouseLeave}
          onTouchStart={(e) => {
            handleMouseDown('❤️');
            (e.currentTarget as any).touchStarted = true;
          }}
          onTouchEnd={(e) => {
            if ((e.currentTarget as any).touchStarted) {
              handleMouseUp('❤️');
              (e.currentTarget as any).touchStarted = false;
            }
          }}
          onContextMenu={handleContextMenu}
          className={`
            relative text-2xl transition-all duration-200 ease-out select-none
            ${longPressTarget === '❤️' 
              ? 'scale-125 bg-primary/20 rounded-lg p-1 shadow-lg shadow-primary/30 ring-2 ring-primary/50' 
              : 'hover:scale-110 hover:bg-white/5 rounded-lg p-1'
            }
            ${isLongPressing && longPressTarget !== '❤️' ? 'opacity-50' : 'opacity-100'}
          `}
          title="Hold for options, tap to send ❤️"
          style={{
            transform: longPressTarget === '❤️' ? 'scale(1.25) translateY(-4px)' : undefined,
            transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          ❤️
          {longPressTarget === '❤️' && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Other quick stickers */}
        {quickStickers.slice(1).map((sticker) => (
          <button
            key={sticker}
            onMouseDown={() => handleMouseDown(sticker)}
            onMouseUp={() => handleMouseUp(sticker)}
            onMouseLeave={handleMouseLeave}
            onTouchStart={(e) => {
              handleMouseDown(sticker);
              (e.currentTarget as any).touchStarted = true;
            }}
            onTouchEnd={(e) => {
              if ((e.currentTarget as any).touchStarted) {
                handleMouseUp(sticker);
                (e.currentTarget as any).touchStarted = false;
              }
            }}
            onContextMenu={handleContextMenu}
            className={`
              relative text-xl transition-all duration-200 ease-out select-none
              ${longPressTarget === sticker 
                ? 'scale-125 bg-primary/20 rounded-lg p-1 shadow-lg shadow-primary/30 ring-2 ring-primary/50' 
                : 'hover:scale-110 hover:bg-white/5 rounded-lg p-1'
              }
              ${isLongPressing && longPressTarget !== sticker ? 'opacity-50' : 'opacity-100'}
            `}
            title={`Hold for options, tap to send ${sticker}`}
            style={{
              transform: longPressTarget === sticker ? 'scale(1.25) translateY(-4px)' : undefined,
              transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {sticker}
            {longPressTarget === sticker && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Settings button to edit quick stickers */}
      <button
        onClick={onEditStickers}
        className="text-xs font-medium text-primary hover:text-primary/80 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"
        title="Edit quick stickers"
      >
        ⚙️
      </button>
    </div>
  );
}
