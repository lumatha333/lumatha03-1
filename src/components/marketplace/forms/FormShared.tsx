import { useRef, useState, useEffect } from 'react';
import { MapPin, ImagePlus, X, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export function FormInput({ label, value, onChange, placeholder, type = 'text', required, helper, maxLength, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  type?: string; required?: boolean; helper?: string; maxLength?: number; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[12px] mb-1 block text-muted-foreground">
        {label} {required && '*'}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(maxLength ? e.target.value.slice(0, maxLength) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-[10px] text-[14px] text-foreground bg-secondary border border-border outline-none transition-all focus:ring-1 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
      />
      <div className="flex justify-between mt-0.5">
        {helper && <p className="text-[10px] text-muted-foreground/60">{helper}</p>}
        {maxLength && <p className="text-[9px] ml-auto text-muted-foreground/40">{value.length}/{maxLength}</p>}
      </div>
    </div>
  );
}

export function FormTextarea({ label, value, onChange, placeholder, required, maxLength = 500, minHeight = 80, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string;
  required?: boolean; maxLength?: number; minHeight?: number; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[12px] mb-1 block text-muted-foreground">{label} {required && '*'}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder} rows={3}
        className="w-full px-3 py-2.5 rounded-[10px] text-[14px] text-foreground bg-secondary border border-border resize-none outline-none transition-all focus:ring-1 focus:ring-purple-500/50 placeholder:text-muted-foreground/50"
        style={{ minHeight }}
      />
      <p className="text-[9px] text-right mt-0.5 text-muted-foreground/40">{value.length}/{maxLength}</p>
    </div>
  );
}

export function PillSelect({ label, items, selected, onToggle, single, accentColor = '#7C3AED', collapsible = false }: {
  label: string; items: string[]; selected: string[]; onToggle: (v: string) => void; single?: boolean; accentColor?: string; collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  const count = selected.filter(Boolean).length;

  return (
    <div>
      <button
        type="button"
        onClick={collapsible ? () => setOpen(!open) : undefined}
        className={`flex items-center gap-2 w-full ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <label className="text-[12px] block text-muted-foreground">{label}</label>
        {collapsible && count > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${accentColor}20`, color: accentColor }}>{count}</span>
        )}
        {collapsible && (
          <span className="ml-auto text-muted-foreground">
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        )}
      </button>

      {collapsible && !open && count > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.filter(Boolean).map(item => (
            <span key={item} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ background: `${accentColor}15`, color: accentColor, border: `1px solid ${accentColor}25` }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {items.map(item => {
            const isSelected = selected.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all active:scale-95 whitespace-nowrap border ${isSelected ? '' : 'bg-card border-border text-muted-foreground'}`}
                style={isSelected ? { background: `${accentColor}15`, color: accentColor, borderColor: accentColor } : undefined}>
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PriceInput({ label, value, onChange, unit = '', required, className = '' }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string; required?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[12px] mb-1 block text-muted-foreground">{label} {required && '*'}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">NPR</span>
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="w-full pl-12 pr-4 py-2.5 rounded-[10px] text-[18px] font-bold text-foreground bg-secondary border border-border outline-none transition-all focus:ring-1 focus:ring-purple-500/50"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function PhotoUpload({ files, existingUrls, onFilesChange, onRemoveExisting, maxPhotos = 5, coverLabel = 'Cover' }: {
  files: File[]; existingUrls: string[]; onFilesChange: (f: File[]) => void; onRemoveExisting: (i: number) => void; maxPhotos?: number; coverLabel?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <h3 className="text-[13px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Photos</h3>
        <span className="text-[10px] text-muted-foreground">(up to {maxPhotos} • 1st = {coverLabel})</span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {existingUrls.map((url, i) => (
          <div key={i} className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0">
            <img src={url} className="w-full h-full object-cover" />
            <button onClick={() => onRemoveExisting(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
            {i === 0 && <span className="absolute bottom-0 left-0 text-[7px] font-bold text-white px-1 py-0.5 rounded-tr" style={{ background: '#7C3AED' }}>👑</span>}
          </div>
        ))}
        {files.map((f, i) => (
          <div key={`f-${i}`} className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0">
            <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
            <button onClick={() => onFilesChange(files.filter((_, idx) => idx !== i))} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center bg-black/60">
              <X className="w-2.5 h-2.5 text-white" />
            </button>
            {existingUrls.length === 0 && i === 0 && <span className="absolute bottom-0 left-0 text-[7px] font-bold text-white px-1 py-0.5 rounded-tr" style={{ background: '#7C3AED' }}>👑</span>}
          </div>
        ))}
        {existingUrls.length + files.length < maxPhotos && (
          <button onClick={() => ref.current?.click()}
            className="w-14 h-14 rounded-[10px] flex flex-col items-center justify-center gap-0.5 shrink-0 transition-all active:scale-95 border-[1.5px] border-dashed border-border">
            <ImagePlus className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Add</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={e => {
        const newFiles = Array.from(e.target.files || []);
        onFilesChange([...files, ...newFiles].slice(0, maxPhotos - existingUrls.length));
      }} />
    </div>
  );
}

export function LocationField({ location, locationDetected, onLocationDetected }: {
  location: string; locationDetected: boolean; onLocationDetected: (loc: string) => void;
}) {
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (!locationDetected && !location) detect();
  }, []);

  const detect = async () => {
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`, { headers: { 'User-Agent': 'Lumatha/1.0' } });
      const data = await resp.json();
      const parts = [data.address?.city || data.address?.town || data.address?.village, data.address?.state, data.address?.country].filter(Boolean);
      onLocationDetected(parts.join(', '));
    } catch { toast.error('Enable GPS to detect location'); }
    setDetecting(false);
  };

  return (
    <div>
      <label className="text-[12px] mb-1 block text-muted-foreground">Location *</label>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] bg-secondary border border-border">
        <MapPin className={`w-3.5 h-3.5 shrink-0 ${locationDetected ? '' : 'text-muted-foreground'}`} style={locationDetected ? { color: '#10B981' } : undefined} />
        <span className={`text-[13px] flex-1 truncate ${location ? 'text-foreground' : 'text-muted-foreground'}`}>
          {detecting ? 'Detecting...' : location || 'Enable GPS'}
        </span>
        {!locationDetected && (
          <button onClick={detect} className="text-[12px] font-medium shrink-0 active:scale-95" style={{ color: '#A78BFA' }}>
            {detecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Detect'}
          </button>
        )}
        {locationDetected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#10B981' }} />}
      </div>
    </div>
  );
}

export function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function HeaderCard({ icon, title, subtitle, color }: { icon: string; title: string; subtitle: string; color: string }) {
  return (
    <div className="p-3 rounded-[12px] mb-2" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <p className="text-[13px] font-semibold" style={{ color }}>{icon} {title}</p>
      <p className="text-[11px] mt-0.5 text-muted-foreground">{subtitle}</p>
    </div>
  );
}
