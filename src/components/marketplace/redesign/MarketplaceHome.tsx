import { ArrowRight, Zap, TrendingUp, Tag } from 'lucide-react';
import { useState } from 'react';

interface FeaturedCategory {
  id: string;
  name: string;
  emoji: string;
  count: number;
  color: string;
}

interface FeaturedListing {
  id: string;
  emoji: string;
  title: string;
  price: number;
  location: string;
  isFeatured?: boolean;
}

interface MarketplaceHomeProps {
  user?: {
    name: string;
    avatar?: string;
  };
  featuredListings?: FeaturedListing[];
  featuredCategories?: FeaturedCategory[];
  onBrowseAll?: () => void;
  onCategorySell?: () => void;
  onListingClick?: (id: string) => void;
}

export function MarketplaceHome({
  user,
  featuredListings = [],
  featuredCategories = [],
  onBrowseAll,
  onCategorySell,
  onListingClick,
}: MarketplaceHomeProps) {
  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div>
          <p style={{ fontSize: '12px', color: '#7D8590', marginBottom: '4px' }}>Welcome back,</p>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#E6EDF3',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {user?.name || 'Explorer'}
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg">{user?.avatar || '👤'}</div>
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>📦</div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: '4px' }}>Listed</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#4F8EF7' }}>0</p>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>💬</div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: '4px' }}>Messages</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#EC4899' }}>3</p>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '4px' }}>❤️</div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: '4px' }}>Saved</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#F59E0B' }}>7</p>
          </div>
        </div>

        {/* Call to Action - Sell */}
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, #4F8EF7 0%, #2563EB 100%)',
          }}
        >
          <div>
            <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '4px' }}>Have something to sell?</p>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Start a new listing</h3>
          </div>
          <button
            onClick={onCategorySell}
            className="px-3 py-2 rounded-lg font-semibold flex items-center gap-1"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            <ArrowRight className="w-4 h-4" />
            Sell
          </button>
        </div>

        {/* Featured Categories */}
        {featuredCategories.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#E6EDF3',
                marginBottom: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Browse Categories
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {featuredCategories.slice(0, 4).map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-xl p-4 cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3"
                  style={{
                    backgroundColor: '#161B24',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                  }}
                >
                  <div style={{ fontSize: '24px' }}>{cat.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#E6EDF3',
                        marginBottom: '2px',
                      }}
                    >
                      {cat.name}
                    </p>
                    <p style={{ fontSize: '11px', color: '#7D8590' }}>{cat.count} listings</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#E6EDF3',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <TrendingUp className="inline w-4 h-4 mr-2" style={{ color: '#F59E0B' }} />
              Trending Now
            </h2>
            <button
              onClick={onBrowseAll}
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: '#4F8EF7', cursor: 'pointer' }}
            >
              View All
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {featuredListings.slice(0, 3).map((listing) => (
              <div
                key={listing.id}
                onClick={() => onListingClick?.(listing.id)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                style={{
                  backgroundColor: '#161B24',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: '#0D1117' }}>
                  {listing.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#E6EDF3',
                      marginBottom: '2px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {listing.title}
                  </p>
                  <p style={{ fontSize: '11px', color: '#7D8590' }}>{listing.location}</p>
                </div>
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#34D399',
                    flex: '0 0 auto',
                  }}
                >
                  NPR {listing.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Tips Banner */}
        <div
          className="rounded-xl p-4 border-l-4"
          style={{
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderLeftColor: '#F59E0B',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            borderRight: '1px solid rgba(255, 255, 255, 0.07)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#F59E0B',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap className="w-4 h-4" />
            Safety Reminder
          </p>
          <p style={{ fontSize: '12px', color: '#A8B5C2', lineHeight: '1.5' }}>
            Always meet in public places and verify the condition of items before making payments. Report suspicious listings immediately.
          </p>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceHomeDemo() {
  return (
    <MarketplaceHome
      user={{
        name: 'Rajesh',
        avatar: '👨‍💻',
      }}
      featuredCategories={[
        { id: '1', name: 'Electronics', emoji: '📱', count: 342, color: '#4F8EF7' },
        { id: '2', name: 'Fashion', emoji: '👕', count: 521, color: '#EC4899' },
        { id: '3', name: 'Furniture', emoji: '🪑', count: 189, color: '#F59E0B' },
        { id: '4', name: 'Books', emoji: '📚', count: 145, color: '#34D399' },
      ]}
      featuredListings={[
        {
          id: '1',
          emoji: '📱',
          title: 'iPhone 14 Pro Max - Brand New',
          price: 125000,
          location: 'Kathmandu',
        },
        {
          id: '2',
          emoji: '💻',
          title: 'MacBook Pro 16" 2023',
          price: 220000,
          location: 'Pokhara',
        },
        {
          id: '3',
          emoji: '👟',
          title: 'Nike Air Jordan 1 Retro',
          price: 8500,
          location: 'Lalitpur',
        },
      ]}
    />
  );
}
