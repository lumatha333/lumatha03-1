import { motion } from 'framer-motion';
import { Globe, Home, Users, Ghost } from 'lucide-react';

interface AudienceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const OPTIONS = [
  { value: 'global', label: 'Global', icon: Globe, desc: 'Everyone can see' },
  { value: 'regional', label: 'Regional', icon: Home, desc: 'Nearby people' },
  { value: 'friends', label: 'Friends', icon: Users, desc: 'Only friends' },
  { value: 'ghost', label: 'Ghost', icon: Ghost, desc: 'Anonymous post' },
];

export default function AudienceSelector({ value, onChange }: AudienceSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#94A3B8' }}>Audience</p>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.93 }}
              onClick={() => onChange(opt.value)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-200"
              style={{
                background: isActive ? '#7C3AED' : '#1e293b',
                border: isActive ? '1px solid #7C3AED' : '1px solid #1f2937',
              }}
            >
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.2)' : '#111827',
                }}
              >
                <Icon className="w-5 h-5 text-white" />
              </motion.div>
              <span className="text-[10px] font-semibold text-white">
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
