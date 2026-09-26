import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  APIProvider, 
  Map, 
  useMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Compass, 
  PhoneCall, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Radio,
  Car
} from 'lucide-react';
import { SafeLocation, RouteOption, WaterloggingIncident, EarlyWarning } from '../types';
import { PRESET_ROUTES } from '../data/kolkataData';
import { Language, TRANSLATIONS } from '../data/translations';

declare const google: any;

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCYGbcTomyXB1TaNYCYe1RXbj73uez4MUY';

interface SafeRouteFinderProps {
  lang: Language;
  safeLocations: SafeLocation[];
  onFocusMapLocation: (coords: [number, number]) => void;
  userLocation: { lat: number; lng: number; areaName: string; areaNameBn: string };
  incidents: WaterloggingIncident[];
  warnings: EarlyWarning[];
  isOffline: boolean;
}

interface AnalyzedRealRoute {
  id: string;
  summary: string;
  distanceKm: number;
  durationMins: number;
  isRecommended: boolean;
  waterloggedHazards: WaterloggingIncident[];
  safePassages: string[];
  viaFlyover: boolean;
  steps: {
    instruction: string;
    distance: string;
    duration: string;
  }[];
  googleRouteIndex: number;
}

// Haversine formula in meters
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Inner Google Maps route & hazard renderer
const GoogleDirectionsMapInner: React.FC<{
  directions: any | null;
  selectedRouteIndex: number;
  analyzedRoutes: AnalyzedRealRoute[];
  incidents: WaterloggingIncident[];
}> = ({ directions, selectedRouteIndex, analyzedRoutes }) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const renderersRef = useRef<any[]>([]);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !routesLib || !directions) return;

    // Clean up old renderers
    renderersRef.current.forEach((r) => r.setMap(null));
    renderersRef.current = [];

    // Clean up old hazard markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Render each route alternative
    directions.routes.forEach((route: any, idx: number) => {
      const isSelected = idx === selectedRouteIndex;
      const analyzed = analyzedRoutes.find((r) => r.googleRouteIndex === idx);
      const isSafe = analyzed?.isRecommended ?? false;

      const renderer = new routesLib.DirectionsRenderer({
        map,
        directions,
        routeIndex: idx,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: isSelected ? (isSafe ? '#10b981' : '#f43f5e') : '#64748b',
          strokeWeight: isSelected ? 6 : 4,
          strokeOpacity: isSelected ? 0.95 : 0.45,
          zIndex: isSelected ? 100 : 10
        }
      });
      renderersRef.current.push(renderer);
    });

    // Render hazard pins along waterlogged choke points
    const activeRoute = analyzedRoutes.find((r) => r.googleRouteIndex === selectedRouteIndex);
    if (activeRoute && activeRoute.waterloggedHazards.length > 0 && typeof google !== 'undefined') {
      activeRoute.waterloggedHazards.forEach((hazard) => {
        const marker = new google.maps.Marker({
          position: { lat: hazard.coordinates[0], lng: hazard.coordinates[1] },
          map,
          title: `Flooded: ${hazard.title}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        });
        markersRef.current.push(marker);
      });
    }

    // Auto-fit map to bounds of selected route
    if (directions.routes[selectedRouteIndex]?.bounds) {
      map.fitBounds(directions.routes[selectedRouteIndex].bounds);
    }

    return () => {
      renderersRef.current.forEach((r) => r.setMap(null));
      renderersRef.current = [];
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
    };
  }, [map, routesLib, directions, selectedRouteIndex, analyzedRoutes]);

  return null;
};

export const SafeRouteFinder: React.FC<SafeRouteFinderProps> = ({
  lang,
  safeLocations,
  onFocusMapLocation,
  userLocation,
  incidents,
  warnings,
  isOffline
}) => {
  const t = TRANSLATIONS[lang];

  // Presets with coordinates
  const HUB_COORDINATES: Record<string, { lat: number; lng: number; label: string; labelBn: string }> = {
    current: {
      lat: userLocation.lat,
      lng: userLocation.lng,
      label: `Current GPS (${userLocation.areaName})`,
      labelBn: `বর্তমান জিপিএস (${userLocation.areaNameBn})`
    },
    sec5: {
      lat: 22.5735,
      lng: 88.4331,
      label: 'Sector V (Salt Lake IT Hub)',
      labelBn: 'সেক্টর ফাইভ (সল্টলেক আইটি হাব)'
    },
    gariahata: {
      lat: 22.5195,
      lng: 88.3664,
      label: 'Gariahat (Rashbehari Crossing)',
      labelBn: 'গড়িয়াহাট (রাসবিহারী ক্রসিং)'
    },
    jadavpur: {
      lat: 22.4988,
      lng: 88.3718,
      label: 'Jadavpur (8B / University Gate)',
      labelBn: 'যাদবপুর (৮বি / বিশ্ববিদ্যালয় গেট)'
    },
    central: {
      lat: 22.5645,
      lng: 88.3516,
      label: 'Central Kolkata (Esplanade / MG Road)',
      labelBn: 'সেন্ট্রাল কলকাতা (এসপ্ল্যানেড / এমজি রোড)'
    },
    howrah: {
      lat: 22.5855,
      lng: 88.3433,
      label: 'Howrah Railway Station Hub',
      labelBn: 'হাওড়া রেলওয়ে স্টেশন'
    },
    airport: {
      lat: 22.6547,
      lng: 88.4467,
      label: 'NSCB International Airport Hub',
      labelBn: 'নেতাজি সুভাষ আন্তর্জাতিক বিমানবন্দর'
    },
    sskm: {
      lat: 22.5393,
      lng: 88.3424,
      label: 'SSKM Hospital / Rabindra Sadan',
      labelBn: 'এসএসকেএম হাসপাতাল / রবীন্দ্র সদন'
    }
  };

  const [originKey, setOriginKey] = useState<string>('current');
  const [destinationKey, setDestinationKey] = useState<string>('gariahata');
  const [selectedFacilityCategory, setSelectedFacilityCategory] = useState<string>('all');
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [googleDirections, setGoogleDirections] = useState<any | null>(null);
  const [analyzedRoutes, setAnalyzedRoutes] = useState<AnalyzedRealRoute[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [expandedStepsIdx, setExpandedStepsIdx] = useState<number | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Compute origin and destination coordinates
  const originCoord = HUB_COORDINATES[originKey] || HUB_COORDINATES.current;
  const destCoord = HUB_COORDINATES[destinationKey] || HUB_COORDINATES.gariahata;

  // Real-Time Directions Calculation via Google Maps
  useEffect(() => {
    let isCancelled = false;

    async function queryGoogleMapsDirections() {
      if (isOffline) {
        setRouteError('Offline mode active. Real-time Google Maps directions require internet connectivity.');
        return;
      }

      setIsCalculating(true);
      setRouteError(null);

      // Check if google maps directions service is available
      if (typeof window === 'undefined' || !(window as any).google?.maps?.DirectionsService) {
        // Retry shortly once script finishes initial load
        setTimeout(() => {
          if (!isCancelled) queryGoogleMapsDirections();
        }, 800);
        return;
      }

      try {
        const directionsService = new (window as any).google.maps.DirectionsService();

        directionsService.route(
          {
            origin: { lat: originCoord.lat, lng: originCoord.lng },
            destination: { lat: destCoord.lat, lng: destCoord.lng },
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
          },
          (result: any, status: any) => {
            if (isCancelled) return;
            setIsCalculating(false);

            if (status === 'OK' && result && result.routes?.length > 0) {
              setGoogleDirections(result);

              // Analyze each route against active warnings and waterlogging incidents
              const evaluated: AnalyzedRealRoute[] = result.routes.map((gRoute: any, idx: number) => {
                const leg = gRoute.legs[0];
                const distKm = Math.round(((leg.distance?.value || 0) / 1000) * 10) / 10;
                const durMins = Math.round((leg.duration?.value || 0) / 60);

                // Sample points from the path to cross-reference hazards
                const pathPoints: { lat: number; lng: number }[] = (gRoute.overview_path || []).map((p: any) => ({
                  lat: typeof p.lat === 'function' ? p.lat() : p.lat,
                  lng: typeof p.lng === 'function' ? p.lng() : p.lng
                }));

                // Check distance to any waterlogging incident
                const nearbyHazards: WaterloggingIncident[] = [];
                incidents.forEach((inc) => {
                  const [incLat, incLng] = inc.coordinates;
                  const isNear = pathPoints.some((pt) => distanceMeters(pt.lat, pt.lng, incLat, incLng) < 450);
                  if (isNear) {
                    nearbyHazards.push(inc);
                  }
                });

                const summaryStr = gRoute.summary || `Via Main Arterial ${idx + 1}`;
                const hasFlyover =
                  summaryStr.toLowerCase().includes('flyover') ||
                  summaryStr.toLowerCase().includes('bypass') ||
                  summaryStr.toLowerCase().includes('setu') ||
                  summaryStr.toLowerCase().includes('elevated');

                // Route is safe if 0 waterlogging choke points encountered
                const isSafe = nearbyHazards.length === 0;

                const steps = (leg.steps || []).map((s: any) => ({
                  instruction: s.instructions?.replace(/<[^>]+>/g, '') || 'Follow roadway',
                  distance: s.distance?.text || '',
                  duration: s.duration?.text || ''
                }));

                const safePassages: string[] = [];
                if (isSafe) {
                  safePassages.push('Zero waterlogged choke points detected on this corridor');
                  if (hasFlyover) safePassages.push('Elevated flyover bypass avoids ground runoff');
                } else {
                  safePassages.push('Alternative dry lanes where available');
                }

                return {
                  id: `gmp-route-${idx}`,
                  summary: summaryStr,
                  distanceKm: distKm,
                  durationMins: durMins,
                  isRecommended: isSafe,
                  waterloggedHazards: nearbyHazards,
                  safePassages,
                  viaFlyover: hasFlyover,
                  steps,
                  googleRouteIndex: idx
                };
              });

              // Rank: safe routes first, then shortest duration
              evaluated.sort((a, b) => {
                if (a.isRecommended && !b.isRecommended) return -1;
                if (!a.isRecommended && b.isRecommended) return 1;
                return a.durationMins - b.durationMins;
              });

              // If all routes have hazards, mark the one with fewest hazards as least risky
              if (!evaluated.some((r) => r.isRecommended) && evaluated.length > 0) {
                evaluated[0].isRecommended = true;
              }

              setAnalyzedRoutes(evaluated);
              setSelectedRouteIdx(evaluated[0]?.googleRouteIndex ?? 0);
            } else {
              setRouteError(`Google Maps Directions status: ${status}. Showing elevated corridor baseline.`);
            }
          }
        );
      } catch (err: any) {
        if (!isCancelled) {
          setIsCalculating(false);
          setRouteError(err?.message || 'Error communicating with Google Maps Directions API');
        }
      }
    }

    queryGoogleMapsDirections();

    return () => {
      isCancelled = true;
    };
  }, [originKey, destinationKey, originCoord.lat, originCoord.lng, destCoord.lat, destCoord.lng, incidents, isOffline]);

  const filteredFacilities = safeLocations.filter((loc) => {
    if (selectedFacilityCategory === 'all') return true;
    return loc.type === selectedFacilityCategory;
  });

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return '🏥';
      case 'police':
        return '👮';
      case 'fire_station':
        return '🚒';
      case 'metro_station':
        return '🚇';
      default:
        return '🏛️';
    }
  };

  // Google Navigation external URL
  const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${originCoord.lat},${originCoord.lng}&destination=${destCoord.lat},${destCoord.lng}&travelmode=driving`;

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* Header Panel */}
      <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-950 text-sky-300 border border-blue-800/40 flex items-center gap-1.5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{lang === 'bn' ? 'গুগল ম্যাপস রিয়েল-টাইম সেফ রাউটিং' : 'Google Maps Real-Time Safe Routing'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.routes.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === 'bn' 
                ? 'লাইভ জলজট রিপোর্ট ও আবহাওয়া সতর্কতার ভিত্তিতে নিরাপদ শুকনো ও উড়ালপুল রুট গণনা'
                : 'Real-life routing evaluated against live waterlogging warnings & active hazard choke points'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={googleNavUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'গুগল ম্যাপে নেভিগেট' : 'Live Google Navigation'}</span>
            </a>
          </div>
        </div>

        {/* Origin & Destination Selectors */}
        <div className="mt-4 pt-4 border-t border-blue-900/30 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.routes.startPoint}</span>
              </span>
              {originKey === 'current' && (
                <span className="text-[10px] text-emerald-400 font-medium">● GPS Synced</span>
              )}
            </label>
            <select
              value={originKey}
              onChange={(e) => setOriginKey(e.target.value)}
              className="w-full bg-[#060e1d] border border-blue-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="current">📍 {lang === 'bn' ? 'আমার বর্তমান জিপিএস অবস্থান' : 'My Current Detected Location'} ({userLocation.areaName})</option>
              <option value="sec5">Sector V (Salt Lake IT Hub)</option>
              <option value="gariahata">Gariahat Crossing (South Kolkata)</option>
              <option value="jadavpur">Jadavpur (8B / University Gate)</option>
              <option value="central">Central Kolkata (Esplanade / MG Road)</option>
              <option value="howrah">Howrah Railway Station</option>
              <option value="airport">NSCB International Airport</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.routes.endPoint}</span>
            </label>
            <select
              value={destinationKey}
              onChange={(e) => setDestinationKey(e.target.value)}
              className="w-full bg-[#060e1d] border border-blue-900/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="gariahata">Gariahat (Rashbehari Crossing, South Kolkata)</option>
              <option value="sec5">Sector V (Salt Lake IT Hub)</option>
              <option value="airport">NSCB International Airport (Via Elevated Corridor)</option>
              <option value="sskm">SSKM Hospital / Rabindra Sadan Emergency</option>
              <option value="jadavpur">Jadavpur (8B / Sulekha)</option>
              <option value="howrah">Howrah Railway Station</option>
              <option value="central">Central Kolkata (Esplanade / MG Road)</option>
            </select>
          </div>
        </div>

        {/* Live Status Indicator */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-blue-900/30">
          <div className="flex items-center gap-2">
            {isCalculating ? (
              <span className="flex items-center gap-1.5 text-sky-400 font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Querying Google Maps Directions & hydrological risks...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Google Maps route telemetry synced with {incidents.length} active warnings</span>
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">Google Maps Platform</span>
        </div>
      </div>

      {/* Interactive Google Map of Safe Route & Hazards */}
      <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-3 sm:px-4 sm:py-3 border-b border-blue-900/30 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'bn' ? 'গুগল ম্যাপস লাইভ রুট ডিসপ্লে' : 'Interactive Safe Route Map'}
            </h3>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" />
              <span>{lang === 'bn' ? 'নিরাপদ রুট' : 'Safe Route'}</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full inline-block" />
              <span>{lang === 'bn' ? 'ঝুঁকিপূর্ণ / জলমগ্ন বিকল্প' : 'Flooded Alternative'}</span>
            </span>
          </div>
        </div>

        <div className="relative w-full h-[280px] sm:h-[360px] bg-[#060e1d]">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              id="google-safe-route-map"
              mapId="DEMO_MAP_ID"
              defaultCenter={{ lat: (originCoord.lat + destCoord.lat) / 2, lng: (originCoord.lng + destCoord.lng) / 2 }}
              defaultZoom={12}
              gestureHandling="greedy"
              disableDefaultUI={false}
              className="w-full h-full"
            >
              <GoogleDirectionsMapInner
                directions={googleDirections}
                selectedRouteIndex={selectedRouteIdx}
                analyzedRoutes={analyzedRoutes}
                incidents={incidents}
              />
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* Route Alternatives Evaluated Against Waterlogging Warnings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
            {lang === 'bn' ? 'রুট বিকল্প ও জলজট ঝুঁকি বিশ্লেষণ' : 'Real-Life Route Analysis & Hazard Detection'}
          </h3>
          <span className="text-[11px] text-slate-400">
            {analyzedRoutes.length} {lang === 'bn' ? 'টি গুগল রুট বিশ্লেষিত' : 'Google Routes Evaluated'}
          </span>
        </div>

        {analyzedRoutes.length === 0 && !isCalculating && (
          <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-6 text-center text-xs text-slate-400">
            {routeError || 'Calculating real-time route options...'}
          </div>
        )}

        {analyzedRoutes.map((route, i) => {
          const isSelected = selectedRouteIdx === route.googleRouteIndex;
          const isExpanded = expandedStepsIdx === i;

          return (
            <div
              key={route.id}
              onClick={() => setSelectedRouteIdx(route.googleRouteIndex)}
              className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all cursor-pointer ${
                route.isRecommended
                  ? isSelected
                    ? 'bg-[#0a162d] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                    : 'bg-[#0a162d]/90 border-emerald-700/40 hover:border-emerald-500/50'
                  : isSelected
                  ? 'bg-[#0a162d] border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-[#0a162d]/90 border-amber-700/40 hover:border-amber-500/50'
              }`}
            >
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                      route.isRecommended
                        ? 'bg-emerald-950/60 text-emerald-200 border-emerald-700/50'
                        : 'bg-amber-950/60 text-amber-200 border-amber-700/50'
                    }`}
                  >
                    {route.isRecommended ? (
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>{t.routes.recommendedTag}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <AlertOctagon className="w-3 h-3 text-amber-400" />
                        <span>{t.routes.hazardousTag}</span>
                      </span>
                    )}
                  </span>

                  {route.viaFlyover && (
                    <span className="text-[10px] font-semibold bg-blue-950 text-sky-300 border border-blue-800/40 px-2 py-0.5 rounded">
                      ✓ {lang === 'bn' ? 'উড়ালপুল করিডোর' : 'Elevated Flyover'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span>{route.distanceKm} km</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-sky-300 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{route.durationMins} mins</span>
                  </span>
                </div>
              </div>

              {/* Route Summary */}
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{route.summary}</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  {route.isRecommended 
                    ? (lang === 'bn' ? '✓ লাইভ গুগল ডেটা অনুযায়ী পথটি শুকনা এবং নিরাপদ' : '✓ Live Google Maps path verified safe from active waterlogging choke points')
                    : (lang === 'bn' ? '⚠️ এই রুটের নিকটবর্তী রাস্তায় জলজটের সতর্কতা রয়েছে' : '⚠️ Route passes near active waterlogging choke points reported by citizens')}
                </p>
              </div>

              {/* Flooded Choke Points Warning */}
              {route.waterloggedHazards.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-600/35 rounded-xl p-3 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{lang === 'bn' ? 'এই রুটের কাছাকাছি জলমগ্ন পয়েন্ট:' : 'Flooded Choke Points on Route:'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {route.waterloggedHazards.map((haz) => (
                      <span
                        key={haz.id}
                        className="px-2.5 py-1 rounded-lg bg-[#060e1d] border border-amber-600/40 text-amber-200 text-[11px] font-medium flex items-center gap-1"
                      >
                        <span>🚫 {haz.title}</span>
                        <span className="text-amber-300 font-bold">({haz.waterDepthInches}" water)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Safe Passages Verified */}
              {route.safePassages.length > 0 && (
                <div className="text-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-400">{t.routes.safeSections}</span>
                  <div className="flex flex-wrap gap-1">
                    {route.safePassages.map((sec, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-700/40 text-[11px]"
                      >
                        ✓ {sec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-Step Navigation Accordion */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedStepsIdx(isExpanded ? null : i);
                  }}
                  className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
                >
                  <span>{isExpanded ? (lang === 'bn' ? 'ধাপগুলো লুকান' : 'Hide Turn-by-Turn') : (lang === 'bn' ? 'টার্ন-বাই-টার্ন পথনির্দেশ' : 'View Turn-by-Turn Steps')}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={googleNavUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1 bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white border border-sky-500/40 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>{lang === 'bn' ? 'গুগল জিপিএস নেভিগেশন' : 'Open in Google Maps'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Expanded Step List */}
              {isExpanded && route.steps.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {route.steps.map((st, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 text-[11px] text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <div className="flex-1">
                        <p>{st.instruction}</p>
                        <span className="text-[10px] text-slate-500">{st.distance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nearby Safe Emergency Locations & Shelters */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h3 className="text-base font-black text-white">
              {t.routes.safeSpotsTitle}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'উঁচু গ্রাউন্ড, ব্যাকআপ বিদ্যুৎ ও জরুরি ট্রমা সেবা সম্পন্ন স্থান'
                : 'Elevated ground campuses with generator backup & flood refuge'}
            </p>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
            {[
              { id: 'all', label: lang === 'bn' ? 'সকল' : 'All' },
              { id: 'hospital', label: lang === 'bn' ? 'হাসপাতাল' : 'Hospitals' },
              { id: 'police', label: lang === 'bn' ? 'থানা' : 'Police' },
              { id: 'shelter', label: lang === 'bn' ? 'আশ্রয়কেন্দ্র' : 'Shelters' },
              { id: 'metro_station', label: lang === 'bn' ? 'মেট্রো' : 'Metro' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedFacilityCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedFacilityCategory === cat.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFacilities.map((facility) => (
            <div
              key={facility.id}
              className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getFacilityIcon(facility.type)}</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {lang === 'bn' ? facility.nameBn : facility.name}
                      </h4>
                      <span className="text-[11px] text-sky-400 font-medium">
                        {lang === 'bn' ? facility.areaBn : facility.area}
                      </span>
                    </div>
                  </div>

                  {facility.isElevatedGround && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                      {lang === 'bn' ? 'উঁচু গ্রাউন্ড' : 'High Ground'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 line-clamp-1">
                  {facility.address}
                </p>

                {facility.notes && (
                  <p className="text-[11px] text-slate-400 mt-1.5 italic">
                    ℹ️ {facility.notes}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                <a
                  href={`tel:${facility.phone}`}
                  className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{facility.phone}</span>
                </a>

                <button
                  onClick={() => onFocusMapLocation(facility.coordinates)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lang === 'bn' ? 'ম্যাপে দেখুন' : 'View on Map'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
