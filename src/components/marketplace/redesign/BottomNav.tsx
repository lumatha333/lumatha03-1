import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { useState } from 'react';

type NavItem = 'home' | 'browse' | 'sell' | 'messages' | 'profile';

interface BottomNavProps {
  active?: NavItem;
  onNavigate?: (item: NavItem) => void;
}

const navItems: Array<{ id: NavItem; icon: any; label: string; isCenter?: boolean }> = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'browse', icon: Search, label: 'Browse' },
  { id: 'sell', icon: Plus, label: 'Sell', isCenter: true },
  { id: 'messages', icon: MessageCircle, label: 'Messages' },
  { id: 'profile', icon: User, label: 'Profile' },
];

export function BottomNav({ active = 'home', onNavigate }: BottomNavProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center justify-center"
      style={{
        backgroundColor: '#161B24',
        borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        paddingTop: '8px',
      }}
    >
      <div className="flex items-center justify-around w-full max-w-md px-4 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#4F8EF7',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(79, 142, 247, 0.3)',
                }}
              >
                <Icon className="w-6 h-6" style={{ color: '#FFFFFF', strokeWidth: 2 }} />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className="flex flex-col items-center gap-1"
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Icon
                className="w-6 h-6"
                style={{
                  color: isActive ? '#4F8EF7' : '#7D8590',
                  strokeWidth: 2,
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: isActive ? '#4F8EF7' : '#7D8590',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BottomNavDemo() {
  const [active, setActive] = useState<NavItem>('home');

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '300px', paddingBottom: '100px' }}>
      <div className="p-4" style={{ color: '#E6EDF3' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Bottom Navigation</h2>
        <p style={{ fontSize: '12px', color: '#7D8590' }}>Active: {active}</p>
      </div>
      <BottomNav active={active} onNavigate={setActive} />
    </div>
  );
}
