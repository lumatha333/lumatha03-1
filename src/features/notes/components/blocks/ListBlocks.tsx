import React, { useRef, useEffect } from 'react';
import { BlockStyle } from '../../types';
import { cn } from '@/lib/utils';

interface BulletListBlockProps {
  content: string;
  onChange: (val: string) => void;
  onEnter: (pos: number) => void;
  onBackspace: () => void;
  isFocused?: boolean;
  style?: BlockStyle;
}

export const BulletListBlock: React.FC<BulletListBlockProps> = ({
  content, onChange, onEnter, onBackspace, isFocused, style
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) ref.current.focus();
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
    const target = ref.current;
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
      className="flex gap-4 items-start p-2 rounded-xl transition-all duration-300"
      style={{ backgroundColor: style?.backgroundColor }}
    >
      <div className="mt-3 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="List item..."
        style={inlineStyle}
        className="w-full bg-transparent border-none outline-none resize-none text-white/80 leading-[1.8] placeholder:text-white/10"
        rows={1}
      />
    </div>
  );
};

interface NumberedListBlockProps {
  content: string;
  onChange: (val: string) => void;
  onEnter: (pos: number) => void;
  onBackspace: () => void;
  isFocused?: boolean;
  index: number;
  style?: BlockStyle;
}

export const NumberedListBlock: React.FC<NumberedListBlockProps> = ({
  content, onChange, onEnter, onBackspace, isFocused, index, style
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) ref.current.focus();
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
    const target = ref.current;
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
      className="flex gap-4 items-start p-2 rounded-xl transition-all duration-300"
      style={{ backgroundColor: style?.backgroundColor }}
    >
      <span className="mt-1 text-[13px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#8B5CF6] to-[#D946EF] min-w-[20px] text-right shrink-0 tabular-nums">
        {index}.
      </span>
      <textarea
        ref={ref}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="List item..."
        style={inlineStyle}
        className="w-full bg-transparent border-none outline-none resize-none text-white/80 leading-[1.8] placeholder:text-white/10"
        rows={1}
      />
    </div>
  );
};
