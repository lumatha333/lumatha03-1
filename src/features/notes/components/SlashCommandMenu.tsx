import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Type, Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Code, Minus, Info, Image as ImageIcon
} from 'lucide-react';
import { BlockType } from '../types';

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filter: string;
}

const COMMANDS: { type: BlockType; label: string; icon: any; shortcut: string; description: string }[] = [
  { type: 'text', label: 'Text', icon: Type, shortcut: '/text', description: 'Plain text block' },
  { type: 'heading1', label: 'Heading 1', icon: Heading1, shortcut: '/h1', description: 'Large heading' },
  { type: 'heading2', label: 'Heading 2', icon: Heading2, shortcut: '/h2', description: 'Medium heading' },
  { type: 'heading3', label: 'Heading 3', icon: Heading3, shortcut: '/h3', description: 'Small heading' },
  { type: 'bulletList', label: 'Bullet List', icon: List, shortcut: '/bullet', description: 'Unordered list' },
  { type: 'numberedList', label: 'Numbered List', icon: ListOrdered, shortcut: '/number', description: 'Ordered list' },
  { type: 'todoList', label: 'To-do List', icon: CheckSquare, shortcut: '/todo', description: 'Checkbox items' },
  { type: 'quote', label: 'Quote', icon: Quote, shortcut: '/quote', description: 'Block quotation' },
  { type: 'code', label: 'Code', icon: Code, shortcut: '/code', description: 'Code snippet' },
  { type: 'callout', label: 'Callout', icon: Info, shortcut: '/callout', description: 'Highlight info' },
  { type: 'divider', label: 'Divider', icon: Minus, shortcut: '/divider', description: 'Horizontal line' },
  { type: 'image', label: 'Image', icon: ImageIcon, shortcut: '/image', description: 'Upload an image' },
];

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  position, onSelect, onClose, filter,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.type.toLowerCase().includes(filter.toLowerCase()) ||
    cmd.shortcut.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => { setSelectedIndex(0); }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) onSelect(filteredCommands[selectedIndex].type);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredCommands, selectedIndex, onSelect, onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed z-[100] w-60 bg-[#0A0F1EF5] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
      style={{ left: Math.min(position.x, window.innerWidth - 260), top: Math.min(position.y, window.innerHeight - 400) }}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-[#4B5563] font-bold">
        Blocks
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        {filteredCommands.map((cmd, index) => {
          const Icon = cmd.icon;
          const isActive = index === selectedIndex;
          return (
            <button
              key={cmd.type}
              onClick={() => onSelect(cmd.type)}
              onMouseMove={() => setSelectedIndex(index)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                isActive ? 'bg-[#8B5CF6]/15 text-white' : 'text-[#9CA3AF]'
              )}
            >
              <div className={cn('p-1.5 rounded-lg', isActive ? 'bg-[#8B5CF6]/25 text-white' : 'bg-white/5')}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{cmd.label}</div>
                <div className="text-[10px] text-[#4B5563]">{cmd.description}</div>
              </div>
              {isActive && <span className="text-[10px] text-[#8B5CF6] font-mono shrink-0">{cmd.shortcut}</span>}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};
