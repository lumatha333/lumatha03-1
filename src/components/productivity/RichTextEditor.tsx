import { useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Code, Minus, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = '240px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!isEditingRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      const newVal = editorRef.current.innerHTML;
      lastValueRef.current = newVal;
      onChange(newVal);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isEditingRef.current = true;
      const newVal = editorRef.current.innerHTML;
      lastValueRef.current = newVal;
      onChange(newVal);
      setTimeout(() => { isEditingRef.current = false; }, 0);
    }
  }, [onChange]);

  const handleFocus = () => { isEditingRef.current = true; };
  const handleBlur = () => { isEditingRef.current = false; };

  const clearFormatting = useCallback(() => {
    document.execCommand('removeFormat', false);
    document.execCommand('formatBlock', false, 'p');
    if (editorRef.current) {
      const newVal = editorRef.current.innerHTML;
      onChange(newVal);
    }
  }, [onChange]);

  const tools = [
    { icon: Bold, command: 'bold', label: 'B' },
    { icon: Italic, command: 'italic', label: 'I' },
    { icon: Underline, command: 'underline', label: 'U' },
    { icon: Minus, command: 'insertHorizontalRule', label: '—' },
    { icon: Heading1, command: 'formatBlock', value: 'H1', label: 'H1' },
    { icon: Heading2, command: 'formatBlock', value: 'H2', label: 'H2' },
    { icon: List, command: 'insertUnorderedList', label: '•' },
    { icon: ListOrdered, command: 'insertOrderedList', label: '1.' },
    { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE', label: '"' },
    { icon: Code, command: 'formatBlock', value: 'PRE', label: '</>' },
  ];

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 overflow-x-auto no-scrollbar px-3 py-2 sticky top-0 z-10"
        style={{ background: '#111827', borderBottom: '1px solid #1f2937' }}
      >
        {tools.map((tool) => (
          <button
            key={tool.label}
            type="button"
            className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: '#94A3B8' }}
            onMouseDown={(e) => {
              e.preventDefault();
              execCommand(tool.command, tool.value);
            }}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Editable area - Premium text editor with enhanced visibility */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "flex-1 overflow-y-auto focus:outline-none transition-all duration-200",
          "prose prose-sm dark:prose-invert max-w-none",
          "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-[#f1f5f9] [&_h1]:font-display",
          "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2.5 [&_h2]:text-[#e2e8f0]",
          "[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-[#cbd5e1]",
          "[&_p]:text-[#f0f4f8] [&_p]:break-words [&_p]:leading-relaxed",
          "[&_blockquote]:border-l-4 [&_blockquote]:border-purple-500 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_blockquote]:bg-purple-500/10 [&_blockquote]:text-purple-200",
          "[&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:bg-black/60 [&_pre]:text-emerald-300 [&_pre]:overflow-x-auto",
          "[&_code]:text-amber-300 [&_code]:bg-black/40 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-[#f0f4f8] [&_li]:mb-1.5 [&_li]:marker:text-purple-400",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_li]:text-[#f0f4f8]",
          "[&_a]:text-cyan-400 [&_a]:underline [&_a]:hover:text-cyan-300",
          "[&_strong]:font-bold [&_strong]:text-[#f0f4f8]",
          "[&_em]:italic [&_em]:text-[#cbd5e1]",
          "selection:bg-purple-500/40 selection:text-[#f0f4f8]",
          "focus:ring-2 focus:ring-purple-500/50"
        )}
        style={{
          padding: '20px 24px',
          minHeight,
          fontSize: 16,
          lineHeight: 1.85,
          color: '#f0f4f8',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#0f1419',
          borderRadius: '12px',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(124,58,237,0.05)',
          caretColor: '#7c3aed',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
        }}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder || 'Start writing your thoughts...'}
        spellCheck="true"
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #475569;
          pointer-events: none;
          font-style: italic;
          font-size: 0.95em;
        }
        [contenteditable]:focus {
          outline: none;
        }
        [contenteditable] {
          word-break: break-word;
          overflow-wrap: break-word;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
}
