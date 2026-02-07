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
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-1.5 border-b bg-muted/30">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => execCommand(tool.command, tool.value)}
            title={tool.label}
          >
            <tool.icon className="w-3.5 h-3.5" />
          </Button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className={cn(
          "min-h-[200px] max-h-[400px] overflow-y-auto p-3 text-sm focus:outline-none",
          "prose prose-sm dark:prose-invert max-w-none",
          "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2",
          "[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          "[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-2 [&_pre]:font-mono [&_pre]:text-xs",
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
          opacity: 0.5;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
