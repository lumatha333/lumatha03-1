import { ChevronRight, Camera, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface ListingFormData {
  title: string;
  description: string;
  price: string;
  category: string;
  location: string;
  paymentMethod: string;
  condition: string;
  images: string[];
}

interface CreateListingScreenProps {
  onSubmit?: (data: ListingFormData) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  { id: 'buy-sell', label: 'Buy & Sell' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'fashion', label: 'Fashion' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'books', label: 'Books & Media' },
  { id: 'services', label: 'Services' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'other', label: 'Other' },
];

const CONDITIONS = ['Brand New', 'Like New', 'Used - Good', 'Used - Fair', 'For Parts'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'eWallet', 'Payment on Delivery'];
const LOCATIONS = ['Kathmandu', 'Pokhara', 'Lalitpur', 'Bhaktapur', 'Biratnagar', 'Butwal'];

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: '#E6EDF3',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CreateListingScreen({ onSubmit, onCancel }: CreateListingScreenProps) {
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    description: '',
    price: '',
    category: 'buy-sell',
    location: 'Kathmandu',
    paymentMethod: 'Cash',
    condition: 'Like New',
    images: [],
  });

  const [selectedEmoji, setSelectedEmoji] = useState('📦');

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.price) {
      alert('Please fill in title and price');
      return;
    }
    onSubmit?.(formData);
  };

  const handleChange = (field: keyof ListingFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '100px' }}>
      {/* Header */}
      <div
        className="sticky top-0 p-4 flex items-center justify-between z-10"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <h1 style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3' }}>Create Listing</h1>
        <button
          onClick={onCancel}
          style={{ color: '#7D8590', fontSize: '14px', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Photo Upload */}
        <FormSection title="📸 Photos">
          <div
            className="w-full aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: '#161B24',
              border: '2px dashed rgba(79, 142, 247, 0.3)',
            }}
          >
            <Camera className="w-8 h-8" style={{ color: '#4F8EF7', marginBottom: '8px' }} />
            <p style={{ fontSize: '12px', color: '#4F8EF7', fontWeight: 600 }}>Tap to add photos</p>
          </div>
        </FormSection>

        {/* Emoji Selector */}
        <FormSection title="😊 Choose an Emoji">
          <div className="grid grid-cols-6 gap-2">
            {['📱', '💻', '👕', '📚', '🪑', '🎧', '👟', '🪲', '🎮', '⌚', '📷', '🎸'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => setSelectedEmoji(emoji)}
                className="aspect-square rounded-lg py-2 text-2xl hover:scale-110 transition-transform"
                style={{
                  backgroundColor: selectedEmoji === emoji ? '#4F8EF7' : '#161B24',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </FormSection>

        {/* Title */}
        <FormSection title="Title">
          <input
            type="text"
            placeholder="e.g. iPhone 12 Pro - Mint Condition"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            maxLength={60}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              color: '#E6EDF3',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
            }}
          />
          <p style={{ fontSize: '11px', color: '#7D8590' }}>
            {formData.title.length}/60
          </p>
        </FormSection>

        {/* Description */}
        <FormSection title="Description">
          <textarea
            placeholder="Describe your item in detail..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            maxLength={500}
            rows={4}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              color: '#E6EDF3',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              outline: 'none',
              resize: 'none',
            }}
          />
          <p style={{ fontSize: '11px', color: '#7D8590' }}>
            {formData.description.length}/500
          </p>
        </FormSection>

        {/* Price */}
        <FormSection title="💵 Price (NPR)">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <span style={{ color: '#34D399', fontSize: '14px', fontWeight: 600 }}>NPR</span>
            <input
              type="number"
              placeholder="0"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E6EDF3',
                fontSize: '14px',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>
        </FormSection>

        {/* Category */}
        <FormSection title="Category">
          <select
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              color: '#E6EDF3',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </FormSection>

        {/* Condition */}
        <FormSection title="Condition">
          <select
            value={formData.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              color: '#E6EDF3',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {CONDITIONS.map((cond) => (
              <option key={cond} value={cond}>
                {cond}
              </option>
            ))}
          </select>
        </FormSection>

        {/* Location */}
        <FormSection title="📍 Location">
          <select
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: '#161B24',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '12px',
              color: '#E6EDF3',
              fontSize: '13px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </FormSection>

        {/* Payment Method */}
        <FormSection title="Payment Methods">
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                style={{
                  backgroundColor: '#161B24',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <input
                  type="radio"
                  checked={formData.paymentMethod === method}
                  onChange={() => handleChange('paymentMethod', method)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', color: '#E6EDF3' }}>{method}</span>
              </label>
            ))}
          </div>
        </FormSection>

        {/* Terms */}
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'rgba(79, 142, 247, 0.1)',
            border: '1px solid rgba(79, 142, 247, 0.2)',
          }}
        >
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" style={{ marginTop: '2px' }} />
            <span style={{ fontSize: '12px', color: '#A8B5C2' }}>
              I agree to the Lumatha Marketplace Terms & Conditions
            </span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 flex gap-2"
        style={{
          backgroundColor: '#0D1117',
          borderTop: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-lg font-semibold"
          style={{
            backgroundColor: '#161B24',
            color: '#E6EDF3',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 py-3 rounded-lg font-semibold"
          style={{
            backgroundColor: '#4F8EF7',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Publish
        </button>
      </div>
    </div>
  );
}

export function CreateListingScreenDemo() {
  return (
    <CreateListingScreen
      onSubmit={(data) => console.log('Listing submitted:', data)}
      onCancel={() => alert('Create cancelled')}
    />
  );
}
