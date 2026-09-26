import React, { useEffect, useState } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap 
} from '@vis.gl/react-google-maps';
import { 
  Compass, 
  Crosshair, 
  PlusCircle, 
  Layers, 
  WifiOff, 
  CheckCircle2, 
  MapPin, 
  AlertTriangle, 
  ThumbsUp 
} from 'lucide-react';
import { WaterloggingIncident, SafeLocation } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCYGbcTomyXB1TaNYCYe1RXbj73uez4MUY';

interface LiveMapProps {
  lang: Language;
  incidents: WaterloggingIncident[];
  safeLocations: SafeLocation[];
  userLocation: { lat: number; lng: number; areaName: string };
  isOffline: boolean;
  selectedIncident?: WaterloggingIncident | null;
  onConfirmIncident: (id: string) => void;
  onOpenReportAtLocation: (coords: [number, number]) => void;
  onNavigateAvoidIncident: (incident: WaterloggingIncident) => void;
}

interface MapInnerProps extends LiveMapProps {
  severityFilter: string;
  showShelters: boolean;
  showWaterlogged: boolean;
  onlyVerified: boolean;
  activePopupIncident: WaterloggingIncident | null;
  setActivePopupIncident: (inc: WaterloggingIncident | null) => void;
  onFocusAreaReady: (focusFn: (coords: [number, number], zoom?: number) => void) => void;
  onGetCenterReady: (getCenterFn: () => [number, number] | null) => void;
}

const MapInner: React.FC<MapInnerProps> = ({
  lang,
  incidents,
  safeLocations,
  userLocation,
  selectedIncident,
  severityFilter,
  showShelters,
  showWaterlogged,
  onlyVerified,
  activePopupIncident,
  setActivePopupIncident,
  onFocusAreaReady,
  onGetCenterReady
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    onFocusAreaReady((coords: [number, number], zoom = 15) => {
      map.panTo({ lat: coords[0], lng: coords[1] });
      map.setZoom(zoom);
    });

    onGetCenterReady(() => {
      const center = map.getCenter();
      if (center) {
        return [center.lat(), center.lng()];
      }
      return null;
    });
  }, [map, onFocusAreaReady, onGetCenterReady]);

  // Pan to selected incident when it changes
  useEffect(() => {
    if (selectedIncident && map) {
      map.panTo({ lat: selectedIncident.coordinates[0], lng: selectedIncident.coordinates[1] });
      map.setZoom(16);
      setActivePopupIncident(selectedIncident);
    }
  }, [selectedIncident, map, setActivePopupIncident]);

  return (
    <Map
      id="kolkata-waterlogging-google-map"
      mapId="DEMO_MAP_ID"
      defaultCenter={{ 
        lat: selectedIncident ? selectedIncident.coordinates[0] : 22.5450, 
        lng: selectedIncident ? selectedIncident.coordinates[1] : 88.3800 
      }}
      defaultZoom={selectedIncident ? 15 : 12}
      gestureHandling="greedy"
      disableDefaultUI={false}
      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Live User GPS Location Marker */}
      <AdvancedMarker
        position={{ lat: userLocation.lat, lng: userLocation.lng }}
        title={lang === 'bn' ? `আপনার অবস্থান: ${userLocation.areaName}` : `You are here: ${userLocation.areaName}`}
      >
        <div className="relative flex items-center justify-center pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-sky-500 border-2 border-white shadow-xl animate-ping opacity-75 absolute" />
          <div className="w-5 h-5 rounded-full bg-sky-600 border-2 border-white shadow-xl relative flex items-center justify-center text-[10px] text-white font-bold">
            •
          </div>
        </div>
      </AdvancedMarker>

      {/* Waterlogging Incident Markers */}
      {showWaterlogged &&
        incidents.map((inc) => {
          if (severityFilter !== 'all' && inc.severity !== severityFilter) return null;
          if (onlyVerified && !inc.verified) return null;

          let markerColor = '#10b981'; // emerald
          let ringColor = 'rgba(16, 185, 129, 0.4)';
          const depthLabel = `${inc.waterDepthInches}"`;

          if (inc.severity === 'critical') {
            markerColor = '#e11d48'; // crimson
            ringColor = 'rgba(225, 29, 72, 0.5)';
          } else if (inc.severity === 'severe') {
            markerColor = '#ea580c'; // orange
            ringColor = 'rgba(234, 88, 12, 0.5)';
          } else if (inc.severity === 'moderate') {
            markerColor = '#eab308'; // yellow
            ringColor = 'rgba(234, 179, 8, 0.4)';
          }

          return (
            <AdvancedMarker
              key={inc.id}
              position={{ lat: inc.coordinates[0], lng: inc.coordinates[1] }}
              onClick={() => setActivePopupIncident(inc)}
              title={`${inc.area} - ${inc.waterDepthInches} inches (${inc.severity})`}
            >
              <div className="relative flex items-center justify-center cursor-pointer group select-none">
                <div 
                  className="w-8 h-8 rounded-full animate-ping absolute"
                  style={{ backgroundColor: ringColor }}
                />
                <div 
                  className="w-7 h-7 rounded-full shadow-xl border-2 border-white flex items-center justify-center text-white font-black text-[10px] transition-transform hover:scale-110 active:scale-95"
                  style={{ backgroundColor: markerColor }}
                >
                  {depthLabel}
                </div>
              </div>
            </AdvancedMarker>
          );
        })}

      {/* Safe Shelters & Facilities */}
      {showShelters &&
        safeLocations.map((loc) => {
          let badgeColor = '#0284c7';
          let iconSymbol = '🏛️';
          if (loc.type === 'hospital') {
            badgeColor = '#059669';
            iconSymbol = '🏥';
          } else if (loc.type === 'police') {
            badgeColor = '#2563eb';
            iconSymbol = '👮';
          } else if (loc.type === 'fire_station') {
            badgeColor = '#dc2626';
            iconSymbol = '🚒';
          } else if (loc.type === 'metro_station') {
            badgeColor = '#7c3aed';
            iconSymbol = '🚇';
          }

          return (
            <AdvancedMarker
              key={loc.id}
              position={{ lat: loc.coordinates[0], lng: loc.coordinates[1] }}
              title={lang === 'bn' ? loc.nameBn : loc.name}
            >
              <div 
                className="w-6 h-6 rounded-lg shadow-lg border border-white flex items-center justify-center text-xs text-white cursor-pointer transition-transform hover:scale-110"
                style={{ backgroundColor: badgeColor }}
              >
                {iconSymbol}
              </div>
            </AdvancedMarker>
          );
        })}
    </Map>
  );
};

