import React, { useRef, useEffect } from 'react';
import { Info, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import { BlockStyle } from '../../types';
import { cn } from '@/lib/utils';

interface CalloutBlockProps {
  content: string;
  onChange: (val: string) => void;
  onBackspace: () => void;
  isFocused?: boolean;
  style?: BlockStyle;
  variant?: 'info' | 'warning' | 'success' | 'tip';
}

const VARIANTS = {
  info: { icon: Info, bg: 'rgba(59,130,246,0.08)', border: '#3B82F6', text: '#93C5FD', iconColor: '#60A5FA' },
  warning: { icon: AlertTriangle, bg: 'rgba(245,158,11,0.08)', border: '#F59E0B', text: '#FCD34D', iconColor: '#FBBF24' },
  success: { icon: CheckCircle2, bg: 'rgba(16,185,129,0.08)', border: '#10B981', text: '#6EE7B7', iconColor: '#34D399' },
  tip: { icon: Flame, bg: 'rgba(139,92,246,0.08)', border: '#8B5CF6', text: '#C4B5FD', iconColor: '#A78BFA' },
};

export const CalloutBlock: React.FC<CalloutBlockProps> = ({
  content, onChange, onBackspace, isFocused, style, variant = 'info'
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;

  useEffect(() => {
    if (isFocused && textareaRef.current) textareaRef.current.focus();
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace' && content === '') {
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
      className="flex gap-4 rounded-2xl px-6 py-4 border border-white/5 transition-all duration-300"
      style={{ 
        backgroundColor: style?.backgroundColor || v.bg,
        borderLeft: `4px solid ${v.border}`
      }}
    >
      <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
        <Icon className="w-4 h-4" style={{ color: v.iconColor }} />
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Callout content..."
        className="w-full bg-transparent border-none outline-none resize-none leading-[1.7] placeholder:text-white/10"
        style={{ color: v.text, ...inlineStyle }}
        rows={1}
      />
    </div>
  );
};
