import { FormInput, FormTextarea, PillSelect, PriceInput, PhotoUpload, LocationField, ToggleField } from './FormShared';

const CATEGORIES = [
  '📱 Electronics', '💻 Laptops', '👕 Clothing', '👟 Shoes', '📚 Books',
  '🎮 Gaming', '🏠 Furniture', '🚲 Vehicles', '💄 Beauty', '🎵 Instruments', '🍕 Food', '📦 Other',
];
const CONDITIONS = ['🌟 Brand New', '✨ Like New', '👍 Good Used', '🔧 Needs Repair'];
const DELIVERY = ['🤝 Meetup only', '🚚 Delivery available', '📦 Courier possible'];
const PAYMENT = ['💵 Cash', '📱 eSewa', '📱 Khalti', '🏦 Bank Transfer'];

interface Props {
  data: any; onChange: (d: any) => void;
  files: File[]; existingUrls: string[];
  onFilesChange: (f: File[]) => void; onRemoveExisting: (i: number) => void;
}

export function SellForm({ data, onChange, files, existingUrls, onFilesChange, onRemoveExisting }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const toggleArr = (key: string, value: string) => {
    const arr: string[] = data[key] || [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };

  return (
    <div className="space-y-3.5">
      <PhotoUpload files={files} existingUrls={existingUrls} onFilesChange={onFilesChange} onRemoveExisting={onRemoveExisting} maxPhotos={5} />
      <FormInput label="Title" value={data.title || ''} onChange={v => set('title', v)} placeholder="e.g. iPhone 12 64GB Black — excellent condition" required maxLength={80} />
      <PillSelect label="Category *" items={CATEGORIES} selected={data.category ? [data.category] : []} onToggle={v => set('category', data.category === v ? '' : v)} single accentColor="#10B981" collapsible />
      <PillSelect label="Condition *" items={CONDITIONS} selected={data.condition ? [data.condition] : []} onToggle={v => set('condition', data.condition === v ? '' : v)} single accentColor="#10B981" />
      <PriceInput label="Price" value={data.price || ''} onChange={v => set('price', v)} required />
      <ToggleField label="🤝 Price is negotiable" checked={data.negotiable || false} onChange={v => set('negotiable', v)} />
      <FormTextarea label="Description" value={data.description || ''} onChange={v => set('description', v)} placeholder="Describe your item. Age, any defects, why selling, what is included in box..." maxLength={500} />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
      <PillSelect label="Delivery Options" items={DELIVERY} selected={data.delivery || []} onToggle={v => toggleArr('delivery', v)} accentColor="#10B981" collapsible />
      <PillSelect label="Payment Accepted" items={PAYMENT} selected={data.paymentMethods || ['💵 Cash']} onToggle={v => toggleArr('paymentMethods', v)} accentColor="#10B981" collapsible />
    </div>
  );
}
