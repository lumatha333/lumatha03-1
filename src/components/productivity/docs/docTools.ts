import { encodeFileUrl } from '@/lib/utils';

export type DocumentOpenTarget = 'browser' | 'drive' | 'word' | 'powerpoint' | 'wps';

export const OFFICE_EXTENSIONS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];
export const PRESENTATION_EXTENSIONS = ['ppt', 'pptx', 'pdf'];

export const getFileExtension = (fileType?: string | null, fileName?: string) => {
  const fromType = fileType?.toLowerCase().trim();
  if (fromType) return fromType.replace(/^[.]/, '');
  const match = fileName?.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match?.[1] || '';
};

export const isOfficeDocument = (fileType?: string | null, fileName?: string) =>
  OFFICE_EXTENSIONS.includes(getFileExtension(fileType, fileName));

export const isPresentationDocument = (fileType?: string | null, fileName?: string) =>
  PRESENTATION_EXTENSIONS.includes(getFileExtension(fileType, fileName));

export const getPreviewHint = (fileType?: string | null, fileName?: string) => {
  if (isPresentationDocument(fileType, fileName)) {
    return 'Could not preview this presentation in the browser. Try opening it in PowerPoint, Drive, WPS, or download it.';
  }

  if (isOfficeDocument(fileType, fileName)) {
    return 'Could not preview this document in the browser. Try opening it in Word, Drive, WPS, or download it.';
  }

  return 'Preview not available for this file type. Try opening it in Drive, WPS, or download it.';
};

export const getDocumentOpenUrl = (fileUrl: string, target: DocumentOpenTarget) => {
  const encodedUrl = encodeURIComponent(encodeFileUrl(fileUrl));

  switch (target) {
    case 'drive':
      return `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodedUrl}`;
    case 'word':
    case 'powerpoint':
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`;
    case 'wps':
      return 'https://www.wps.com/';
    case 'browser':
    default:
      return encodeFileUrl(fileUrl);
  }
};

export const openDocumentTarget = (
  fileUrl: string,
  target: DocumentOpenTarget,
  windowFeatures = 'noopener,noreferrer'
) => {
  window.open(getDocumentOpenUrl(fileUrl, target), '_blank', windowFeatures);
};
