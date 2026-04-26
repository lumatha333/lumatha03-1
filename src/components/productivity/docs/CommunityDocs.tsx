import React from 'react';
import { Database } from '@/integrations/supabase/types';
import { DocCard } from './DocCard';
import { Sparkles } from 'lucide-react';

type Document = Database['public']['Tables']['documents']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type DocumentWithProfile = Document & { profiles?: Profile };

interface CommunityDocsProps {
  docs: DocumentWithProfile[];
  onOpenDoc: (doc: DocumentWithProfile) => void;
  onSaveDoc: (docId: string) => void;
  savedDocIds: Set<string>;
  onOpenComments: (docId: string, title: string) => void;
  currentUserId?: string | null;
  onRenameDoc?: (doc: DocumentWithProfile) => void;
  onMoveToFolderDoc?: (doc: DocumentWithProfile) => void;
  onDeleteDoc?: (doc: DocumentWithProfile) => void;
}

export function CommunityDocs({ docs, onOpenDoc, onSaveDoc, savedDocIds, onOpenComments, currentUserId, onRenameDoc, onMoveToFolderDoc, onDeleteDoc }: CommunityDocsProps) {
  return (
    <div className="space-y-6 px-2 sm:px-4 pb-20">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-[#8bb8ff]" />
        <h2 className="text-[#f1f7ff] font-bold text-[18px] font-['Space_Grotesk'] tracking-tight">Explore Documents</h2>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20 bg-gradient-to-b from-[#081425] to-[#07111d] rounded-[32px] border border-dashed border-[#22314a]">
          <p className="text-[#f1f7ff] font-bold text-[18px] font-['Space_Grotesk']">No community docs yet</p>
          <p className="text-[#8fa4c4] text-[14px] mt-1 max-w-[240px] mx-auto leading-relaxed">
            Be the first to share your knowledge with the world!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              isOwner={currentUserId ? doc.user_id === currentUserId : false}
              isSaved={savedDocIds.has(doc.id)}
              onOpen={() => onOpenDoc(doc)}
              onOpenInBrowser={() => window.open(doc.file_url, '_blank')}
              onDownload={() => {
                const a = document.createElement('a');
                a.href = doc.file_url;
                a.download = doc.file_name;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              onRename={currentUserId && doc.user_id === currentUserId ? () => onRenameDoc?.(doc) : undefined}
              onMoveToFolder={currentUserId && doc.user_id === currentUserId ? () => onMoveToFolderDoc?.(doc) : undefined}
              onDelete={currentUserId && doc.user_id === currentUserId ? () => onDeleteDoc?.(doc) : undefined}
              onSave={() => onSaveDoc(doc.id)}
              onOpenComments={() => onOpenComments(doc.id, doc.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
