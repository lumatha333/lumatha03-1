import { FormInput, FormTextarea, PillSelect, LocationField, ToggleField, HeaderCard } from './FormShared';

const CATEGORIES = [
  '📱 Electronics', '💻 Laptops', '👕 Clothing', '👟 Shoes', '📚 Books',
  '🎮 Gaming', '🏠 Furniture', '🚲 Vehicles', '💄 Beauty', '🎵 Instruments', '🍕 Food', '📦 Other',
];
const CONDITIONS = ['New', 'Like New', 'Good', 'Any Condition'];
const URGENCY = ['🔥 Urgent need', '📅 Within a week', '🗓️ No rush'];

interface Props {
  data: any; onChange: (d: any) => void;
}

export function BuyForm({ data, onChange }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const toggleArr = (key: string, value: string) => {
    const arr: string[] = data[key] || [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };

  return (
    <div className="space-y-3.5">
      <HeaderCard icon="🔍" title="Looking to Buy Post" subtitle="Tell sellers what you need and they will contact you" color="#3B82F6" />
      <FormTextarea label="What are you looking for?" value={data.title || ''} onChange={v => set('title', v)} placeholder="e.g. iPhone 11 or 12, any condition, black or white" required minHeight={60} maxLength={200} />
      <PillSelect label="Category *" items={CATEGORIES} selected={data.category ? [data.category] : []} onToggle={v => set('category', data.category === v ? '' : v)} single accentColor="#3B82F6" collapsible />

      <div>
        <label className="text-[12px] mb-1 block" style={{ color: '#64748B' }}>Budget (NPR)</label>
        <ToggleField label="Any budget" checked={data.anyBudget || false} onChange={v => set('anyBudget', v)} />
        {!data.anyBudget && (
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#475569' }}>MIN</span>
              <input type="number" value={data.budgetMin || ''} onChange={e => set('budgetMin', e.target.value)}
                className="w-full pl-10 pr-2 py-2.5 rounded-[10px] text-[14px] text-white outline-none"
                style={{ background: '#1e293b', border: '1px solid #374151' }} />
            </div>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#475569' }}>MAX</span>
              <input type="number" value={data.budgetMax || ''} onChange={e => set('budgetMax', e.target.value)}
                className="w-full pl-10 pr-2 py-2.5 rounded-[10px] text-[14px] text-white outline-none"
                style={{ background: '#1e293b', border: '1px solid #374151' }} />
            </div>
          </div>
        )}
      </div>

      <PillSelect label="Condition preference" items={CONDITIONS} selected={data.conditionPref || []} onToggle={v => toggleArr('conditionPref', v)} accentColor="#3B82F6" />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
      <PillSelect label="Urgency" items={URGENCY} selected={data.urgency ? [data.urgency] : []} onToggle={v => set('urgency', data.urgency === v ? '' : v)} single accentColor="#3B82F6" />
      <FormInput label="Extra notes" value={data.notes || ''} onChange={v => set('notes', v)} placeholder="Any specific requirements..." maxLength={200} />
    </div>
  );
}
