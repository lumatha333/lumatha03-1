import React, { useRef, useEffect } from 'react';
import { BlockStyle, BlockType } from '../../types';
import { cn } from '@/lib/utils';

interface TextBlockProps {
  content: string;
  onChange: (content: string) => void;
  onEnter: (cursorPos: number) => void;
  onBackspace: () => void;
  placeholder?: string;
  className?: string;
  isFocused?: boolean;
  style?: BlockStyle;
  type?: BlockType;
}

const FONT_FAMILIES = {
  normal: 'inherit',
  bold: 'Inter, sans-serif',
  italic: 'serif',
  cursive: '"Dancing Script", cursive',
  serif: 'serif',
  mono: 'monospace'
};

const DEFAULT_SIZES: Record<string, number> = {
  heading1: 42,
  heading2: 32,
  heading3: 24,
  text: 20,
  bulletList: 20,
  numberedList: 20
};

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  onChange,
  onEnter,
  onBackspace,
  placeholder = "",
  className,
  isFocused,
  style,
  type = 'text'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
    }
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

  useEffect(adjustHeight, [content, style, type]);

  const fontSize = style?.fontSize || DEFAULT_SIZES[type] || 20;

  const inlineStyle: React.CSSProperties = {
    color: style?.textColor || '#FFFFFF',
    fontWeight: style?.fontFamily === 'bold' ? 800 : (style?.isBold || type.startsWith('heading') ? 700 : 400),
    fontStyle: (style?.fontFamily === 'italic' || style?.isItalic) ? 'italic' : 'normal',
    textDecoration: style?.isUnderline ? 'underline' : 'none',
    textAlign: style?.alignment || 'center',
    fontFamily: FONT_FAMILIES[style?.fontFamily || 'normal'],
    fontSize: `${fontSize}px`,
    lineHeight: 1.2,
    backgroundColor: style?.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : 'transparent',
    padding: style?.backgroundColor ? '16px 24px' : '0',
    borderRadius: style?.backgroundColor ? '24px' : '0',
  };

  return (
    <>
      {/* Import cursive font if used */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
      `}} />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={inlineStyle}
        className={cn(
          "w-full bg-transparent border-none outline-none resize-none transition-all duration-300",
          "placeholder:text-white/10 min-w-[140px] max-w-2xl",
          className
        )}
        rows={1}
      />
    </>
  );
};
