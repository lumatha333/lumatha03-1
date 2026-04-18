import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Place } from '@/data/adventurePlaces';
import { Button } from '@/components/ui/button';
import { ExternalLink, Heart, Footprints } from 'lucide-react';

// Fix default marker icons for leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const visitedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const lovedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Country coordinates for map centering
const COUNTRY_COORDS: Record<string, [number, number]> = {
  'Nepal': [28.3949, 84.1240],
  'India': [20.5937, 78.9629],
  'Japan': [36.2048, 138.2529],
  'China': [35.8617, 104.1954],
  'Thailand': [15.8700, 100.9925],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Spain': [40.4637, -3.7492],
  'United Kingdom': [55.3781, -3.4360],
  'USA': [37.0902, -95.7129],
  'Peru': [-9.1900, -75.0152],
  'Egypt': [26.8206, 30.8025],
  'Morocco': [31.7917, -7.0926],
  'South Africa': [-30.5595, 22.9375],
  'Australia': [-25.2744, 133.7751],
  'New Zealand': [-40.9006, 174.8860],
  'Brazil': [-14.2350, -51.9253],
  'Argentina': [-38.4161, -63.6167],
  'Mexico': [23.6345, -102.5528],
  'Canada': [56.1304, -106.3468],
  'Germany': [51.1657, 10.4515],
  'Greece': [39.0742, 21.8243],
  'Turkey': [38.9637, 35.2433],
  'Indonesia': [-0.7893, 113.9213],
  'Vietnam': [14.0583, 108.2772],
};

interface DiscoverMapViewProps {
  places: Place[];
  visitedPlaces: Set<string>;
  lovedPlaces: Set<string>;
  onToggleVisit: (id: string) => void;
  onToggleLove: (id: string) => void;
  onOpenPlace: (place: Place) => void;
}

// Component to handle map updates
function MapController({ places, visitedPlaces }: { places: Place[]; visitedPlaces: Set<string> }) {
  const map = useMap();
  
  useEffect(() => {
    const visitedPlacesList = places.filter(p => visitedPlaces.has(p.id));
    if (visitedPlacesList.length > 0) {
      const coordsArray: [number, number][] = visitedPlacesList
        .map(p => COUNTRY_COORDS[p.country])
        .filter((c): c is [number, number] => c !== undefined);
      
      if (coordsArray.length > 0) {
        const bounds = L.latLngBounds(coordsArray);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [places, visitedPlaces, map]);
  
  return null;
}

export function DiscoverMapView({
  places,
  visitedPlaces,
  lovedPlaces,
  onToggleVisit,
  onToggleLove,
  onOpenPlace
}: DiscoverMapViewProps) {
  // Get approximate coordinates for places based on country
  const getPlaceCoords = (place: Place): [number, number] => {
    const baseCoords = COUNTRY_COORDS[place.country] || [20, 0];
    const hash = place.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const latOffset = ((hash % 100) - 50) / 50 * 3;
    const lngOffset = (((hash * 7) % 100) - 50) / 50 * 3;
    return [baseCoords[0] + latOffset, baseCoords[1] + lngOffset];
  };

  // Filter to only show visited or loved places + a sample of others
  const displayPlaces = places.filter(p => 
    visitedPlaces.has(p.id) || 
    lovedPlaces.has(p.id) ||
    places.indexOf(p) < 50
  );

  return (
    <div className="relative h-[400px] md:h-[500px] rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController places={displayPlaces} visitedPlaces={visitedPlaces} />
        
        {displayPlaces.map(place => {
          const isVisited = visitedPlaces.has(place.id);
          const isLoved = lovedPlaces.has(place.id);
          const coords = getPlaceCoords(place);
          
          return (
            <Marker
              key={place.id}
              position={coords}
              icon={isVisited ? visitedIcon : isLoved ? lovedIcon : defaultIcon}
            >
              <Popup className="adventure-popup">
                <div className="min-w-[200px]">
                  <img 
                    src={place.image} 
                    alt={place.name}
                    className="w-full h-24 object-cover rounded-t-lg -mt-3 -mx-3 mb-2"
                    style={{ width: 'calc(100% + 24px)' }}
                  />
                  <h3 className="font-semibold text-sm">{place.name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <span>{place.countryFlag}</span>
                    {place.country}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⭐ {place.stars.toFixed(2)}
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant={isVisited ? "default" : "outline"}
                      className="h-7 text-xs flex-1"
                      onClick={() => onToggleVisit(place.id)}
                    >
                      <Footprints className="w-3 h-3 mr-1" />
                      {isVisited ? 'Visited' : 'Visit'}
                    </Button>
                    <Button
                      size="sm"
                      variant={isLoved ? "default" : "outline"}
                      className={`h-7 text-xs ${isLoved ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                      onClick={() => onToggleLove(place.id)}
                    >
                      <Heart className={`w-3 h-3 ${isLoved ? 'fill-current' : ''}`} />
                    </Button>
                    <a 
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-input bg-background hover:bg-accent"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 glass-card p-2 rounded-lg text-xs z-[1000]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Visited ({visitedPlaces.size})</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span>Loved ({lovedPlaces.size})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary/50" />
          <span>To Explore</span>
        </div>
      </div>
    </div>
  );
}
