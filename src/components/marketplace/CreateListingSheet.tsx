import { CreateListingScreen } from './redesign/CreateListingScreen';

interface CreateListingSheetProps {
  editListing?: any | null;
  defaultDetectedLocation?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateListingSheet({ onClose, onSuccess }: CreateListingSheetProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-lg bg-card rounded-t-2xl sm:rounded-2xl border shadow-xl max-h-[90vh] overflow-y-auto">
        <CreateListingScreen
          onSubmit={() => onSuccess()}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
