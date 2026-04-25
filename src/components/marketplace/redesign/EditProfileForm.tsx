import { Camera, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface EditProfileFormProps {
  onSave?: (data: any) => void;
}

export function EditProfileForm({ onSave }: EditProfileFormProps) {
  const [profileStrength, setProfileStrength] = useState(45);
  const [formData, setFormData] = useState({
    displayName: 'Tech Seller Nepal',
    type: 'individual', // 'individual' | 'business'
    about: 'Premium electronics and gadgets dealer...',
    phone: '+977-1234567890',
    whatsappEnabled: true,
    city: 'Kathmandu',
    meetupSpot: 'Thamel',
    responseTime: 'Within 1 hour',
    paymentMethods: ['💵 Cash', '📱 eWallet'],
    showPhoneTo: 'verified-buyers',
  });

  const [aboutCharCount, setAboutCharCount] = useState(formData.about.length);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'about') {
      setAboutCharCount(value.length);
    }
  };

  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh', paddingBottom: '120px' }}>
      {/* Header with Save Button */}
      <div
        className="flex items-center justify-between p-4"
        style={{
          backgroundColor: '#161B24',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <h1
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#E6EDF3',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          Edit Profile
        </h1>
        <button
          onClick={() => onSave?.(formData)}
          style={{
            backgroundColor: '#4F8EF7',
            color: '#FFFFFF',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Avatar Section */}
        <div
          className="rounded-xl p-4 flex flex-col items-center gap-3"
          style={{
            backgroundColor: '#161B24',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
              style={{
                backgroundColor: '#0D1117',
                border: '2px solid #4F8EF7',
              }}
            >
              👨‍💼
            </div>
            <button
              className="absolute bottom-0 right-0 p-2 rounded-full"
              style={{
                backgroundColor: '#4F8EF7',
                border: '2px solid #161B24',
              }}
            >
              <Camera className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            </button>
          </div>

          {/* Profile Strength */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-2">
              <span style={{ fontSize: '12px', color: '#7D8590', fontWeight: 600 }}>Profile Strength</span>
              <span style={{ fontSize: '12px', color: '#4F8EF7', fontWeight: 700 }}>{profileStrength}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#0D1117',
                borderRadius: '2px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${profileStrength}%`,
                  height: '100%',
                  backgroundColor: '#4F8EF7',
                  transition: 'width 0.3s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Identity Section */}
        <FormSection title="Identity">
          <div className="space-y-3">
            <div>
              <label style={{ fontSize: '12px', color: '#7D8590', display: 'block', marginBottom: '6px' }}>
                Display Name
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0D1117',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-2">
              {['individual', 'business'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleInputChange('type', type)}
                  className="p-3 rounded-lg text-center transition-all"
                  style={{
                    backgroundColor: formData.type === type ? 'rgba(79, 142, 247, 0.15)' : '#0D1117',
                    border: formData.type === type ? '1px solid #4F8EF7' : '1px solid rgba(255, 255, 255, 0.07)',
                    color: formData.type === type ? '#4F8EF7' : '#7D8590',
                    fontSize: '13px',
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  {type === 'individual' ? '👤 Individual' : '🏢 Small Business'}
                </button>
              ))}
            </div>
          </div>
        </FormSection>

        {/* About Section */}
        <FormSection title="About">
          <div>
            <label style={{ fontSize: '12px', color: '#7D8590', display: 'block', marginBottom: '6px' }}>
              Bio
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={formData.about}
                onChange={(e) => handleInputChange('about', e.target.value.slice(0, 180))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0D1117',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '12px',
                  fontSize: '10px',
                  color: '#7D8590',
                }}
              >
                {aboutCharCount}/180
              </span>
            </div>
          </div>
        </FormSection>

        {/* Contact Section */}
        <FormSection title="Contact & Location">
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label style={{ fontSize: '12px', color: '#7D8590', display: 'block', marginBottom: '6px' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0D1117',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '8px',
                    color: '#E6EDF3',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '14px',
                  }}
                />
              </div>
              <div
                className="px-3 py-2 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: '#34D399',
                  color: '#0D1117',
                }}
              >
                ✓ Verified
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white/[0.02]">
              <input type="checkbox" checked={formData.whatsappEnabled} onChange={(e) => handleInputChange('whatsappEnabled', e.target.checked)} />
              <span style={{ fontSize: '14px', color: '#E6EDF3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Also use WhatsApp
              </span>
            </label>

            <div>
              <label style={{ fontSize: '12px', color: '#7D8590', display: 'block', marginBottom: '6px' }}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0D1117',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#7D8590', display: 'block', marginBottom: '6px' }}>
                Meetup Spot
              </label>
              <input
                type="text"
                value={formData.meetupSpot}
                onChange={(e) => handleInputChange('meetupSpot', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0D1117',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '8px',
                  color: '#E6EDF3',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </FormSection>

        {/* Preferences Section */}
        <FormSection title="Preferences">
          <div className="space-y-2">
            {[
              { label: 'Response Time', value: formData.responseTime },
              { label: 'Payment Methods', value: formData.paymentMethods.join(', ') },
              { label: 'Show Phone To', value: 'Verified Buyers' },
            ].map((pref, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                }}
              >
                <span style={{ fontSize: '14px', color: '#E6EDF3', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {pref.label}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '13px', color: '#7D8590' }}>{pref.value}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: '#7D8590' }} />
                </div>
              </button>
            ))}
          </div>
        </FormSection>
      </div>
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: '#161B24',
        border: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          backgroundColor: 'rgba(79, 142, 247, 0.08)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <h3
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#4F8EF7',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function EditProfileFormDemo() {
  return <EditProfileForm />;
}
