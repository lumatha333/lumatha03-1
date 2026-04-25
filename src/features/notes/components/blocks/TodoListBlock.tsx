import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2 } from 'lucide-react';
import { BlockStyle } from '../../types';
import { cn } from '@/lib/utils';

interface TodoItem {
  text: string;
  checked: boolean;
}

interface TodoListBlockProps {
  content: TodoItem[];
  onChange: (items: TodoItem[]) => void;
  onBackspace: () => void;
  isFocused?: boolean;
  style?: BlockStyle;
}

export const TodoListBlock: React.FC<TodoListBlockProps> = ({
  content, onChange, onBackspace, isFocused, style
}) => {
  const items: TodoItem[] = Array.isArray(content) ? content : [{ text: '', checked: false }];

  const updateItem = (index: number, updates: Partial<TodoItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    onChange(newItems);
  };

  const addItem = (afterIndex: number) => {
    const newItems = [...items];
    newItems.splice(afterIndex + 1, 0, { text: '', checked: false });
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1 && items[0].text === '') {
      onBackspace();
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    if (newItems.length === 0) {
      onBackspace();
      return;
    }
    onChange(newItems);
  };

  // Build inline styles
  const inlineStyle: React.CSSProperties = {};
  if (style?.textColor) inlineStyle.color = style.textColor;
  if (style?.isBold) inlineStyle.fontWeight = 700;
  if (style?.isItalic) inlineStyle.fontStyle = 'italic';
  if (style?.alignment) inlineStyle.textAlign = style.alignment;

  return (
    <div 
      className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
      style={{ backgroundColor: style?.backgroundColor }}
    >
      {items.map((item, i) => (
        <motion.div 
          key={i} 
          layout
          className="flex items-start gap-4 group/todo"
        >
          <button
            onClick={() => updateItem(i, { checked: !item.checked })}
            className="mt-1 shrink-0"
          >
            <motion.div
              animate={{
                backgroundColor: item.checked ? '#8B5CF6' : 'rgba(255,255,255,0.05)',
                borderColor: item.checked ? '#8B5CF6' : 'rgba(255,255,255,0.1)',
                scale: item.checked ? [1, 1.2, 1] : 1
              }}
              className="w-5 h-5 rounded-lg border flex items-center justify-center shadow-lg transition-colors hover:border-[#8B5CF6]/50"
            >
              <AnimatePresence>
                {item.checked && (
                  <motion.div 
                    initial={{ scale: 0, rotate: -45 }} 
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 45 }}
                  >
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
          <div className="relative flex-1 group/input">
            <input
              value={item.text}
              onChange={(e) => updateItem(i, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem(i);
                } else if (e.key === 'Backspace' && item.text === '') {
                  e.preventDefault();
                  removeItem(i);
                }
              }}
              placeholder="Task description..."
              style={inlineStyle}
              className={cn(
                "w-full bg-transparent border-none outline-none text-[15px] leading-[1.6] transition-all placeholder:text-white/10",
                item.checked ? 'text-white/20 line-through italic' : 'text-white/80'
              )}
            />
            {items.length > 1 && (
              <button 
                onClick={() => removeItem(i)}
                className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/input:opacity-100 p-1.5 hover:bg-white/5 rounded-lg transition-all text-white/20 hover:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
