import { MapPin, Clock, Heart, MessageCircle, Share2 } from 'lucide-react';

export interface ListingCardProps {
  id: string;
  image?: string;
  emoji?: string;
  title: string;
  price: number;
  description: string;
  category: string;
  location: string;
  timeAgo: string;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  onClick?: (id: string) => void;
}

export function ListingCard({
  id,
  image,
  emoji,
  title,
  price,
  description,
  category,
  location,
  timeAgo,
  isSaved = false,
  onSave,
  onClick,
}: ListingCardProps) {
  return (
    <div
      className="p-4 rounded-xl transition-all cursor-pointer hover:bg-white/[0.03]"
      onClick={() => onClick?.(id)}
      style={{
        backgroundColor: 'transparent',
        borderRadius: '12px',
      }}
    >
      <div className="flex gap-3">
        {/* Image/Emoji */}
        <div
          className="rounded-lg flex-shrink-0 flex items-center justify-center text-3xl"
          style={{
            width: '80px',
            height: '80px',
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            minWidth: '80px',
            minHeight: '80px',
          }}
        >
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover rounded-lg" />
          ) : (
            emoji || '📦'
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#E6EDF3',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.(id);
              }}
              className="flex-shrink-0"
            >
              <Heart
                className="w-4 h-4"
                fill={isSaved ? '#EC4899' : 'none'}
                stroke={isSaved ? '#EC4899' : '#4F8EF7'}
              />
            </button>
          </div>

          {/* Price */}
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#34D399',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              marginBottom: '6px',
            }}
          >
            NPR {price.toLocaleString()}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: '12px',
              color: '#7D8590',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '8px',
              lineHeight: '1.4',
            }}
          >
            {description}
          </p>

          {/* Category and Location Row */}
          <div className="flex items-center justify-between gap-2">
            <div
              className="px-2 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(79, 142, 247, 0.1)',
                color: '#4F8EF7',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {category}
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: '#7D8590' }} strokeWidth={2} />
              <span style={{ fontSize: '11px', color: '#7D8590', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {location}
              </span>
            </div>
          </div>

          {/* Time Ago */}
          <div className="flex items-center gap-1 mt-2">
            <Clock className="w-3 h-3" style={{ color: '#7D8590' }} strokeWidth={2} />
            <span style={{ fontSize: '11px', color: '#7D8590', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ListingCardDemo() {
  const demos = [
    {
      id: '1',
      emoji: '📱',
      title: 'iPhone 12 Pro - Great Condition',
      price: 45000,
      description: 'Mint condition, all accessories included, no scratches',
      category: 'Electronics',
      location: 'Kathmandu',
      timeAgo: '2 hours ago',
    },
    {
      id: '2',
      emoji: '🏠',
      title: '2BHK Modern Apartment',
      price: 2500000,
      description: 'Fully furnished, close to main road, great location',
      category: 'Real Estate',
      location: 'Lalitpur',
      timeAgo: '5 hours ago',
    },
  ];

  return (
    <div className="p-4 space-y-2" style={{ backgroundColor: '#0D1117' }}>
      <h2 style={{ color: '#E6EDF3', fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
        Listing Cards
      </h2>
      {demos.map((card) => (
        <ListingCard key={card.id} {...card} />
      ))}
    </div>
  );
}