export const LiveMap: React.FC<LiveMapProps> = (props) => {
  const {
    lang,
    userLocation,
    isOffline,
    onConfirmIncident,
    onOpenReportAtLocation,
    onNavigateAvoidIncident
  } = props;

  const t = TRANSLATIONS[lang];

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showShelters, setShowShelters] = useState<boolean>(true);
  const [showWaterlogged] = useState<boolean>(true);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [activePopupIncident, setActivePopupIncident] = useState<WaterloggingIncident | null>(null);

  const [focusFn, setFocusFn] = useState<((coords: [number, number], zoom?: number) => void) | null>(null);
  const [getCenterFn, setGetCenterFn] = useState<(() => [number, number] | null) | null>(null);

  const handleFocus = (coords: [number, number], zoom = 15) => {
    if (focusFn) {
      focusFn(coords, zoom);
    }
  };

  const handlePinReport = () => {
    if (getCenterFn) {
      const center = getCenterFn();
      if (center) {
        onOpenReportAtLocation(center);
        return;
      }
    }
    onOpenReportAtLocation([userLocation.lat, userLocation.lng]);
  };

  return (
    <div className="space-y-3">
      {/* Map Control Bar */}
      <div className="bg-[#0a162d]/95 border border-blue-900/35 rounded-2xl p-3 shadow-sm backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Quick Focus Hotspots */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-sky-400" />
              {t.map.hotspots}
            </span>
            <button
              onClick={() => handleFocus([22.5735, 88.4331])}
              className="px-2.5 py-1 rounded-lg bg-[#060e1d] hover:bg-[#0d1b34] text-slate-300 hover:text-white font-medium whitespace-nowrap cursor-pointer transition-colors border border-blue-900/30"
            >
              {t.map.sec5}
            </button>
            <button
              onClick={() => handleFocus([22.5195, 88.3664])}
              className="px-2.5 py-1 rounded-lg bg-[#060e1d] hover:bg-[#0d1b34] text-slate-300 hover:text-white font-medium whitespace-nowrap cursor-pointer transition-colors border border-blue-900/30"
            >
              {t.map.gariahata}
            </button>
            <button
              onClick={() => handleFocus([22.4988, 88.3718])}
              className="px-2.5 py-1 rounded-lg bg-[#060e1d] hover:bg-[#0d1b34] text-slate-300 hover:text-white font-medium whitespace-nowrap cursor-pointer transition-colors border border-blue-900/30"
            >
              {t.map.jadavpur}
            </button>
            <button
              onClick={() => handleFocus([22.5815, 88.3621])}
              className="px-2.5 py-1 rounded-lg bg-[#060e1d] hover:bg-[#0d1b34] text-slate-300 hover:text-white font-medium whitespace-nowrap cursor-pointer transition-colors border border-blue-900/30"
            >
              {t.map.central}
            </button>
            <button
              onClick={() => handleFocus([22.5112, 88.3182])}
              className="px-2.5 py-1 rounded-lg bg-[#060e1d] hover:bg-[#0d1b34] text-slate-300 hover:text-white font-medium whitespace-nowrap cursor-pointer transition-colors border border-blue-900/30"
            >
              {t.map.behala}
            </button>
          </div>

          {/* Action buttons: My location & Report here */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFocus([userLocation.lat, userLocation.lng], 16)}
              className="px-2.5 py-1 rounded-lg bg-blue-600/25 hover:bg-blue-600/40 text-sky-200 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{t.map.recenterGPS}</span>
            </button>

            <button
              onClick={handlePinReport}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'এখানে রিপোর্ট দিন' : 'Pin Report'}</span>
            </button>
          </div>
        </div>

        {/* Filter controls row */}
        <div className="mt-2.5 pt-2.5 border-t border-blue-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold text-[11px] mr-1">{t.map.filterSeverity}</span>
            {(['all', 'critical', 'severe', 'moderate', 'low'] as const).map((sev) => {
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors cursor-pointer border ${
                    active
                      ? 'bg-blue-600/30 text-sky-200 border-blue-500/50 shadow-sm'
                      : 'bg-[#060e1d] text-slate-300 hover:text-white border-blue-900/30'
                  }`}
                >
                  {sev === 'all' && t.map.all}
                  {sev === 'critical' && t.map.critical}
                  {sev === 'severe' && t.map.severe}
                  {sev === 'moderate' && t.map.moderate}
                  {sev === 'low' && t.map.low}
                </button>
              );
            })}
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showShelters}
                onChange={(e) => setShowShelters(e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-400"
              />
              <span>{t.map.layerShelters}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="rounded text-blue-500 focus:ring-blue-400"
              />
              <span>{t.map.verifiedOnly}</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Interactive Google Map Container */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-900/35 shadow-lg bg-[#060e1d] h-[480px] sm:h-[540px]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <MapInner
            {...props}
            severityFilter={severityFilter}
            showShelters={showShelters}
            showWaterlogged={showWaterlogged}
            onlyVerified={onlyVerified}
            activePopupIncident={activePopupIncident}
            setActivePopupIncident={setActivePopupIncident}
            onFocusAreaReady={(fn) => setFocusFn(() => fn)}
            onGetCenterReady={(fn) => setGetCenterFn(() => fn)}
          />
        </APIProvider>

        {/* Offline Badge Overlay */}
        {isOffline && (
          <div className="absolute top-3 left-3 z-20 bg-[#071124]/95 border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-amber-300 flex items-center gap-2 shadow-lg backdrop-blur">
            <WifiOff className="w-4 h-4 text-amber-400" />
            <div>
              <div className="font-bold">{lang === 'bn' ? 'অফলাইন ক্যাশ ম্যাপ সক্রিয়' : 'Offline Cache Mode'}</div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'সংরক্ষিত জোন ডেটা প্রদর্শিত হচ্ছে' : 'Displaying saved zone shelters & roads'}
              </div>
            </div>
          </div>
        )}

        {/* Legend Overlay at Bottom Left */}
        <div className="absolute bottom-6 left-3 z-20 bg-[#071124]/95 border border-blue-900/40 rounded-xl p-2.5 text-[11px] text-slate-300 shadow-xl backdrop-blur hidden sm:block">
          <div className="font-bold text-white mb-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{t.map.legendTitle}</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 border border-white inline-block" />
              <span>&gt; 2 ft: {lang === 'bn' ? 'বিপজ্জনক (যান চলাচল সম্পূর্ণ বন্ধ)' : 'Critical (Submerged)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500 border border-white inline-block" />
              <span>1 - 2 ft: {lang === 'bn' ? 'মারাত্মক (গাড়ি বিকল হওয়ার ঝুঁকি)' : 'Severe (Cars stall)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-white inline-block" />
              <span>6 - 12": {lang === 'bn' ? 'মাঝারি (ধীর গতিতে চলছে)' : 'Moderate (Slow)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
              <span>🏥 🏛️: {lang === 'bn' ? 'নিরাপদ উঁচু আশ্রয় ও হাসপাতাল' : 'Safe High-Ground Shelters'}</span>
            </div>
          </div>
        </div>

        {/* Selected Incident Drawer Popup */}
        {activePopupIncident && (
          <div className="absolute top-3 right-3 left-3 sm:left-auto sm:w-96 z-30 bg-[#071124]/95 border border-blue-900/40 rounded-2xl p-4 shadow-2xl backdrop-blur animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  activePopupIncident.severity === 'critical'
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
                    : activePopupIncident.severity === 'severe'
                    ? 'bg-orange-500/30 text-orange-300 border-orange-500/50'
                    : 'bg-amber-500/30 text-amber-300 border-amber-500/50'
                }`}>
                  {activePopupIncident.severity} • {activePopupIncident.waterDepthInches}" DEPTH
                </span>
                {activePopupIncident.verified && (
                  <span className="text-[10px] text-sky-400 flex items-center gap-0.5 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setActivePopupIncident(null)}
                className="text-slate-400 hover:text-white text-xs p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <h4 className="text-sm font-bold text-white mb-1">
              {lang === 'bn' ? activePopupIncident.titleBn : activePopupIncident.title}
            </h4>

            <p className="text-xs text-slate-300 flex items-center gap-1 mb-2">
              <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{activePopupIncident.landmark} ({activePopupIncident.area})</span>
            </p>

            <div className="bg-[#060e1d] border border-blue-900/35 rounded-xl p-2.5 text-xs text-slate-300 space-y-1 mb-2.5">
              <p><strong>{lang === 'bn' ? 'পরিস্থিতি:' : 'Condition:'}</strong> {lang === 'bn' ? activePopupIncident.waterDepthDescBn : activePopupIncident.waterDepthDesc}</p>
              <p><strong>{lang === 'bn' ? 'রাস্তা:' : 'Road:'}</strong> {lang === 'bn' ? activePopupIncident.roadConditionBn : activePopupIncident.roadCondition}</p>
            </div>

            {/* Hazards Detected */}
            {activePopupIncident.hazards.length > 0 && (
              <div className="mb-3">
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{t.map.hazardsDetected}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activePopupIncident.hazards.map((h, i) => (
                    <span key={i} className="text-[10px] bg-amber-950/60 text-amber-200 border border-amber-600/40 px-2 py-0.5 rounded">
                      ⚠️ {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-blue-900/30 flex items-center gap-2">
              <button
                onClick={() => onConfirmIncident(activePopupIncident.id)}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  activePopupIncident.userUpvoted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0d1b34] hover:bg-[#122444] text-slate-200 border border-blue-900/40'
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>
                  {activePopupIncident.userUpvoted ? t.map.alreadyConfirmed : t.map.confirmThisReport}
                  {' '}({activePopupIncident.confirmationsCount})
                </span>
              </button>

              <button
                onClick={() => onNavigateAvoidIncident(activePopupIncident)}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                title="Calculate route avoiding this area"
              >
                {lang === 'bn' ? 'এড়িয়ে চলুন' : 'Avoid Route'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
