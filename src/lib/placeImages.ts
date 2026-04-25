// Place Image Utility - Uses Unsplash images (free, high quality)
// Unsplash images are free for commercial use - attribution optional but recommended

export interface PlaceImageData {
  url: string;
  photographer?: string;
  photographerUrl?: string;
  source: 'unsplash' | 'placeholder';
}

// Cache for fetched images to avoid redundant API calls
const imageCache = new Map<string, PlaceImageData>();

// Generate a gradient placeholder based on place name
const getPlaceholderGradient = (placeName: string): string => {
  const firstLetter = placeName.charAt(0).toUpperCase();
  const code = firstLetter.charCodeAt(0);
  
  if (code >= 65 && code <= 70) return 'linear-gradient(135deg, #7C3AED, #3B82F6)'; // A-F purple
  if (code >= 71 && code <= 76) return 'linear-gradient(135deg, #14532d, #166534)'; // G-L green
  if (code >= 77 && code <= 82) return 'linear-gradient(135deg, #7C2D12, #9A3412)'; // M-R orange
  return 'linear-gradient(135deg, #164E63, #0C4A6E)'; // S-Z teal
};

// Get placeholder image data
export const getPlaceholderImage = (placeName: string): PlaceImageData => ({
  url: '',
  source: 'placeholder',
});

export const getPlaceholderStyle = (placeName: string) => ({
  background: getPlaceholderGradient(placeName),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// Fetch image from Unsplash API
export const fetchUnsplashImage = async (
  placeName: string, 
  country: string
): Promise<PlaceImageData | null> => {
  const cacheKey = `${placeName}-${country}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
  
  // If no API key, return null
  if (!accessKey) {
    return null;
  }
  
  try {
    const query = `${placeName} ${country} landmark`;
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`
    );
    
    if (!response.ok) {
      console.warn('Unsplash API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.results && data.results[0]) {
      const result = data.results[0];
      const imageData: PlaceImageData = {
        url: result.urls.regular,
        photographer: result.user.name,
        photographerUrl: result.user.links.html,
        source: 'unsplash',
      };
      
      // Cache the result
      imageCache.set(cacheKey, imageData);
      
      return imageData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Unsplash image:', error);
    return null;
  }
};

// Determine image source from URL
export const getImageSource = (imageUrl: string): 'unsplash' | 'placeholder' => {
  if (!imageUrl) return 'placeholder';
  if (imageUrl.includes('unsplash.com') || imageUrl.includes('images.unsplash.com')) return 'unsplash';
  return 'unsplash'; // Default to unsplash for all images now
};

// Get attribution text based on source
export const getAttributionText = (imageData: PlaceImageData): string => {
  switch (imageData.source) {
    case 'unsplash':
      return imageData.photographer 
        ? `📷 ${imageData.photographer} / Unsplash` 
        : '📷 Unsplash';
    default:
      return '';
  }
};
