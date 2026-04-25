import { MessageCircle, MapPin, Clock, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { TrustBadge } from './TrustBadge';
import { ListingCard, ListingCardProps } from './ListingCard';

interface SellerProfileProps {
  avatar?: string;
  displayName: string;
  badges: Array<'verified' | 'highly-trusted' | 'new-seller' | 'unverified'>;
  stats: {
    listings: number;
    deals: number;
    joined: string;
  };
  location: string;
  responseTime: string;
  paymentMethods: string[];
  listings: ListingCardProps[];
  onMessage?: () => void;
}

export function SellerProfile({
  avatar,
  displayName,
  badges,
  stats,
  location,
  responseTime,
  paymentMethods,
  listings,
}: SellerProfileProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews' | 'saved'>('listings');

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Hero Section */}
      <div
        className="text-center py-6 px-4"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-4xl"
          style={{
            backgroundColor: '#0D1117',
            border: '2px solid #4F8EF7',
          }}
        >
          {avatar || '👤'}
        </div>

        {/* Display Name */}
        <h1
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#E6EDF3',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            marginBottom: '8px',
          }}
        >
          {displayName}
        </h1>

        {/* Trust Badges */}
        <div className="flex justify-center gap-2 flex-wrap mb-4">
          {badges.map((badge, i) => (
            <TrustBadge key={i} type={badge} />
          ))}
        </div>

        {/* Stats Row */}
        <div
          className="grid grid-cols-3 gap-0 my-4"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div className="p-3 border-r" style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#4F8EF7' }}>{stats.listings}</div>
            <div style={{ fontSize: '10px', color: '#7D8590', marginTop: '2px' }}>Listings</div>
          </div>
          <div className="p-3 border-r" style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#34D399' }}>{stats.deals}</div>
            <div style={{ fontSize: '10px', color: '#7D8590', marginTop: '2px' }}>Deals</div>
          </div>
          <div className="p-3">
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F59E0B' }}>{stats.joined}</div>
            <div style={{ fontSize: '10px', color: '#7D8590', marginTop: '2px' }}>Joined</div>
          </div>
        </div>

        {/* Message Button */}
        <button
          className="w-full py-2.5 rounded-lg font-bold transition-all"
          style={{
            backgroundColor: '#7C3AED',
            color: '#FFFFFF',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <MessageCircle className="inline w-4 h-4 mr-2" />
          Message Seller
        </button>
      </div>

      {/* Info Table */}
      <div className="p-4">
        <div
          className="rounded-lg overflow-hidden"
          style={{
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div className="flex items-center p-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}>
            <MapPin className="w-4 h-4 mr-3" style={{ color: '#7D8590' }} />
            <div>
              <div style={{ fontSize: '10px', color: '#7D8590' }}>Location</div>
              <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>{location}</div>
            </div>
          </div>
          <div className="flex items-center p-3 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.07)' }}>
            <Clock className="w-4 h-4 mr-3" style={{ color: '#7D8590' }} />
            <div>
              <div style={{ fontSize: '10px', color: '#7D8590' }}>Response Time</div>
              <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>{responseTime}</div>
            </div>
          </div>
          <div className="flex items-center p-3">
            <CreditCard className="w-4 h-4 mr-3" style={{ color: '#7D8590' }} />
            <div>
              <div style={{ fontSize: '10px', color: '#7D8590' }}>Payment</div>
              <div style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>
                {paymentMethods.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-0 px-4 mt-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
        {(['listings', 'reviews', 'saved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3 text-sm font-semibold border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab ? '#4F8EF7' : 'transparent',
              color: activeTab === tab ? '#4F8EF7' : '#7D8590',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-2">
        {activeTab === 'listings' && (
          <>
            {listings.map((card) => (
              <ListingCard key={card.id} {...card} />
            ))}
          </>
        )}
        {activeTab === 'reviews' && (
          <div style={{ color: '#7D8590', textAlign: 'center', padding: '32px 0' }}>
            No reviews yet
          </div>
        )}
        {activeTab === 'saved' && (
          <div style={{ color: '#7D8590', textAlign: 'center', padding: '32px 0' }}>
            No saved listings
          </div>
        )}
      </div>
    </div>
  );
}

export function SellerProfileDemo() {
  const demoListings: ListingCardProps[] = [
    {
      id: '1',
      emoji: '📱',
      title: 'iPhone 12 Pro - Great Condition',
      price: 45000,
      description: 'Mint condition, all accessories included',
      category: 'Electronics',
      location: 'Kathmandu',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      emoji: '⌚',
      title: 'Apple Watch Series 7',
      price: 28000,
      description: 'Barely used, with charger',
      category: 'Accessories',
      location: 'Kathmandu',
      timeAgo: '1 day ago',
    },
  ];

  return (
    <SellerProfile
      avatar="👨‍💼"
      displayName="Tech Seller Nepal"
      badges={['verified', 'highly-trusted']}
      stats={{ listings: 12, deals: 45, joined: '2 yrs' }}
      location="Kathmandu"
      responseTime="Within 1 hour"
      paymentMethods={['Cash', 'eWallet']}
      listings={demoListings}
    />
  );
}
