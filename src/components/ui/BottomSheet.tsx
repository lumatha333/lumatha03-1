import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const BottomSheet = React.forwardRef<
  HTMLDivElement,
  BottomSheetProps
>(({ open, onOpenChange, title, children, className = '' }, ref) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="bottom" 
        ref={ref}
        className={`h-auto max-h-[90vh] rounded-t-2xl bg-gradient-to-b from-background/95 to-background border-t border-primary/10 p-0 overflow-hidden ${className}`}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-3 sticky top-0 bg-gradient-to-b from-background/95 to-transparent z-10">
          <div className="h-1 w-12 rounded-full bg-muted-foreground/30 transition-colors hover:bg-muted-foreground/50" />
        </div>

        {title && (
          <div className="px-6 pb-4 sticky top-8 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-between gap-4">
            <SheetTitle className="text-lg font-black">{title}</SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 hover:bg-muted/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="px-6 pb-8 overflow-y-auto"
        >
          {children}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
});

BottomSheet.displayName = 'BottomSheet';
