const LISTING_TYPES = [
  { id: 'sell', icon: '🛍️', title: 'Sell Something', desc: 'List items for sale', color: '#10B981' },
  { id: 'buy', icon: '🔍', title: 'Looking to Buy', desc: 'Post what you need', color: '#3B82F6' },
  { id: 'rent', icon: '🏠', title: 'Rent Out', desc: 'Room, flat, item', color: '#F59E0B' },
  { id: 'job', icon: '💼', title: 'Post a Job', desc: 'Hire someone', color: '#8B5CF6' },
  { id: 'apply', icon: '📄', title: 'Apply for Work', desc: 'Show your skills', color: '#EC4899' },
  { id: 'service', icon: '🛠️', title: 'Offer a Service', desc: 'Freelance, repair, teach', color: '#14B8A6' },
];

interface Props {
  onSelect: (type: string) => void;
}

export function ListingTypeSelector({ onSelect }: Props) {
  return (
    <div className="px-4 pt-4 pb-6">
      <h2 className="text-[18px] font-bold text-foreground text-center mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        What are you posting?
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {LISTING_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="p-3.5 rounded-[16px] text-left transition-all active:scale-[0.97] bg-card border border-border"
          >
            <span className="text-[28px] block leading-none">{t.icon}</span>
            <p className="text-[14px] font-bold text-foreground mt-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {t.title}
            </p>
            <p className="text-[11px] mt-0.5 leading-tight text-muted-foreground">{t.desc}</p>
            <div className="w-full h-0.5 rounded-full mt-2" style={{ background: `${t.color}30` }}>
              <div className="h-full rounded-full w-1/3" style={{ background: t.color }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { LISTING_TYPES };
