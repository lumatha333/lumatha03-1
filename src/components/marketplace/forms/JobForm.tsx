import { FormInput, FormTextarea, PillSelect, LocationField, ToggleField, HeaderCard } from './FormShared';

const JOB_TYPES = ['⏰ Full Time', '🕐 Part Time', '📅 Contract', '🏠 Work From Home', '🌙 Night Shift', '📦 Delivery', '🎓 Internship'];
const CATEGORIES = [
  '🛒 Retail', '🍕 Food/Restaurant', '🚗 Driving', '💻 IT/Tech', '📚 Teaching', '💄 Beauty',
  '🏥 Healthcare', '🏗️ Construction', '📞 Customer Service', '💰 Sales/Marketing',
  '🛠️ Technical Repair', '📦 Warehouse', '📷 Media/Creative', '🔐 Security', '📦 Other',
];
const EDUCATION = ['No requirement', 'SLC/SEE', '+2', 'Bachelor', 'Master'];
const EXPERIENCE = ['Fresher OK', '6 months', '1 year', '2+ years', '5+ years'];
const PERKS = ['🍱 Meals included', '🚗 Transport', '🏥 Insurance', '📈 Growth opportunity', '💰 Commission', '🎓 Training provided'];
const APPLY_VIA = ['💬 Message on Lumatha', '📞 Call directly', '📄 Send CV on WhatsApp', '📧 Email CV'];

interface Props {
  data: any; onChange: (d: any) => void;
}

export function JobForm({ data, onChange }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const toggleArr = (key: string, value: string) => {
    const arr: string[] = data[key] || [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };

  return (
    <div className="space-y-3.5">
      <HeaderCard icon="💼" title="Job Posting" subtitle="You are hiring someone" color="#8B5CF6" />
      <FormInput label="Job Title" value={data.title || ''} onChange={v => set('title', v)} placeholder="e.g. Part-time Cashier, Delivery Rider" required maxLength={80} />
      <FormInput label="Company/Business Name" value={data.company || ''} onChange={v => set('company', v)} placeholder="Your shop or company name" />
      <ToggleField label="Individual/Personal hiring" checked={data.personalHiring || false} onChange={v => set('personalHiring', v)} />
      <PillSelect label="Job Type *" items={JOB_TYPES} selected={data.jobType ? [data.jobType] : []} onToggle={v => set('jobType', data.jobType === v ? '' : v)} single accentColor="#8B5CF6" collapsible />
      <PillSelect label="Category *" items={CATEGORIES} selected={data.category ? [data.category] : []} onToggle={v => set('category', data.category === v ? '' : v)} single accentColor="#8B5CF6" collapsible />

      <div>
        <label className="text-[12px] mb-1 block" style={{ color: '#64748B' }}>Salary (NPR/month) *</label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#475569' }}>MIN</span>
            <input type="number" value={data.salaryMin || ''} onChange={e => set('salaryMin', e.target.value)}
              className="w-full pl-10 pr-2 py-2.5 rounded-[10px] text-[14px] text-white outline-none"
              style={{ background: '#1e293b', border: '1px solid #374151' }} />
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: '#475569' }}>MAX</span>
            <input type="number" value={data.salaryMax || ''} onChange={e => set('salaryMax', e.target.value)}
              className="w-full pl-10 pr-2 py-2.5 rounded-[10px] text-[14px] text-white outline-none"
              style={{ background: '#1e293b', border: '1px solid #374151' }} />
          </div>
        </div>
        <ToggleField label="🤝 Negotiable" checked={data.negotiable || false} onChange={v => set('negotiable', v)} />
      </div>

      <FormInput label="Vacancies" value={data.vacancies || ''} onChange={v => set('vacancies', v)} placeholder="How many people needed?" type="number" />
      <PillSelect label="Education Required" items={EDUCATION} selected={data.education ? [data.education] : []} onToggle={v => set('education', data.education === v ? '' : v)} single accentColor="#8B5CF6" collapsible />
      <PillSelect label="Experience Required" items={EXPERIENCE} selected={data.experience ? [data.experience] : []} onToggle={v => set('experience', data.experience === v ? '' : v)} single accentColor="#8B5CF6" />
      <FormInput label="Working Hours" value={data.workingHours || ''} onChange={v => set('workingHours', v)} placeholder="e.g. 9am-5pm, 6 days/week" />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
      <ToggleField label="Remote possible" checked={data.remote || false} onChange={v => set('remote', v)} />
      <FormTextarea label="Job Description" value={data.description || ''} onChange={v => set('description', v)} placeholder="Describe the role. Daily tasks, responsibilities, requirements, benefits..." required minHeight={100} maxLength={500} />
      <PillSelect label="Perks" items={PERKS} selected={data.perks || []} onToggle={v => toggleArr('perks', v)} accentColor="#8B5CF6" collapsible />
      <PillSelect label="How to Apply" items={APPLY_VIA} selected={data.applyVia ? [data.applyVia] : []} onToggle={v => set('applyVia', data.applyVia === v ? '' : v)} single accentColor="#8B5CF6" />
    </div>
  );
}
