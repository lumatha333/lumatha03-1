import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const tools = [
    { icon: Bold, command: 'bold', label: 'Bold' },
    { icon: Italic, command: 'italic', label: 'Italic' },
    { icon: Underline, command: 'underline', label: 'Underline' },
    { icon: Heading1, command: 'formatBlock', value: 'H1', label: 'Heading 1' },
    { icon: Heading2, command: 'formatBlock', value: 'H2', label: 'Heading 2' },
    { icon: List, command: 'insertUnorderedList', label: 'Bullets' },
    { icon: ListOrdered, command: 'insertOrderedList', label: 'Numbered' },
    { icon: Quote, command: 'formatBlock', value: 'BLOCKQUOTE', label: 'Quote' },
    { icon: Code, command: 'formatBlock', value: 'PRE', label: 'Code' },
  ];

  return (
    <div className={cn("border rounded-xl overflow-hidden bg-background shadow-sm", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b bg-muted/20 backdrop-blur">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
            onClick={() => execCommand(tool.command, tool.value)}
            title={tool.label}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "min-h-[240px] max-h-[450px] overflow-y-auto p-4 text-sm focus:outline-none",
          "prose prose-sm dark:prose-invert max-w-none",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2",
          "[&_blockquote]:border-l-3 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:bg-primary/5 [&_blockquote]:py-2 [&_blockquote]:rounded-r-lg",
          "[&_pre]:bg-muted/50 [&_pre]:rounded-xl [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:border [&_pre]:border-border/30",
          "[&_ul]:list-disc [&_ul]:pl-5",
          "[&_ol]:list-decimal [&_ol]:pl-5"
        )}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value || '' }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          opacity: 0.4;
          pointer-events: none;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
