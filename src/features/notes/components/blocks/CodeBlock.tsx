import React from 'react';

interface CodeBlockProps {
  content: string;
  onChange: (val: string) => void;
  onBackspace: () => void;
  isFocused?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  content,
  onChange,
  onBackspace,
  isFocused
}) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (isFocused && textareaRef.current) textareaRef.current.focus();
  }, [isFocused]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && content === '') {
      e.preventDefault();
      onBackspace();
    }
  };

  return (
    <div className="relative group bg-[#0A0E1A] border border-white/[0.06] rounded-xl p-4 font-mono">
      <div className="absolute top-2 right-3 text-[10px] text-[#6B7280] uppercase tracking-widest pointer-events-none">
        Code
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="// Paste code here..."
        className="w-full bg-transparent border-none outline-none resize-none text-[#A3E635] text-[14px] leading-relaxed placeholder:text-[#374151]"
        rows={1}
        style={{ height: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        onInput={(e) => {
          const target = e.target as HTMLTextAreaElement;
          target.style.height = 'auto';
          target.style.height = target.scrollHeight + 'px';
        }}
      />
    </div>
  );
};
