/**
 * Detect user's city and country using browser geolocation + reverse geocoding.
 * Falls back to IP-based detection.
 */
export interface LocationResult {
  city: string;
  country: string;
  timezone: string;
}

export async function detectLocation(): Promise<LocationResult> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Try browser geolocation first
  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        enableHighAccuracy: false,
      });
    });

    const { latitude, longitude } = position.coords;
    // Use free reverse geocoding
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`,
      { headers: { 'User-Agent': 'Lumatha/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.state || '';
      const country = data.address?.country || '';
      return { city, country, timezone };
    }
  } catch {
    // Geolocation denied or failed, try IP-based
  }

  // Fallback: IP-based detection
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      return {
        city: data.city || '',
        country: data.country_name || '',
        timezone: data.timezone || timezone,
      };
    }
  } catch {
    // All methods failed
  }

  return { city: '', country: '', timezone };
}
