import { useState } from 'react';
import { cn } from '@/lib/utils';

const REACTION_EMOJIS = ['🙏', '❤️', '😂', '😮', '😢', '😡', '👍'];

interface EmojiReactionPickerProps {
  reactions: Record<string, number>;
  onReact: (emoji: string) => void;
  isOwn: boolean;
}

export function EmojiReactionPicker({ reactions, onReact, isOwn }: EmojiReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const totalReactions = Object.values(reactions).reduce((sum, c) => sum + c, 0);
  const topReactions = Object.entries(reactions)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="relative">
      {/* Reaction display */}
      {totalReactions > 0 && (
        <div className={cn(
          "absolute -bottom-3 flex items-center gap-0.5 bg-card border-[1.5px] border-purple-500/60 rounded-full px-2 py-1 shadow-[0_0_10px_rgba(168,85,247,0.4)]",
          isOwn ? "right-1" : "left-1"
        )}>
          {topReactions.map(([emoji, count]) => (
            <span key={emoji} className="text-[11px]">{emoji}</span>
          ))}
          {totalReactions > 1 && (
            <span className="text-[9px] text-muted-foreground font-medium ml-0.5">{totalReactions}</span>
          )}
        </div>
      )}

      {/* Reaction trigger - double tap / long press area */}
      <button
        className="absolute inset-0 z-10"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onReact('🙏');
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPicker(true);
        }}
        onClick={(e) => {
          if (showPicker) {
            e.stopPropagation();
            setShowPicker(false);
          }
        }}
      />

      {/* Picker popup */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className={cn(
            "absolute z-50 -top-10 flex items-center gap-1 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg animate-in zoom-in-90 duration-150",
            isOwn ? "right-0" : "left-0"
          )}>
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className="text-lg hover:scale-125 transition-transform active:scale-95 px-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(emoji);
                  setShowPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
