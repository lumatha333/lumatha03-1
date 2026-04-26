import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/button';
import { 
  Bookmark, 
  Share2, 
  Flag, 
  Edit3, 
  Trash2,
  Copy,
  Eye,
  EyeOff,
  MessageCircle,
  Volume2,
  VolumeX,
  HelpCircle,
  Lock,
  BarChart3,
  MessageSquareOff,
  Shield,
  Zap,
  Download
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PostActionsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  isOwnPost: boolean;
  isSaved: boolean;
  isHidden: boolean;
  isMuted?: boolean;
  creatorName?: string;
  onSave?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
  onReport?: () => void;
  onCopy?: () => void;
  onMute?: () => void;
  onBlock?: () => void;
  onToggleComments?: () => void;
  onViewInsights?: () => void;
  onDownload?: () => void;
  postLikesCount?: number;
  postLikesRank?: 'trending' | 'popular' | 'recent' | 'random' | 'followed' | 'regional';
}

export const PostActionsMenu: React.FC<PostActionsMenuProps> = ({
  open,
  onOpenChange,
  postId,
  isOwnPost,
  isSaved,
  isHidden,
  isMuted = false,
  creatorName = 'Creator',
  onSave,
  onShare,
  onEdit,
  onDelete,
  onHide,
  onReport,
  onCopy,
  onMute,
  onBlock,
  onToggleComments,
  onViewInsights,
  onDownload,
  postLikesCount = 0,
  postLikesRank = 'random',
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentsOff, setCommentsOff] = useState(false);
  const [showWhySeeing, setShowWhySeeing] = useState(false);

  if (showDeleteConfirm) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange} title="Delete Post">
        <div className="space-y-4">
          <p className="text-sm/relaxed text-muted-foreground">
            Are you sure you want to delete this post? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.();
                setShowDeleteConfirm(false);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // VIEWER MENU - for posts from other users
  if (!isOwnPost) {
    return (
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <motion.div
          className="space-y-0"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* SECTION 1: SHOW MORE LIKE THIS */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm text-green-500 hover:text-green-600 hover:bg-green-500/5"
              onClick={() => {
                onCopy?.();
                onOpenChange(false);
              }}
            >
              <Eye className="w-4 h-4" />
              <span>Show more like this</span>
            </Button>
          </motion.div>

          {/* DIVIDER */}
          <div className="h-px bg-muted/20 my-2" />

          {/* SECTION 2: DOWNLOAD MEDIA */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm"
              onClick={() => {
                onDownload?.();
                onOpenChange(false);
              }}
            >
              <Download className="w-4 h-4" />
              <span>Download media</span>
            </Button>
          </motion.div>

          {/* DIVIDER */}
          <div className="h-px bg-muted/20 my-2" />

          {/* SECTION 3: IMMEDIATE CONTROL */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm"
              onClick={() => {
                onHide?.();
                onOpenChange(false);
              }}
            >
              <EyeOff className="w-4 h-4" />
              <span>{isHidden ? 'Undo Hide' : 'Hide post'}</span>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm"
              onClick={() => {
                onCopy?.();
                onOpenChange(false);
              }}
            >
              <Eye className="w-4 h-4" />
              <span>Show less like this</span>
            </Button>
          </motion.div>

          {/* DIVIDER */}
          <div className="h-px bg-muted/20 my-2" />

          {/* SECTION 4: CREATOR CONTROL */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm"
              onClick={() => {
                onMute?.();
                onOpenChange(false);
              }}
            >
              {isMuted ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Unmute {creatorName}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Mute {creatorName}</span>
                </>
              )}
            </Button>
          </motion.div>

          {/* DIVIDER */}
          <div className="h-px bg-muted/20 my-2" />

          {/* SECTION 5: SAFETY LAYER */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm text-amber-500 hover:text-amber-600 hover:bg-amber-500/5"
              onClick={() => {
                onReport?.();
                onOpenChange(false);
              }}
            >
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </Button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-sm text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => {
                onBlock?.();
                onOpenChange(false);
              }}
            >
              <Shield className="w-4 h-4" />
              <span>Block</span>
            </Button>
          </motion.div>

          {/* DIVIDER */}
          <div className="h-px bg-muted/20 my-2" />

          {/* SECTION 6: TRANSPARENCY */}
          <motion.div variants={itemVariants}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 py-4 text-xs text-muted-foreground"
              onClick={() => setShowWhySeeing(true)}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Why am I seeing this?</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Why AM I Seeing This Modal */}
        {showWhySeeing && (
          <BottomSheet open={showWhySeeing} onOpenChange={setShowWhySeeing} title="Why am I seeing this?">
            <div className="space-y-4 p-4">
              <p className="text-sm text-foreground">
                You're seeing this post because:
              </p>
              
              {postLikesRank === 'trending' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-amber-600">🔥 Trending Post</p>
                  <p className="text-xs text-muted-foreground">This post has many likes and shares. It's trending on Lumatha right now.</p>
                </div>
              )}
              
              {postLikesRank === 'popular' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-blue-600">⭐ Popular Post</p>
                  <p className="text-xs text-muted-foreground">This post is popular and has received high engagement from users. {postLikesCount && `(${postLikesCount} likes)`}</p>
                </div>
              )}
              
              {postLikesRank === 'recent' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-green-600">⏰ Recent Post</p>
                  <p className="text-xs text-muted-foreground">This post was recently shared by someone in your network or on Lumatha.</p>
                </div>
              )}
              
              {postLikesRank === 'random' && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-purple-600">🎲 Discovery Post</p>
                  <p className="text-xs text-muted-foreground">Our algorithm picked this post to help you discover interesting content.</p>
                </div>
              )}
              
              {postLikesRank === 'followed' && (
                <div className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-pink-600">👤 From Someone You Follow</p>
                  <p className="text-xs text-muted-foreground">You follow {creatorName} and this is their recent post.</p>
                </div>
              )}
              
              {postLikesRank === 'regional' && (
                <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-3 space-y-2">
                  <p className="text-sm font-semibold text-indigo-600">🇳🇵 Nepal Post</p>
                  <p className="text-xs text-muted-foreground">This post is from Nepal, your region. We show content from your location prominently.</p>
                </div>
              )}
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowWhySeeing(false)}
              >
                Got It
              </Button>
            </div>
          </BottomSheet>
        )}
      </BottomSheet>
    );
  }

  // OWNER MENU - for own posts
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <motion.div
        className="space-y-0"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* SECTION 1: CONTENT ACTIONS */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm"
            onClick={() => {
              onEdit?.();
              onOpenChange(false);
            }}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit post</span>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete post</span>
          </Button>
        </motion.div>

        {/* DIVIDER */}
        <div className="h-px bg-muted/20 my-2" />

        {/* SECTION 2: VISIBILITY CONTROL */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm"
            onClick={() => onOpenChange(false)}
          >
            <Lock className="w-4 h-4" />
            <span>Visibility: Public</span>
            <span className="ml-auto text-xs text-muted-foreground">›</span>
          </Button>
        </motion.div>

        {/* DIVIDER */}
        <div className="h-px bg-muted/20 my-2" />

        {/* SECTION 3: INSIGHTS */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm"
            onClick={() => {
              onViewInsights?.();
              onOpenChange(false);
            }}
          >
            <BarChart3 className="w-4 h-4" />
            <span>View insights</span>
          </Button>
        </motion.div>

        {/* DIVIDER */}
        <div className="h-px bg-muted/20 my-2" />

        {/* SECTION 4: INTERACTION CONTROL */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm"
            onClick={() => {
              setCommentsOff(!commentsOff);
              onToggleComments?.();
            }}
          >
            <MessageSquareOff className="w-4 h-4" />
            <span>{commentsOff ? 'Turn on comments' : 'Turn off comments'}</span>
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm"
            onClick={() => onOpenChange(false)}
          >
            <Shield className="w-4 h-4" />
            <span>Limit interactions</span>
          </Button>
        </motion.div>

        {/* DIVIDER */}
        <div className="h-px bg-muted/20 my-2" />

        {/* SECTION 5: PROMOTION (Optional) */}
        <motion.div variants={itemVariants}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 py-4 text-sm text-amber-500 hover:text-amber-600 hover:bg-amber-500/5"
            onClick={() => onOpenChange(false)}
          >
            <Zap className="w-4 h-4" />
            <span>Boost post</span>
          </Button>
        </motion.div>
      </motion.div>
    </BottomSheet>
  );
};
