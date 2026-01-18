import React from 'react';
import { BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TextMemoryProps {
  memory: { content: string; isOwn: boolean }[];
  onClear?: () => void;
}

export const TextMemory: React.FC<TextMemoryProps> = ({ memory, onClear }) => {
  if (memory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Text Memory</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your last 20 text conversations will appear here. 
          A notebook of moments, not people.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-medium text-foreground">Text Memory</h3>
        </div>
        {onClear && (
          <Button variant="ghost" size="sm" onClick={onClear} className="text-muted-foreground">
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {memory.map((item, index) => (
            <div
              key={index}
              className={`flex ${item.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  item.isOwn
                    ? 'bg-primary/20 text-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words opacity-80">
                  {item.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          No names • No dates • No reconnect
        </p>
      </div>
    </div>
  );
};
