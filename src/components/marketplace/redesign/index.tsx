// Marketplace Redesign Components - Full Dark Theme
// All components follow the design specification:
// Base: #0D1117, Cards: #161B24, Primary: #4F8EF7
// Font: Plus Jakarta Sans, Border: 1px solid rgba(255, 255, 255, 0.07)

export { TrustBadge, TrustBadgeDemo } from './TrustBadge';
export { CategoryFilterPills, CategoryFilterPillsDemo } from './CategoryFilterPills';
export { ListingCard, ListingCardDemo } from './ListingCard';
export { BottomNav, BottomNavDemo } from './BottomNav';
export { SellerProfile, SellerProfileDemo } from './SellerProfile';
export { EditProfileForm, EditProfileFormDemo } from './EditProfileForm';
export { ListingDetail, ListingDetailDemo } from './ListingDetail';
export { MessagesScreen, MessagesScreenDemo } from './MessagesScreen';
export { BrowserScreen, BrowserScreenDemo } from './BrowserScreen';
export { MarketplaceHome, MarketplaceHomeDemo } from './MarketplaceHome';
export { CreateListingScreen, CreateListingScreenDemo } from './CreateListingScreen';

// Demo Component - Showcase All Marketplace Features
export function MarketplaceDemo() {
  return (
    <div style={{ backgroundColor: '#0D1117', minHeight: '100vh' }}>
      <h1 style={{ padding: '24px', color: '#E6EDF3', fontSize: '24px', fontWeight: 700 }}>
        Lumatha Marketplace Redesign Demo
      </h1>
      <p style={{ paddingX: '24px', color: '#7D8590', marginBottom: '24px' }}>
        All components are dark-themed and ready for integration. Import any component for use:
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', padding: '24px' }}>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ TrustBadge</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Verified, Highly-Trusted, New Seller, Unverified states</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ CategoryFilterPills</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Scrollable category selector with active states</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ ListingCard</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Individual marketplace listing display</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ BottomNav</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>5-item navigation with elevated Sell button</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ SellerProfile</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Full seller profile with badges, stats, tabs</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ EditProfileForm</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Seller form with sections, profile strength bar</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ ListingDetail</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Full listing detail with description, seller info</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ MessagesScreen</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Chat interface with listing context</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ BrowserScreen</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Browseable listings grid with filters & search</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ MarketplaceHome</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Dashboard with stats, categories, trending</p>
        </div>
        <div style={{ backgroundColor: '#161B24', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <h3 style={{ color: '#E6EDF3', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>✓ CreateListingScreen</h3>
          <p style={{ color: '#7D8590', fontSize: '12px' }}>Form to create new marketplace listings</p>
        </div>
      </div>
    </div>
  );
}
