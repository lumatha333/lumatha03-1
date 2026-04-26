import { Search, Settings, MapPin } from 'lucide-react';
import { useState } from 'react';

interface Listing {
  id: string;
  image?: string;
  emoji?: string;
  title: string;
  price: number;
  location: string;
  category: string;
  timeAgo: string;
}

interface BrowserScreenProps {
  listings?: Listing[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  onSearchChange?: (query: string) => void;
  onListingClick?: (id: string) => void;
  onFilterClick?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All', color: '#4F8EF7' },
  { id: 'buy-sell', label: 'Buy & Sell', color: '#34D399' },
  { id: 'services', label: 'Services', color: '#F59E0B' },
  { id: 'wanted', label: 'Wanted', color: '#EC4899' },
  { id: 'jobs', label: 'Jobs', color: '#A78BFA' },
];

export function BrowserScreen({
  listings = [],
  selectedCategory = 'all',
  onCategoryChange,
  onSearchChange,
  onListingClick,
  onFilterClick,
}: BrowserScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(selectedCategory);

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange?.(e.target.value);
  };

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 p-4 space-y-4"
        style={{
          backgroundColor: '#0D1117',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        {/* Search Bar */}
        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <Search className="w-4 h-4" style={{ color: '#7D8590' }} />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={handleSearch}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E6EDF3',
                fontSize: '13px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>
          <button
            onClick={onFilterClick}
            className="px-3 py-3 rounded-lg"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              cursor: 'pointer',
            }}
          >
            <Settings className="w-4 h-4" style={{ color: '#7D8590' }} />
          </button>
        </div>

        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className="px-4 py-2 rounded-full font-semibold flex-shrink-0 whitespace-nowrap transition-all"
              style={{
                backgroundColor: activeCategory === cat.id ? cat.color : '#161B24',
                color: activeCategory === cat.id ? '#FFFFFF' : '#7D8590',
                border: activeCategory === cat.id ? 'none' : '1px solid rgba(255, 255, 255, 0.07)',
                fontSize: '12px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {listings.length === 0 ? (
          <div
            className="col-span-2 flex flex-col items-center justify-center py-12"
            style={{ color: '#7D8590' }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <p style={{ fontSize: '13px' }}>No listings found</p>
            <p style={{ fontSize: '12px', color: '#4F8EF7' }}>Try adjusting your search or filters</p>
          </div>
        ) : (
          listings.map((listing) => (
            <div
              key={listing.id}
              onClick={() => onListingClick?.(listing.id)}
              className="rounded-xl p-3 cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: '#161B24',
                border: '1px solid rgba(255, 255, 255, 0.07)',
              }}
            >
              {/* Image */}
              <div
                className="w-full aspect-square rounded-lg flex items-center justify-center text-3xl mb-3"
                style={{ backgroundColor: '#0D1117' }}
              >
                {listing.emoji || '📦'}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#E6EDF3',
                  marginBottom: '6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {listing.title}
              </h3>

              {/* Price */}
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#34D399',
                  marginBottom: '6px',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                NPR {listing.price.toLocaleString()}
              </p>

              {/* Info Row */}
              <div className="flex items-center gap-1" style={{ fontSize: '11px', color: '#7D8590' }}>
                <MapPin className="w-3 h-3" />
                <span>{listing.location}</span>
              </div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginTop: '2px' }}>{listing.timeAgo}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function BrowserScreenDemo() {
  const demoListings: Listing[] = [
    {
      id: '1',
      emoji: '📱',
      title: 'iPhone 12 Pro',
      price: 45000,
      location: 'Kathmandu',
      category: 'Electronics',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      emoji: '🎧',
      title: 'Sony Headphones',
      price: 8500,
      location: 'Pokhara',
      category: 'Electronics',
      timeAgo: '5 hours ago',
    },
    {
      id: '3',
      emoji: '👕',
      title: 'Designer T-Shirt',
      price: 1200,
      location: 'Lalitpur',
      category: 'Fashion',
      timeAgo: '1 day ago',
    },
    {
      id: '4',
      emoji: '📚',
      title: 'Programming Books Set',
      price: 2500,
      location: 'Bhaaktapur',
      category: 'Books',
      timeAgo: '2 days ago',
    },
    {
      id: '5',
      emoji: '🪑',
      title: 'Office Chair',
      price: 5000,
      location: 'Kathmandu',
      category: 'Furniture',
      timeAgo: '3 days ago',
    },
    {
      id: '6',
      emoji: '🚴',
      title: 'Mountain Bike',
      price: 12000,
      location: 'Pokhara',
      category: 'Sports',
      timeAgo: '3 days ago',
    },
  ];

  return <BrowserScreen listings={demoListings} />;
}
