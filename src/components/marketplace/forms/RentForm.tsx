import { FormInput, FormTextarea, PillSelect, PriceInput, PhotoUpload, LocationField, ToggleField } from './FormShared';

const RENT_TYPES = ['🏠 Room', '🏢 Flat/Apartment', '🏪 Shop', '🏫 Office Space', '🚗 Vehicle', '📷 Camera', '🎵 Equipment', '📦 Other'];
const BEDROOMS = ['1', '2', '3', '4', '4+'];
const BATHROOMS = ['1', '2', '3', '3+'];
const FURNISHED = ['🛋️ Fully Furnished', '🪑 Semi Furnished', '🏚️ Unfurnished'];
const AMENITIES = ['💧 Water 24/7', '⚡ Power Backup', '🅿️ Parking', '🛗 Lift', '🔐 Security', '📶 WiFi Ready', '🍳 Kitchen', '🌤️ Rooftop', '🚿 Attached Bath'];
const MIN_STAY = ['1 month', '3 months', '6 months', '1 year', 'Flexible'];
const TENANT_PREF = ['👨 Male', '👩 Female', '👫 Couple', '👨‍👩‍👧 Family', '🎓 Students', '💼 Professionals', '🤷 Anyone'];
const CONTACT = ['📞 Call', '💬 WhatsApp', '💬 Message'];

interface Props {
  data: any; onChange: (d: any) => void;
  files: File[]; existingUrls: string[];
  onFilesChange: (f: File[]) => void; onRemoveExisting: (i: number) => void;
}

export function RentForm({ data, onChange, files, existingUrls, onFilesChange, onRemoveExisting }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const toggleArr = (key: string, value: string) => {
    const arr: string[] = data[key] || [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };
  const isProperty = ['🏠 Room', '🏢 Flat/Apartment', '🏪 Shop', '🏫 Office Space'].includes(data.rentType || '');

  return (
    <div className="space-y-3.5">
      <PillSelect label="What are you renting?" items={RENT_TYPES} selected={data.rentType ? [data.rentType] : []} onToggle={v => set('rentType', data.rentType === v ? '' : v)} single accentColor="#F59E0B" collapsible />
      <PhotoUpload files={files} existingUrls={existingUrls} onFilesChange={onFilesChange} onRemoveExisting={onRemoveExisting} maxPhotos={6} />
      <FormInput label="Title" value={data.title || ''} onChange={v => set('title', v)} placeholder="e.g. 1BHK Flat for Rent — Milanchowk Butwal" required maxLength={80} />
      <PriceInput label="Monthly Rent" value={data.price || ''} onChange={v => set('price', v)} unit="/month" required />
      <FormInput label="Advance Deposit (NPR)" value={data.deposit || ''} onChange={v => set('deposit', v)} placeholder="0 if none" type="number" />

      {isProperty && (
        <>
          <PillSelect label="Bedrooms" items={BEDROOMS} selected={data.bedrooms ? [data.bedrooms] : []} onToggle={v => set('bedrooms', data.bedrooms === v ? '' : v)} single accentColor="#F59E0B" />
          <PillSelect label="Bathrooms" items={BATHROOMS} selected={data.bathrooms ? [data.bathrooms] : []} onToggle={v => set('bathrooms', data.bathrooms === v ? '' : v)} single accentColor="#F59E0B" />
          <FormInput label="Floor" value={data.floor || ''} onChange={v => set('floor', v)} placeholder="e.g. 2nd" />
          <PillSelect label="Furnished Status" items={FURNISHED} selected={data.furnished ? [data.furnished] : []} onToggle={v => set('furnished', data.furnished === v ? '' : v)} single accentColor="#F59E0B" />
          <PillSelect label="Amenities" items={AMENITIES} selected={data.amenities || []} onToggle={v => toggleArr('amenities', v)} accentColor="#F59E0B" collapsible />
        </>
      )}

      <FormTextarea label="Description" value={data.description || ''} onChange={v => set('description', v)} placeholder="Describe the property/item..." maxLength={500} />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
      <ToggleField label="Available immediately" checked={data.immediate || false} onChange={v => set('immediate', v)} />
      <PillSelect label="Minimum stay" items={MIN_STAY} selected={data.minStay ? [data.minStay] : []} onToggle={v => set('minStay', data.minStay === v ? '' : v)} single accentColor="#F59E0B" collapsible />
      <PillSelect label="Preferred tenant" items={TENANT_PREF} selected={data.tenantPref || []} onToggle={v => toggleArr('tenantPref', v)} accentColor="#F59E0B" collapsible />
      <PillSelect label="Contact preference" items={CONTACT} selected={data.contactPref || []} onToggle={v => toggleArr('contactPref', v)} accentColor="#F59E0B" />
    </div>
  );
}
