import { FormInput, FormTextarea, PillSelect, PriceInput, PhotoUpload, LocationField, HeaderCard } from './FormShared';

const CATEGORIES = [
  '🎨 Design', '💻 Tech/IT', '📚 Tutoring', '🔧 Repair', '🍳 Cooking', '💆 Beauty/Wellness',
  '📷 Photography', '🎵 Music', '🚗 Transport', '🏗️ Construction', '📱 Social Media',
  '📝 Writing', '💰 Accounting', '🌿 Gardening', '🐾 Pet Care', '📦 Delivery', '📦 Other',
];
const PRICING = ['💵 Fixed Price', '⏰ Per Hour', '📅 Per Day', '🤝 Custom Quote'];
const EXPERIENCE = ['🌱 Beginner', '👍 Intermediate', '⭐ Expert', '🏆 Professional'];
const DELIVERY_TIME = ['Same day', '1-2 days', '3-5 days', '1 week', 'Custom'];
const SERVICE_AREA = ['My location', 'Whole city', 'Online only', 'Anywhere'];

interface Props {
  data: any; onChange: (d: any) => void;
  files: File[]; existingUrls: string[];
  onFilesChange: (f: File[]) => void; onRemoveExisting: (i: number) => void;
}

export function ServiceForm({ data, onChange, files, existingUrls, onFilesChange, onRemoveExisting }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const pricingModel = data.pricingModel || '';
  const unitMap: Record<string, string> = {
    '💵 Fixed Price': '/service',
    '⏰ Per Hour': '/hour',
    '📅 Per Day': '/day',
    '🤝 Custom Quote': '',
  };

  return (
    <div className="space-y-3.5">
      <HeaderCard icon="🛠️" title="Offer Your Service" subtitle="Freelance, repair, teach anything" color="#14B8A6" />
      <PhotoUpload files={files} existingUrls={existingUrls} onFilesChange={onFilesChange} onRemoveExisting={onRemoveExisting} maxPhotos={3} coverLabel="Portfolio" />
      <FormInput label="Service Title" value={data.title || ''} onChange={v => set('title', v)} placeholder="e.g. Logo Design, Phone Repair, Math Tuition" required maxLength={80} />
      <PillSelect label="Service Category *" items={CATEGORIES} selected={data.category ? [data.category] : []} onToggle={v => set('category', data.category === v ? '' : v)} single accentColor="#14B8A6" collapsible />
      <PillSelect label="Pricing Model *" items={PRICING} selected={pricingModel ? [pricingModel] : []} onToggle={v => set('pricingModel', pricingModel === v ? '' : v)} single accentColor="#14B8A6" />
      {pricingModel !== '🤝 Custom Quote' && (
        <PriceInput label="Price" value={data.price || ''} onChange={v => set('price', v)} unit={unitMap[pricingModel] || ''} required />
      )}
      <FormTextarea label="Service Description" value={data.description || ''} onChange={v => set('description', v)} placeholder="Describe exactly what you offer. What is included, your experience, how long it takes..." required minHeight={100} maxLength={500} />
      <PillSelect label="Experience Level" items={EXPERIENCE} selected={data.experienceLevel ? [data.experienceLevel] : []} onToggle={v => set('experienceLevel', data.experienceLevel === v ? '' : v)} single accentColor="#14B8A6" />
      <PillSelect label="Delivery Time" items={DELIVERY_TIME} selected={data.deliveryTime ? [data.deliveryTime] : []} onToggle={v => set('deliveryTime', data.deliveryTime === v ? '' : v)} single accentColor="#14B8A6" />
      <PillSelect label="Service Area" items={SERVICE_AREA} selected={data.serviceArea ? [data.serviceArea] : []} onToggle={v => set('serviceArea', data.serviceArea === v ? '' : v)} single accentColor="#14B8A6" />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
    </div>
  );
}
