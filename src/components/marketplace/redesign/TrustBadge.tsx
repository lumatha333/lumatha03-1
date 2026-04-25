import { Check, Star } from 'lucide-react';

type BadgeType = 'verified' | 'highly-trusted' | 'new-seller' | 'unverified';

interface TrustBadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md';
}

export function TrustBadge({ type, size = 'sm' }: TrustBadgeProps) {
  const styles = {
    verified: {
      bg: 'rgba(52, 211, 153, 0.12)',
      text: '#34D399',
      label: 'Verified',
      icon: Check,
    },
    'highly-trusted': {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: '#F59E0B',
      label: 'Highly Trusted',
      icon: Star,
    },
    'new-seller': {
      bg: 'rgba(79, 142, 247, 0.12)',
      text: '#4F8EF7',
      label: 'New Seller',
      icon: null,
    },
    unverified: {
      bg: 'rgba(100, 116, 139, 0.12)',
      text: '#94A3B8',
      label: 'Unverified',
      icon: null,
    },
  };

  const style = styles[type];
  const IconComponent = style.icon;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full"
      style={{
        padding: '3px 8px',
        backgroundColor: style.bg,
        color: style.text,
        fontSize: size === 'sm' ? '10px' : '12px',
        fontWeight: 700,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {IconComponent && <IconComponent className="w-3 h-3" strokeWidth={2.5} />}
      {style.label}
    </div>
  );
}

export function TrustBadgeDemo() {
  return (
    <div className="flex flex-col gap-6 p-6" style={{ backgroundColor: '#0D1117' }}>
      <h2 style={{ color: '#E6EDF3', fontSize: '16px', fontWeight: 700 }}>Trust Badges</h2>
      <div className="flex flex-wrap gap-3">
        <TrustBadge type="verified" />
        <TrustBadge type="highly-trusted" />
        <TrustBadge type="new-seller" />
        <TrustBadge type="unverified" />
      </div>
    </div>
  );
}
