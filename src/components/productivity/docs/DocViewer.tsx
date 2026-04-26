import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Download, MoreVertical, FileText, Presentation, Maximize2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { getFileBadge } from './DocCard';
import { getPreviewHint, getDocumentOpenUrl, openDocumentTarget } from './docTools';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type Document = Database['public']['Tables']['documents']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type DocumentWithProfile = Document & { profiles?: Profile };

interface DocViewerProps {
  doc: DocumentWithProfile;
  onBack: () => void;
  isSaved: boolean;
  onSave: () => void;
  onOpenComments: () => void;
}

export function DocViewer({ doc, onBack, isSaved, onSave, onOpenComments }: DocViewerProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const ext = doc.file_type?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isPresentation = ['ppt', 'pptx'].includes(ext);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Show swipe hint for 5 seconds when entering fullscreen on mobile
  useEffect(() => {
    if (isFullscreen && isMobile && isPresentation) {
      setShowSwipeHint(true);
      const timer = setTimeout(() => setShowSwipeHint(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, isMobile, isPresentation]);

  const enterFullscreen = useCallback(() => {
    setIsFullscreen(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleBack = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      onBack();
    }
  };

  const getViewerUrl = () => {
    if (isImage) return doc.file_url;
    if (isPdf) return `https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`;
    if (['doc', 'docx'].includes(ext)) return getDocumentOpenUrl(doc.file_url, 'word');
    if (['ppt', 'pptx'].includes(ext)) return getDocumentOpenUrl(doc.file_url, 'powerpoint');
    if (['xls', 'xlsx'].includes(ext)) return getDocumentOpenUrl(doc.file_url, 'word');
    return null;
  };

  const viewerUrl = getViewerUrl();
  const badge = getFileBadge(doc.file_type);

  const openInBrowser = () => openDocumentTarget(doc.file_url, 'browser');
  const openInDrive = () => openDocumentTarget(doc.file_url, 'drive');
  const openInPowerPoint = () => openDocumentTarget(doc.file_url, 'powerpoint');

  const handleDownload = async () => {
    try {
      toast.info('Starting download...');
      const response = await fetch(doc.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded!');
    } catch {
      toast.error('Download failed');
    }
  };

  const handlePrintToPdf = () => {
    const printWindow = window.open(getDocumentOpenUrl(doc.file_url, 'browser'), '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      toast.error('Unable to open print view');
      return;
    }
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  };

  // Fullscreen mode for presentations
  if (isFullscreen && isPresentation) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col">
        {/* Fullscreen Top bar - minimal */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-white h-8 w-8 hover:bg-white/10" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-white font-medium text-sm truncate max-w-[200px]">
              {doc.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <span>Slide {currentSlide}</span>
          </div>
        </div>

        {/* Fullscreen Content */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {viewerUrl && !previewFailed ? (
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={doc.title}
              allow="fullscreen"
              onError={() => setPreviewFailed(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className={`w-20 h-20 rounded-2xl ${badge.bg} border ${badge.border} flex items-center justify-center mb-4`}>
                <span className={`font-bold text-xl font-['Space_Grotesk'] ${badge.text}`}>{badge.label}</span>
              </div>
              <p className="text-white font-semibold text-lg">{doc.title}</p>
              <p className="text-gray-400 text-sm mt-2">{getPreviewHint(doc.file_type, doc.file_name)}</p>
            </div>
          )}

          {/* Mobile swipe hint */}
          {showSwipeHint && isMobile && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/90 text-black px-4 py-2 rounded-full text-sm font-medium animate-pulse pointer-events-none">
              Slide with finger left right to turn slide
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#050b16] via-[#081425] to-[#0c1a32] flex flex-col">
      {/* Top bar with horizontal toolbar for presentations */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0a1426]/90 backdrop-blur-xl border-b border-[#1d2b44]">
        <Button variant="ghost" size="icon" className="text-[#dbeafe] h-9 w-9 hover:bg-white/10 shrink-0" onClick={onBack} aria-label="Back to documents">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {/* Title - no file name below */}
        <h2 className="min-w-0 text-[#f1f7ff] font-semibold text-[16px] font-['Space_Grotesk'] truncate flex-1">
          {doc.title}
        </h2>

        {/* Presentation toolbar - horizontal line */}
        {isPresentation && (
          <div className="hidden md:flex items-center gap-2 border-l border-white/10 pl-3">
            {/* PowerPoint icon */}
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Presentation className="w-4 h-4 text-orange-400" />
            </div>
            
            {/* Full view slideshow button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-[#eaf3ff] hover:text-[#8bb8ff] hover:bg-white/5 gap-1"
              onClick={enterFullscreen}
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-xs">Full View</span>
            </Button>

            {/* Three dots dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#eaf3ff] hover:text-[#8bb8ff] hover:bg-white/5">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] bg-[#0b1526] border border-[#22314a] text-[#eaf3ff] rounded-xl p-2 shadow-2xl">
                <DropdownMenuItem onClick={openInPowerPoint} className="rounded-lg py-2 text-sm">
                  <Presentation className="w-4 h-4 mr-2" />Open in PowerPoint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInDrive} className="rounded-lg py-2 text-sm">
                  <FileText className="w-4 h-4 mr-2" />Save to Drive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintToPdf} className="rounded-lg py-2 text-sm">
                  <FileText className="w-4 h-4 mr-2" />Print to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInBrowser} className="rounded-lg py-2 text-sm">
                  <ExternalLink className="w-4 h-4 mr-2" />Open in Browser
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload} className="rounded-lg py-2 text-sm">
                  <Download className="w-4 h-4 mr-2" />Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Non-presentation dropdown */}
        {!isPresentation && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-[#eaf3ff] hover:text-[#8bb8ff] hover:bg-white/5">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] bg-[#0b1526] border border-[#22314a] text-[#eaf3ff] rounded-xl p-2 shadow-2xl">
              <DropdownMenuItem onClick={openInBrowser} className="rounded-lg py-2 text-sm">
                <ExternalLink className="w-4 h-4 mr-2" />Open in Browser
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openInDrive} className="rounded-lg py-2 text-sm">
                <FileText className="w-4 h-4 mr-2" />Save to Drive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintToPdf} className="rounded-lg py-2 text-sm">
                <FileText className="w-4 h-4 mr-2" />Print to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownload} className="rounded-lg py-2 text-sm">
                <Download className="w-4 h-4 mr-2" />Download
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden relative">
        {/* Main Content */}
        {isImage ? (
          <div className="w-full h-full flex items-center justify-center p-4">
            <img src={doc.file_url} alt={doc.title} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" />
          </div>
        ) : viewerUrl && !previewFailed ? (
          <div className="w-full h-full relative bg-[#08101e]">
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={doc.title}
              allow="fullscreen"
              onError={() => setPreviewFailed(true)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-gradient-to-b from-[#081223] to-[#07101a]">
            <div className={`w-20 h-20 rounded-2xl ${badge.bg} border ${badge.border} flex items-center justify-center mb-4 shadow-2xl`}>
              <span className={`font-bold text-xl font-['Space_Grotesk'] ${badge.text}`}>{badge.label}</span>
            </div>
            <p className="text-white font-semibold text-lg">{doc.title}</p>
            <p className="text-[#94A3B8] text-sm mt-2 max-w-md">{getPreviewHint(doc.file_type, doc.file_name)}</p>
          </div>
        )}
      </div>

      {/* Mobile presentation toolbar - shows only on mobile */}
      {isPresentation && isMobile && (
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0a1426]/95 border-t border-[#1d2b44] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Presentation className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Full view button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 px-3 text-[#eaf3ff] hover:text-[#8bb8ff] hover:bg-white/5 gap-1"
              onClick={enterFullscreen}
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-xs">Full View</span>
            </Button>

            {/* Three dots */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-[#eaf3ff] hover:text-[#8bb8ff] hover:bg-white/5">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[180px] bg-[#0b1526] border border-[#22314a] text-[#eaf3ff] rounded-xl p-2 shadow-2xl">
                <DropdownMenuItem onClick={openInPowerPoint} className="rounded-lg py-2 text-sm">
                  <Presentation className="w-4 h-4 mr-2" />Open in PowerPoint
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInDrive} className="rounded-lg py-2 text-sm">
                  <FileText className="w-4 h-4 mr-2" />Save to Drive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrintToPdf} className="rounded-lg py-2 text-sm">
                  <FileText className="w-4 h-4 mr-2" />Print to PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openInBrowser} className="rounded-lg py-2 text-sm">
                  <ExternalLink className="w-4 h-4 mr-2" />Open in Browser
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload} className="rounded-lg py-2 text-sm">
                  <Download className="w-4 h-4 mr-2" />Download
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
}

