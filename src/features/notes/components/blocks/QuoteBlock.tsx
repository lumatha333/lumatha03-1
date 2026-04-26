import React, { useRef, useEffect } from 'react';
import { BlockStyle } from '../../types';
import { cn } from '@/lib/utils';

interface QuoteBlockProps {
  content: string;
  onChange: (val: string) => void;
  onEnter: (pos: number) => void;
  onBackspace: () => void;
  isFocused?: boolean;
  style?: BlockStyle;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({
  content,
  onChange,
  onEnter,
  onBackspace,
  isFocused,
  style
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && textareaRef.current) textareaRef.current.focus();
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter(e.currentTarget.selectionStart);
    } else if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      onBackspace();
    }
  };

  const adjustHeight = () => {
    const target = textareaRef.current;
    if (target) {
      target.style.height = 'auto';
      target.style.height = `${target.scrollHeight}px`;
    }
  };

  useEffect(adjustHeight, [content]);

  // Build inline styles
  const inlineStyle: React.CSSProperties = {};
  if (style?.textColor) inlineStyle.color = style.textColor;
  if (style?.isBold) inlineStyle.fontWeight = 700;
  if (style?.isItalic) inlineStyle.fontStyle = 'italic';
  if (style?.alignment) inlineStyle.textAlign = style.alignment;

  return (
    <div 
      className={cn(
        "border-l-4 border-[#8B5CF6] transition-all duration-300 px-6 py-4 rounded-r-2xl",
        style?.backgroundColor ? "" : "bg-[#8B5CF6]/[0.05]"
      )}
      style={{ 
        backgroundColor: style?.backgroundColor,
        borderRadius: style?.backgroundColor ? '16px' : undefined
      }}
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Quote..."
        style={inlineStyle}
        className="w-full bg-transparent border-none outline-none resize-none text-[#A78BFA] italic leading-[1.8] placeholder:text-white/10"
        rows={1}
      />
    </div>
  );
};
