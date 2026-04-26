import { useState } from 'react';
import { X } from 'lucide-react';
import { FormInput, FormTextarea, PillSelect, PhotoUpload, LocationField, ToggleField, HeaderCard } from './FormShared';

const LOOKING_FOR = ['⏰ Full Time', '🕐 Part Time', '🏠 Work From Home', '📅 Internship', '🔧 Freelance', 'Any opportunity'];
const EDUCATION = ['SEE/SLC', '+2', 'Bachelor', 'Master', 'PhD', 'Other'];
const EXPERIENCE = ['Fresher', '6 months', '1 year', '2 years', '5+ years'];
const AVAILABLE = ['Immediately', '1 week', '2 weeks', '1 month'];
const CONTACT = ['💬 Message', '📞 Call', '💬 WhatsApp'];

interface Props {
  data: any; onChange: (d: any) => void;
  files: File[]; existingUrls: string[];
  onFilesChange: (f: File[]) => void; onRemoveExisting: (i: number) => void;
  profileName?: string;
}

export function ApplyForm({ data, onChange, files, existingUrls, onFilesChange, onRemoveExisting, profileName }: Props) {
  const set = (key: string, value: any) => onChange({ ...data, [key]: value });
  const toggleArr = (key: string, value: string) => {
    const arr: string[] = data[key] || [];
    set(key, arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value]);
  };
  const [skillInput, setSkillInput] = useState('');
  const skills: string[] = data.skills || [];

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      set('skills', [...skills, s]);
      setSkillInput('');
    }
  };

  return (
    <div className="space-y-3.5">
      <HeaderCard icon="📄" title="Work Profile Post" subtitle="Let employers find you" color="#EC4899" />
      <FormInput label="Your Name" value={data.title || profileName || ''} onChange={v => set('title', v)} placeholder="Your full name" required />
      <FormInput label="Job Title / Role Seeking" value={data.roleSeeking || ''} onChange={v => set('roleSeeking', v)} placeholder="e.g. Graphic Designer, Delivery Rider" required maxLength={60} />
      <PillSelect label="I am looking for" items={LOOKING_FOR} selected={data.lookingFor || []} onToggle={v => toggleArr('lookingFor', v)} accentColor="#EC4899" collapsible />

      {/* Skills input */}
      <div>
        <label className="text-[12px] mb-1 block" style={{ color: '#64748B' }}>Skills *</label>
        <div className="flex gap-1.5">
          <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Type skill & Enter"
            className="flex-1 px-3 py-2.5 rounded-[10px] text-[13px] text-white outline-none"
            style={{ background: '#1e293b', border: '1px solid #374151' }} />
          <button onClick={addSkill} className="px-3 py-2.5 rounded-[10px] text-[12px] font-semibold"
            style={{ background: '#EC489920', color: '#EC4899', border: '1px solid #EC489930' }}>Add</button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[11px]"
                style={{ background: '#EC489915', border: '1px solid #EC489925', color: '#EC4899' }}>
                {s}
                <button onClick={() => set('skills', skills.filter(sk => sk !== s))}><X className="w-2.5 h-2.5" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <PillSelect label="Education" items={EDUCATION} selected={data.education ? [data.education] : []} onToggle={v => set('education', data.education === v ? '' : v)} single accentColor="#EC4899" />
      <PillSelect label="Experience" items={EXPERIENCE} selected={data.experience ? [data.experience] : []} onToggle={v => set('experience', data.experience === v ? '' : v)} single accentColor="#EC4899" />

      <div>
        <label className="text-[12px] mb-1 block" style={{ color: '#64748B' }}>Expected Salary (NPR)</label>
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

      <FormTextarea label="About Me" value={data.description || ''} onChange={v => set('description', v)} placeholder="Tell employers about yourself. Your strengths, work ethic, why you are a good hire..." required minHeight={80} />
      <PhotoUpload files={files} existingUrls={existingUrls} onFilesChange={onFilesChange} onRemoveExisting={onRemoveExisting} maxPhotos={3} coverLabel="Portfolio" />
      <PillSelect label="Available to join" items={AVAILABLE} selected={data.available ? [data.available] : []} onToggle={v => set('available', data.available === v ? '' : v)} single accentColor="#EC4899" />
      <LocationField location={data.location || ''} locationDetected={!!data.location} onLocationDetected={v => set('location', v)} />
      <ToggleField label="Open to relocate" checked={data.relocate || false} onChange={v => set('relocate', v)} />
      <PillSelect label="Contact via" items={CONTACT} selected={data.contactVia || []} onToggle={v => toggleArr('contactVia', v)} accentColor="#EC4899" />
    </div>
  );
}
