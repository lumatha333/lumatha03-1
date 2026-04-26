export const MP_STORAGE_KEY = 'lumatha_mp_seller';

export interface SellerProfile {
  displayName: string;
  sellerType: 'individual' | 'business';
  bio: string;
  qualification: string;
  phone: string;
  whatsappSame: boolean;
  whatsapp: string;
  location: string;
  area: string;
  paymentMethods: string[];
  responseTime: string;
  availability: string[];
  sellingCategories: string[];
  showPhoneTo: string;
  allowReviews: boolean;
  isPhoneVerified: boolean;
}

export const DEFAULT_SELLER: SellerProfile = {
  displayName: '',
  sellerType: 'individual',
  bio: '',
  qualification: '',
  phone: '',
  whatsappSame: true,
  whatsapp: '',
  location: '',
  area: '',
  paymentMethods: ['💵 Cash'],
  responseTime: 'few_hours',
  availability: [],
  sellingCategories: [],
  showPhoneTo: 'Everyone',
  allowReviews: true,
  isPhoneVerified: false,
};

export function loadSellerProfile(userId: string): SellerProfile {
  try {
    const raw = localStorage.getItem(`${MP_STORAGE_KEY}_${userId}`);
    if (!raw) return { ...DEFAULT_SELLER };
    return { ...DEFAULT_SELLER, ...JSON.parse(raw) };
  } catch { return { ...DEFAULT_SELLER }; }
}

export function saveSellerProfile(userId: string, data: SellerProfile) {
  localStorage.setItem(`${MP_STORAGE_KEY}_${userId}`, JSON.stringify(data));
}

export interface TrustResult {
  score: number;
  badges: { icon: string; label: string; color: string }[];
  trustLabel: string;
  trustColor: string;
}

export function getTrustScore(seller: SellerProfile, avatarUrl?: string | null): TrustResult {
  let score = 0;
  const badges: TrustResult['badges'] = [];

  if (seller.isPhoneVerified) {
    score += 30;
    badges.push({ icon: '✅', label: 'Verified', color: '#10B981' });
  }

  if (seller.location) {
    score += 20;
    badges.push({ icon: '📍', label: seller.location.split(',')[0].trim(), color: '#3B82F6' });
  }

  if (avatarUrl) score += 10;
  if (seller.bio) score += 10;
  if (seller.phone) score += 15;
  if (seller.whatsapp || (seller.whatsappSame && seller.phone)) score += 15;

  let trustLabel: string;
  let trustColor: string;

  if (score >= 80) { trustLabel = '⭐ Highly Trusted'; trustColor = '#10B981'; }
  else if (score >= 50) { trustLabel = '👍 Trustworthy'; trustColor = '#F59E0B'; }
  else if (score >= 30) { trustLabel = '📋 Basic Profile'; trustColor = '#94A3B8'; }
  else { trustLabel = '⚠️ Incomplete'; trustColor = '#EF4444'; }

  return { score, badges, trustLabel, trustColor };
}

export function getCompletionTip(seller: SellerProfile): string | null {
  if (!seller.phone) return 'Add phone number to reach 45%';
  if (!seller.isPhoneVerified) return 'Verify your phone to reach 75%';
  if (!seller.bio) return 'Add a bio to boost trust';
  if (!(seller.whatsapp || (seller.whatsappSame && seller.phone))) return 'Add WhatsApp to reach 80%';
  if (!seller.location) return 'Add location for more visibility';
  return null;
}

export const NEPAL_DISTRICTS = [
  'Achham', 'Arghakhanchi', 'Baglung', 'Baitadi', 'Bajhang', 'Bajura', 'Banke', 'Bara', 'Bardiya',
  'Bhaktapur', 'Bhojpur', 'Chitwan', 'Dadeldhura', 'Dailekh', 'Dang', 'Darchula', 'Dhading',
  'Dhankuta', 'Dhanusa', 'Dolakha', 'Dolpa', 'Doti', 'Gorkha', 'Gulmi', 'Humla', 'Ilam',
  'Jajarkot', 'Jhapa', 'Jumla', 'Kailali', 'Kalikot', 'Kanchanpur', 'Kapilvastu', 'Kaski',
  'Kathmandu', 'Kavrepalanchok', 'Khotang', 'Lalitpur', 'Lamjung', 'Mahottari', 'Makwanpur',
  'Manang', 'Morang', 'Mugu', 'Mustang', 'Myagdi', 'Nawalparasi East', 'Nawalparasi West',
  'Nuwakot', 'Okhaldhunga', 'Palpa', 'Panchthar', 'Parbat', 'Parsa', 'Pyuthan', 'Ramechhap',
  'Rasuwa', 'Rautahat', 'Rolpa', 'Rukum East', 'Rukum West', 'Rupandehi', 'Salyan', 'Sankhuwasabha',
  'Saptari', 'Sarlahi', 'Sindhuli', 'Sindhupalchok', 'Siraha', 'Solukhumbu', 'Sunsari', 'Surkhet',
  'Syangja', 'Tanahu', 'Taplejung', 'Terhathum', 'Udayapur',
].sort();

export const SELLING_CATEGORIES = [
  '📱 Electronics', '👕 Clothes', '📚 Books & Notes', '🍕 Food & Snacks',
  '🎮 Gaming', '🎵 Music & Art', '🛠️ Services', '💄 Beauty',
  '🌿 Plants', '🚲 Vehicles', '🏠 Property', '📦 Other',
];

export const PAYMENT_OPTIONS = [
  '💵 Cash', '📱 eSewa', '📱 Khalti', '🏦 Bank Transfer', '📦 COD',
];

export const RESPONSE_TIMES = [
  { id: '1h', label: '⚡ 1 hour' },
  { id: 'few_hours', label: '🕐 Few hours' },
  { id: 'same_day', label: '📅 Same day' },
  { id: '1_2_days', label: '🗓️ 1-2 days' },
];

export const AVAILABILITY_OPTIONS = [
  { id: 'morning', label: '🌅 Morning' },
  { id: 'afternoon', label: '☀️ Afternoon' },
  { id: 'evening', label: '🌆 Evening' },
  { id: 'weekends', label: '📅 Weekends' },
];
