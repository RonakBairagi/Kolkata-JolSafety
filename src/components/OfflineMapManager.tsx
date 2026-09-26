import React, { useEffect, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { 
  Download, 
  Trash2, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Clock, 
  Info,
  Layers,
  MapPin,
  Compass,
  Eye,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { OfflineMapZone } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { INITIAL_SAFE_LOCATIONS, INITIAL_INCIDENTS } from '../data/kolkataData';

interface OfflineMapManagerProps {
  zones: OfflineMapZone[];
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onToggleDownloadZone: (zoneId: string) => void;
  onDownloadAllZones: () => void;
  lang: Language;
}

// Check for MapTiler API Key
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// Fallback style for offline resilience when no MapTiler Cloud key is configured
const getOfflineFallbackStyle = (): any => ({
  version: 8,
  name: 'MapTiler-Offline-Cached-Raster',
  sources: {
    'maptiler-cached-osm': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.maptiler.com/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
    }
  },
  layers: [
    {
      id: 'maptiler-cached-osm-layer',
      type: 'raster',
      source: 'maptiler-cached-osm',
      minzoom: 0,
      maxzoom: 19
    }
  ]
});

export const OfflineMapManager: React.FC<OfflineMapManagerProps> = ({
  zones,
  isOffline,
  setIsOffline,
  onToggleDownloadZone,
  onDownloadAllZones,
  lang
}) => {
  const t = TRANSLATIONS[lang];

  const totalStorageMb = zones
    .filter((z) => z.downloaded)
    .reduce((sum, z) => sum + z.sizeMb, 0)
    .toFixed(1);

  const downloadedCount = zones.filter((z) => z.downloaded).length;

  // MapTiler Map state
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<maptilersdk.Marker[]>([]);

  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'zone-sec5');
  const [activeStyleName, setActiveStyleName] = useState<'dataviz' | 'streets' | 'outdoor' | 'topo'>('dataviz');
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [showSheltersOnMap, setShowSheltersOnMap] = useState<boolean>(true);
  const [showIncidentsOnMap, setShowIncidentsOnMap] = useState<boolean>(true);

  // Initialize MapTiler configuration
  useEffect(() => {
    if (MAPTILER_KEY) {
      maptilersdk.config.apiKey = MAPTILER_KEY;
    }
    // Enable client-side tile and asset caching for offline persistence
    maptilersdk.config.caching = true;
  }, []);

  // Initialize MapTiler Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    let initialStyle: any = getOfflineFallbackStyle();
    if (MAPTILER_KEY) {
      if (activeStyleName === 'dataviz') {
        initialStyle = maptilersdk.MapStyle.DATAVIZ.DARK;
      } else if (activeStyleName === 'streets') {
        initialStyle = maptilersdk.MapStyle.STREETS;
      } else if (activeStyleName === 'outdoor') {
        initialStyle = maptilersdk.MapStyle.OUTDOOR;
      } else if (activeStyleName === 'topo') {
        initialStyle = maptilersdk.MapStyle.TOPO;
      }
    }

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [88.3639, 22.5450], // Kolkata Center [lng, lat]
      zoom: 11.5,
      navigationControl: 'top-right',
      geolocateControl: false
    });

    map.on('load', () => {
      setMapLoaded(true);
      mapInstanceRef.current = map;

      // Add GeoJSON polygon source for Kolkata Emergency Zones
      const geojsonFeatures = zones.map((zone) => ({
        type: 'Feature' as const,
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          nameBn: zone.nameBn,
          downloaded: zone.downloaded,
          sizeMb: zone.sizeMb,
          sheltersCount: zone.sheltersCount,
          incidentsCached: zone.incidentsCached,
          isSelected: zone.id === selectedZoneId
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [zone.bounds.minLng, zone.bounds.minLat],
            [zone.bounds.maxLng, zone.bounds.minLat],
            [zone.bounds.maxLng, zone.bounds.maxLat],
            [zone.bounds.minLng, zone.bounds.maxLat],
            [zone.bounds.minLng, zone.bounds.minLat]
          ]]
        }
      }));

      map.addSource('offline-zones-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geojsonFeatures
        }
      });

      // Zone fill layer
      map.addLayer({
        id: 'offline-zones-fill',
        type: 'fill',
        source: 'offline-zones-source',
        paint: {
          'fill-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            '#4f46e5', // selected
            ['boolean', ['get', 'downloaded'], false],
            '#059669', // downloaded emerald
            '#64748b'  // available slate
          ],
          'fill-opacity': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            0.35,
            ['boolean', ['get', 'downloaded'], false],
            0.20,
            0.08
          ]
        }
      });

      // Zone borders
      map.addLayer({
        id: 'offline-zones-border',
        type: 'line',
        source: 'offline-zones-source',
        paint: {
          'line-color': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            '#a5b4fc', // selected line
            ['boolean', ['get', 'downloaded'], false],
            '#34d399', // downloaded border
            '#94a3b8'  // available border
          ],
          'line-width': [
            'case',
            ['boolean', ['get', 'isSelected'], false],
            3,
            2
          ],
          'line-dasharray': [2, 1]
        }
      });

      // Click on zone polygon
      map.on('click', 'offline-zones-fill', (e) => {
        if (e.features && e.features[0]) {
          const zoneId = e.features[0].properties?.id;
          if (zoneId) {
            setSelectedZoneId(zoneId);
            const targetZone = zones.find(z => z.id === zoneId);
            if (targetZone) {
              map.fitBounds(
                [
                  [targetZone.bounds.minLng, targetZone.bounds.minLat],
                  [targetZone.bounds.maxLng, targetZone.bounds.maxLat]
                ],
                { padding: 35, duration: 800 }
              );
            }
          }
        }
      });

      map.on('mouseenter', 'offline-zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'offline-zones-fill', () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapInstanceRef.current = map;

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
      setMapLoaded(false);
    };
  }, [activeStyleName]);

  // Update GeoJSON layer when zones download status or selection changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource('offline-zones-source') as maptilersdk.GeoJSONSource | undefined;
    if (source) {
      const geojsonFeatures = zones.map((zone) => ({
        type: 'Feature' as const,
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          nameBn: zone.nameBn,
          downloaded: zone.downloaded,
          sizeMb: zone.sizeMb,
          sheltersCount: zone.sheltersCount,
          incidentsCached: zone.incidentsCached,
          isSelected: zone.id === selectedZoneId
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [zone.bounds.minLng, zone.bounds.minLat],
            [zone.bounds.maxLng, zone.bounds.minLat],
            [zone.bounds.maxLng, zone.bounds.maxLat],
            [zone.bounds.minLng, zone.bounds.maxLat],
            [zone.bounds.minLng, zone.bounds.minLat]
          ]]
        }
      }));

      source.setData({
        type: 'FeatureCollection',
        features: geojsonFeatures
      });
    }
  }, [zones, selectedZoneId, mapLoaded]);

  // Sync Markers (Safe Shelters & Cached Incidents) on the MapTiler Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Safe Shelter Markers
    if (showSheltersOnMap) {
      INITIAL_SAFE_LOCATIONS.forEach((loc) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform hover:scale-125';
        
        let iconChar = '🏛️';
        let bgStyle = 'background: #0284c7;';
        if (loc.type === 'hospital') {
          iconChar = '🏥';
          bgStyle = 'background: #059669;';
        } else if (loc.type === 'police') {
          iconChar = '👮';
          bgStyle = 'background: #2563eb;';
        } else if (loc.type === 'metro_station') {
          iconChar = '🚇';
          bgStyle = 'background: #7c3aed;';
        }

        el.innerHTML = `
          <div style="${bgStyle} width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); font-size: 13px;">
            ${iconChar}
          </div>
        `;

        const popup = new maptilersdk.Popup({ offset: 18, closeButton: false })
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #0f172a; max-width: 220px; padding: 2px;">
              <strong style="color: #0f172a; font-size: 13px;">${lang === 'bn' ? loc.nameBn : loc.name}</strong><br/>
              <span style="color: #475569; font-size: 11px;">📍 ${loc.address}</span><br/>
              <span style="color: #0284c7; font-weight: bold; font-size: 10px;">${loc.isElevatedGround ? '⛰️ Elevated High Ground' : ''} ${loc.hasEmergencyPower ? '⚡ Backup Power' : ''}</span>
            </div>
          `);

        const marker = new maptilersdk.Marker({ element: el })
          .setLngLat([loc.coordinates[1], loc.coordinates[0]])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // Cached Incident Hotspots
    if (showIncidentsOnMap) {
      INITIAL_INCIDENTS.forEach((inc) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform hover:scale-125';

        let color = '#eab308'; // yellow
        if (inc.severity === 'critical') color = '#e11d48';
        else if (inc.severity === 'severe') color = '#ea580c';

        el.innerHTML = `
          <div style="background: ${color}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); color: #ffffff; font-weight: 900; font-size: 10px;">
            ${inc.waterDepthInches}"
          </div>
        `;

        const popup = new maptilersdk.Popup({ offset: 18, closeButton: false })
          .setHTML(`
            <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #0f172a; max-width: 220px; padding: 2px;">
              <strong style="color: #0f172a; font-size: 13px;">${lang === 'bn' ? inc.titleBn : inc.title}</strong><br/>
              <span style="color: #e11d48; font-weight: bold;">⚠️ ${inc.waterDepthInches} inches (${inc.severity})</span><br/>
              <span style="color: #475569; font-size: 11px;">${inc.landmark}</span>
            </div>
          `);

        const marker = new maptilersdk.Marker({ element: el })
          .setLngLat([inc.coordinates[1], inc.coordinates[0]])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [mapLoaded, showSheltersOnMap, showIncidentsOnMap, lang]);

  // Handle focusing a zone on the MapTiler Map
  const handleFocusZone = (zone: OfflineMapZone) => {
    setSelectedZoneId(zone.id);
    const map = mapInstanceRef.current;
    if (map) {
      map.fitBounds(
        [
          [zone.bounds.minLng, zone.bounds.minLat],
          [zone.bounds.maxLng, zone.bounds.maxLat]
        ],
        { padding: 35, duration: 1000 }
      );
    }
  };

  const handleResetKolkataView = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo({
        center: [88.3639, 22.5450],
        zoom: 11.5,
        duration: 1000
      });
    }
  };

  const selectedZone = zones.find(z => z.id === selectedZoneId) || zones[0];

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* Header */}
      <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40">
              {lang === 'bn' ? 'নেটওয়ার্ক ড্রপআউট রেসিলিয়েন্স' : 'Network Outage Resilience'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.offline.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              {t.offline.subtitle}
            </p>
          </div>

          {/* Storage metric */}
          <div className="bg-[#060c18] border border-blue-900/40 rounded-xl p-3 flex items-center gap-3 self-start sm:self-auto">
            <div className="w-10 h-10 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{totalStorageMb} MB</div>
              <div className="text-[10px] text-slate-400">
                {downloadedCount} / {zones.length} {lang === 'bn' ? 'প্যাক সংরক্ষিত' : 'Packs Saved'}
              </div>
            </div>
          </div>
        </div>

        {/* Offline simulator switch banner */}
        <div className="mt-4 pt-3.5 border-t border-blue-900/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#060c18]/80 p-3 rounded-xl border border-blue-900/30">
          <div className="flex items-center gap-2.5">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold text-white">
                {isOffline ? (lang === 'bn' ? 'অফলাইন মোড সক্রিয়' : 'Offline Mode Active') : (lang === 'bn' ? 'অনলাইন সিঙ্ক সচল' : 'Live Sync Active')}
              </div>
              <div className="text-[11px] text-slate-400">
                {isOffline 
                  ? (lang === 'bn' ? 'অ্যাপটি লোকাল মেমরি থেকে সংরক্ষিত ম্যাপ ও তথ্য দেখাচ্ছে' : 'App is using local cache with zero external network requests')
                  : (lang === 'bn' ? 'লাইভ ইন্টারনেট ডেটা ব্যবহার করা হচ্ছে' : 'Connecting to live weather and community reports')}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOffline(!isOffline)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isOffline
                ? 'bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-600/40'
                : 'bg-amber-600/80 hover:bg-amber-500 text-amber-100 border border-amber-500/40'
            }`}
          >
            {isOffline ? t.simOnlineBtn : t.simOfflineBtn}
          </button>
        </div>
      </div>

      {/* MapTiler Offline Vector Map Viewer */}
      <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/25 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {lang === 'bn' ? 'ম্যাপটাইল্যার অফলাইন ভেক্টর ও আশ্রয় ম্যাপ' : 'MapTiler Offline Vector & Shelter Engine'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/30">
                  MapTiler SDK v{maptilersdk.getVersion()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' 
                  ? 'লোকাল ক্যাশ মেমরি থেকে ভেক্টর সীমানা, উঁচু আশ্রয় ও সুরক্ষিত করিডোর প্রদর্শন' 
                  : 'Displays municipal zone polygons, elevated shelters & emergency hospitals cached for low-connectivity'}
              </p>
            </div>
          </div>

          {/* Map Controls: Styles & Reset */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto text-xs">
            {MAPTILER_KEY && (
              <div className="flex items-center bg-[#060c18] p-1 rounded-lg border border-blue-900/40 text-[11px]">
                <button
                  onClick={() => setActiveStyleName('dataviz')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeStyleName === 'dataviz' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'নাইট স্টর্ম' : 'Dark Mode'}
                </button>
                <button
                  onClick={() => setActiveStyleName('streets')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeStyleName === 'streets' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'রাস্তাঘাট' : 'Streets'}
                </button>
                <button
                  onClick={() => setActiveStyleName('outdoor')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    activeStyleName === 'outdoor' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'ভূপ্রকৃতি' : 'Outdoor'}
                </button>
              </div>
            )}

            <button
              onClick={handleResetKolkataView}
              className="px-2.5 py-1.5 rounded-lg bg-[#060c18] hover:bg-blue-950 text-slate-300 hover:text-white border border-blue-900/40 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset to full Kolkata view"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সম্পূর্ণ কলকাতা' : 'Full City'}</span>
            </button>
          </div>
        </div>

        {/* Quick Zone Fly-to Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
            <Compass className="w-3 h-3 text-blue-400" />
            {lang === 'bn' ? 'জোন ফোকাস:' : 'Fly to Zone:'}
          </span>
          {zones.map((zone) => {
            const isSelected = zone.id === selectedZoneId;
            return (
              <button
                key={zone.id}
                onClick={() => handleFocusZone(zone)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : zone.downloaded
                    ? 'bg-[#060c18] text-emerald-400 hover:bg-slate-900 border border-emerald-500/30'
                    : 'bg-[#060c18] text-slate-300 hover:bg-slate-900 border border-blue-900/30'
                }`}
              >
                <span>{lang === 'bn' ? zone.nameBn.split(' ')[0] : zone.name.split(' ')[0]}</span>
                {zone.downloaded ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-400">({zone.sizeMb}MB)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Map Container */}
        <div className="relative rounded-xl overflow-hidden border border-blue-900/30 shadow-inner bg-[#040813] h-[380px] sm:h-[440px]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Layer Toggles Overlay */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-[#081226]/95 border border-blue-900/40 rounded-xl p-2.5 text-xs text-slate-200 backdrop-blur shadow-md">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
              {lang === 'bn' ? 'ম্যাপ লেয়ার' : 'Map Layers'}
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSheltersOnMap}
                onChange={(e) => setShowSheltersOnMap(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px]">{lang === 'bn' ? 'উঁচু আশ্রয় ও হাসপাতাল (🏥)' : 'Safe Shelters (🏥)'}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showIncidentsOnMap}
                onChange={(e) => setShowIncidentsOnMap(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px]">{lang === 'bn' ? 'ক্যাশ জলমগ্ন এলাকা (⚠️)' : 'Cached Hotspots (⚠️)'}</span>
            </label>
          </div>

          {/* Selected Zone Quick Info Overlay at bottom */}
          {selectedZone && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md z-10 bg-[#081226]/95 border border-blue-700/40 rounded-xl p-3 shadow-xl backdrop-blur">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-900/40 text-blue-300">
                      {selectedZone.downloaded ? (lang === 'bn' ? 'সংরক্ষিত প্যাক' : 'Saved Pack') : (lang === 'bn' ? 'ডাউনলোডযোগ্য' : 'Available')}
                    </span>
                    <span className="text-[11px] text-slate-400">{selectedZone.sizeMb} MB • v{selectedZone.version}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white mt-1">
                    {lang === 'bn' ? selectedZone.nameBn : selectedZone.name}
                  </h4>
                </div>

                <button
                  onClick={() => onToggleDownloadZone(selectedZone.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                    selectedZone.downloaded
                      ? 'bg-rose-950/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {selectedZone.downloaded ? (lang === 'bn' ? 'মুছুন' : 'Delete') : (lang === 'bn' ? 'ডাউনলোড' : 'Download')}
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-blue-900/30 flex items-center justify-between text-[11px] text-slate-400">
                <span>🏥 {selectedZone.sheltersCount} {lang === 'bn' ? 'আশ্রয়' : 'Shelters'}</span>
                <span>🏛️ {selectedZone.landmarksCount} {lang === 'bn' ? 'ল্যান্ডমার্ক' : 'Landmarks'}</span>
                <span>⚠️ {selectedZone.incidentsCached} {lang === 'bn' ? 'হটস্পট' : 'Hotspots'}</span>
              </div>
            </div>
          )}

          {/* MapTiler Cache Status badge */}
          <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-1.5 bg-[#081226]/95 border border-emerald-600/30 rounded-lg px-2.5 py-1 text-[11px] text-emerald-300 shadow backdrop-blur">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'bn' ? 'ম্যাপটাইল্যার লোকাল ক্যাশ সক্রিয়' : 'MapTiler Client Cache Active'}</span>
          </div>
        </div>
      </div>

      {/* Quick Download All Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
          {lang === 'bn' ? 'কলকাতার পৌর জোন অনুযায়ী অফলাইন ম্যাপ' : 'Kolkata Emergency Zone Packages'}
        </h3>

        <button
          onClick={onDownloadAllZones}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t.offline.downloadAll}</span>
        </button>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          return (
            <div
              key={zone.id}
              className={`border rounded-xl p-4 transition-all flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-[#0a162d] border-blue-600 shadow-md'
                  : zone.downloaded
                  ? 'bg-[#081226]/90 border-emerald-600/30'
                  : 'bg-[#081226]/70 border-blue-900/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {lang === 'bn' ? zone.nameBn : zone.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{zone.sizeMb} MB</span>
                      <span>•</span>
                      <span>v{zone.version}</span>
                    </div>
                  </div>

                  {zone.downloaded ? (
                    <span className="text-[10px] bg-emerald-950/50 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{t.offline.statusDownloaded}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] bg-[#060c18] text-slate-400 border border-blue-900/30 px-2 py-0.5 rounded font-medium">
                      {t.offline.statusAvailable}
                    </span>
                  )}
                </div>

                <div className="bg-[#050a15] rounded-lg p-2.5 text-xs text-slate-300 space-y-1 border border-blue-950/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{lang === 'bn' ? 'উঁচু আশ্রয়কেন্দ্র:' : 'Elevated Shelters:'}</span>
                    <span className="font-bold text-white">{zone.sheltersCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{lang === 'bn' ? 'জরুরি ল্যান্ডমার্ক:' : 'Key Landmarks:'}</span>
                    <span className="font-bold text-white">{zone.landmarksCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">{lang === 'bn' ? 'ক্যাশ করা রিপোর্ট:' : 'Cached Hotspots:'}</span>
                    <span className="font-bold text-white">{zone.incidentsCached}</span>
                  </div>
                </div>

                {zone.downloadedAt && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'সংরক্ষিত হয়েছে:' : 'Saved:'} {zone.downloadedAt}</span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="pt-2 border-t border-blue-900/25 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleFocusZone(zone)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer py-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ম্যাপটাইল্যারে দেখুন' : 'View on MapTiler'}</span>
                </button>

                <button
                  onClick={() => onToggleDownloadZone(zone.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    zone.downloaded
                      ? 'bg-[#060c18] hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-blue-900/35 hover:border-rose-800/40'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {zone.downloaded ? (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.offline.deleteBtn}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>{t.offline.downloadBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Offline Integrity Notice */}
      <div className="p-4 bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl text-xs text-slate-300 space-y-2">
        <div className="font-bold text-slate-200 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-400" />
          <span>{lang === 'bn' ? 'অফলাইন তথ্যের নির্ভরযোগ্যতা নীতি' : 'Offline Map Reliability Notice'}</span>
        </div>
        <p className="leading-relaxed text-slate-400">
          {lang === 'bn' 
            ? 'ইন্টারনেট না থাকলে অ্যাপ্লিকেশনটি শুধুমাত্র শেষ ডাউনলোডকৃত ক্যাশ ডেটা প্রদর্শন করবে। অফলাইন অবস্থায় লাইভ রিয়েল-টাইম আপডেট পাওয়া সম্ভব নয়। বর্ষায় নেটওয়ার্ক চলে যাওয়ার আগেই প্রয়োজনীয় জোন ডাউনলোড করে রাখুন।'
            : 'When internet connectivity is disconnected or weak during storms, cached vector boundaries, municipal shelters, and last-saved incident locations remain accessible offline. The app strictly differentiates between cached data and live data to ensure traveler safety.'}
        </p>
      </div>
    </div>
  );
};
