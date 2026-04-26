import { Heart, MessageCircle, Share2, MapPin, ShieldCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ListingDetailProps {
  id: string;
  image?: string;
  emoji?: string;
  title: string;
  price: number;
  description: string;
  category: string;
  location: string;
  seller: {
    name: string;
    avatar?: string;
    verified: boolean;
    rating: number;
    reviews: number;
    deals: number;
  };
  paymentMethods: string[];
  safetyTips: string[];
  onMessage?: () => void;
  onSave?: () => void;
}

export function ListingDetail({
  title,
  price,
  description,
  category,
  location,
  seller,
  emoji,
  paymentMethods,
  safetyTips,
  onMessage,
  onSave,
}: ListingDetailProps) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Image Area */}
      <div
        className="w-full aspect-square flex items-center justify-center text-6xl"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        {emoji || '📦'}
      </div>

      {/* Like/Share Bar */}
      <div className="flex gap-3 p-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
        <button
          onClick={() => setIsSaved(!isSaved)}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: isSaved ? '#EC4899' : '#7D8590',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          <Heart className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
          {isSaved ? 'Saved' : 'Save'}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: '#7D8590',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            color: '#7D8590',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Title and Price */}
        <div>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#E6EDF3',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: '8px',
            }}
          >
            {title}
          </h1>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#34D399',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            NPR {price.toLocaleString()}
          </div>
        </div>

        {/* Seller Card */}
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: '#0D1117', border: '2px solid #4F8EF7' }}
          >
            {seller.avatar || '👨'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#E6EDF3',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {seller.name}
              </h3>
              {seller.verified && <ShieldCheck className="w-4 h-4" style={{ color: '#34D399' }} />}
            </div>
            <div style={{ fontSize: '12px', color: '#7D8590', marginBottom: '4px' }}>
              ⭐ {seller.rating} • {seller.reviews} reviews • {seller.deals} deals
            </div>
            <div style={{ fontSize: '11px', color: '#7D8590' }}>Member for 2 years</div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px' }}>Description</h3>
          <p style={{ fontSize: '13px', color: '#A8B5C2', lineHeight: '1.6' }}>{description}</p>
        </div>

        {/* Details */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div className="flex justify-between">
            <span style={{ fontSize: '12px', color: '#7D8590' }}>Category</span>
            <span style={{ fontSize: '12px', color: '#E6EDF3', fontWeight: 600 }}>{category}</span>
          </div>
          <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.07)' }} />
          <div className="flex justify-between">
            <span style={{ fontSize: '12px', color: '#7D8590' }}>Location</span>
            <span style={{ fontSize: '12px', color: '#E6EDF3', fontWeight: 600 }}>{location}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px' }}>Payment Methods</h3>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: 'rgba(79, 142, 247, 0.1)',
                  color: '#4F8EF7',
                }}
              >
                {method}
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips */}
        <div>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#E6EDF3', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle className="w-4 h-4" style={{ color: '#F59E0B' }} />
            Safety Tips
          </h3>
          <div className="space-y-2">
            {safetyTips.map((tip, i) => (
              <div
                key={i}
                style={{
                  fontSize: '12px',
                  color: '#A8B5C2',
                  paddingLeft: '20px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    color: '#F59E0B',
                  }}
                >
                  •
                </span>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Message Seller CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4"
        style={{
          backgroundColor: '#0D1117',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <button
          onClick={onMessage}
          className="w-full py-3 rounded-lg font-bold"
          style={{
            backgroundColor: '#4F8EF7',
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
    </div>
  );
}

export function ListingDetailDemo() {
  return (
    <ListingDetail
      id="1"
      emoji="📱"
      title="iPhone 12 Pro - Mint Condition"
      price={45000}
      description="Only 3 months old, used sparingly, comes with original box and all accessories. Screen protector and case included. No scratches or damage. All functions working perfectly."
      category="Electronics"
      location="Kathmandu"
      seller={{
        name: 'Tech Seller Nepal',
        avatar: '👨‍💼',
        verified: true,
        rating: 4.8,
        reviews: 127,
        deals: 45,
      }}
      paymentMethods={['💵 Cash', '📱 eWallet', '🏦 Bank Transfer']}
      safetyTips={[
        'Meet in a safe, public location',
        'Check the product before making payment',
        'Use cash on delivery when possible',
        'Never share personal financial information',
      ]}
    />
  );
}
