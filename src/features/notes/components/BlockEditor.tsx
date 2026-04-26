import React, { useState, useCallback, useRef } from 'react';
import { NoteBlock, BlockType, BlockStyle, ImageBlockData } from '../types';
import { CanvasBlockWrapper } from './CanvasBlockWrapper';
import { TextBlock } from './blocks/TextBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { VideoBlock } from './blocks/VideoBlock';
import { DrawingBlock } from './blocks/DrawingBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { BulletListBlock, NumberedListBlock } from './blocks/ListBlocks';
import { TodoListBlock } from './blocks/TodoListBlock';
import { AnimatePresence } from 'framer-motion';

interface BlockEditorProps {
  blocks: NoteBlock[];
  onChange: (blocks: NoteBlock[]) => void;
  focusedBlockId: string | null;
  onFocusBlock: (id: string | null) => void;
  activeColor?: string;
  brushSize?: number;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ 
  blocks, onChange, focusedBlockId, onFocusBlock, activeColor, brushSize 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const updateBlock = (id: string, updates: Partial<NoteBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateBlockContent = (id: string, content: any) => {
    updateBlock(id, { content });
  };

  const deleteBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
    if (focusedBlockId === id) onFocusBlock(null);
  };

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      {blocks.map((block) => (
        <div key={block.id} data-block-id={block.id} className="contents">
          <CanvasBlockWrapper
            block={block}
            isFocused={focusedBlockId === block.id}
            onFocus={() => onFocusBlock(block.id)}
            onChange={(updates) => updateBlock(block.id, updates)}
            onDelete={() => deleteBlock(block.id)}
          >
          {/* === Content based on type === */}
          {block.type === 'text' || block.type === 'heading1' || block.type === 'heading2' || block.type === 'heading3' ? (
            <TextBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              onEnter={() => {}}
              onBackspace={() => block.content === '' && deleteBlock(block.id)}
              isFocused={focusedBlockId === block.id}
              style={block.style}
              type={block.type}
              placeholder=""
            />
          ) : block.type === 'image' ? (
            <ImageBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              onDelete={() => deleteBlock(block.id)}
              isFocused={focusedBlockId === block.id}
            />
          ) : block.type === 'video' ? (
            <VideoBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              onDelete={() => deleteBlock(block.id)}
              isFocused={focusedBlockId === block.id}
            />
          ) : block.type === 'drawing' ? (
            <DrawingBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              isFocused={focusedBlockId === block.id}
              color={activeColor}
              brushSize={brushSize}
            />
          ) : block.type === 'bulletList' ? (
            <BulletListBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              onEnter={() => {}}
              onBackspace={() => deleteBlock(block.id)}
              isFocused={focusedBlockId === block.id}
              style={block.style}
            />
          ) : block.type === 'numberedList' ? (
            <NumberedListBlock
              content={block.content}
              onChange={(val) => updateBlockContent(block.id, val)}
              onEnter={() => {}}
              onBackspace={() => deleteBlock(block.id)}
              isFocused={focusedBlockId === block.id}
              index={1} // Position-based canvas doesn't auto-index well, using 1
              style={block.style}
            />
          ) : (
            <div className="text-white/20 italic">Unsupported block</div>
          )}
          </CanvasBlockWrapper>
        </div>
      ))}
    </div>
  );
};
