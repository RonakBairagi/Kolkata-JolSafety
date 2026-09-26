import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Building2, 
  Users, 
  Compass, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  Droplets,
  CloudLightning,
  Eye,
  Activity,
  Layers,
  HelpCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import { EarlyWarning, WaterloggingIncident } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { 
  fetchGmpCurrentConditions, 
  fetchGmpHourlyForecast, 
  fetchGmpPublicAlerts,
  assessWaterloggingFromGmpWeather,
  DynamicWaterloggingAssessment
} from '../utils/gmpWeatherApi';

// Source: Google Maps Platform Code Assist
// Solution attribution: gmp_mcp_codeassist_v1_aistudio

interface EarlyWarningSystemProps {
  warnings: EarlyWarning[];
  incidents: WaterloggingIncident[];
  lang: Language;
  onNavigateTab: (tab: string) => void;
  onSelectIncident: (inc: WaterloggingIncident) => void;
  userLocation?: {
    lat: number;
    lng: number;
    areaName?: string;
    areaNameBn?: string;
  };
  isOffline?: boolean;
}

type FilterCategory = 'all' | 'reported' | 'high' | 'moderate' | 'future';

export const EarlyWarningSystem: React.FC<EarlyWarningSystemProps> = ({
  warnings,
  incidents,
  lang,
  onNavigateTab,
  onSelectIncident,
  userLocation,
  isOffline = false
}) => {
  const t = TRANSLATIONS[lang];
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Dynamic coordinate center (defaults to user location or central Kolkata coordinate)
  const defaultLat = userLocation?.lat ?? 22.5726;
  const defaultLng = userLocation?.lng ?? 88.3639;

  const [centerLat, setCenterLat] = useState<number>(defaultLat);
  const [centerLng, setCenterLng] = useState<number>(defaultLng);
  const [inputLat, setInputLat] = useState<string>(defaultLat.toFixed(4));
  const [inputLng, setInputLng] = useState<string>(defaultLng.toFixed(4));

  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [gridAssessments, setGridAssessments] = useState<DynamicWaterloggingAssessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Sync inputs when userLocation changes
  useEffect(() => {
    if (userLocation) {
      setCenterLat(userLocation.lat);
      setCenterLng(userLocation.lng);
      setInputLat(userLocation.lat.toFixed(4));
      setInputLng(userLocation.lng.toFixed(4));
    }
  }, [userLocation]);

  /**
   * Location-Independent Dynamic Assessment
   * Generates a spatial coordinate grid around the specified center coordinates
   * (Center, North +0.025°, East +0.025°, South -0.025°, West -0.025°)
   * and queries Google Maps Platform Weather API for each coordinate in real time.
   */
  const evaluateDynamicCoordinates = useCallback(async (lat: number, lng: number) => {
    if (isOffline) {
      return;
    }
    if (!apiKey) {
      setApiError('Google Maps Platform API Key not found');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    // Dynamic grid points without any hardcoded place names
    const gridPoints = [
      {
        lat,
        lng,
        label: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E (Center Coordinate)`
      },
      {
        lat: Number((lat + 0.025).toFixed(4)),
        lng: Number(lng.toFixed(4)),
        label: `${(lat + 0.025).toFixed(4)}° N, ${lng.toFixed(4)}° E (North Sector)`
      },
      {
        lat: Number(lat.toFixed(4)),
        lng: Number((lng + 0.028).toFixed(4)),
        label: `${lat.toFixed(4)}° N, ${(lng + 0.028).toFixed(4)}° E (East Sector)`
      },
      {
        lat: Number((lat - 0.025).toFixed(4)),
        lng: Number(lng.toFixed(4)),
        label: `${(lat - 0.025).toFixed(4)}° N, ${lng.toFixed(4)}° E (South Sector)`
      },
      {
        lat: Number(lat.toFixed(4)),
        lng: Number((lng - 0.028).toFixed(4)),
        label: `${lat.toFixed(4)}° N, ${(lng - 0.028).toFixed(4)}° E (West Sector)`
      }
    ];

    try {
      const results: DynamicWaterloggingAssessment[] = [];

      for (const pt of gridPoints) {
        try {
          const [current, hourly, alerts] = await Promise.all([
            fetchGmpCurrentConditions(pt.lat, pt.lng, apiKey),
            fetchGmpHourlyForecast(pt.lat, pt.lng, apiKey, 6),
            fetchGmpPublicAlerts(pt.lat, pt.lng, apiKey)
          ]);

          const assessment = assessWaterloggingFromGmpWeather(
            pt.lat,
            pt.lng,
            current,
            hourly,
            alerts,
            pt.label
          );
          results.push(assessment);
        } catch (itemErr) {
          console.warn(`Weather assessment failed for point [${pt.lat}, ${pt.lng}]:`, itemErr);
        }
      }

      if (results.length > 0) {
        setGridAssessments(results);
        const now = new Date();
        setLastRefreshed(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setApiError('Unable to load Google Maps Weather data. Please check network.');
      }
    } catch (err: any) {
      console.error('Dynamic grid evaluation error:', err);
      setApiError('Error querying Google Maps Weather API for coordinate grid.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isOffline]);

  // Initial load
  useEffect(() => {
    evaluateDynamicCoordinates(centerLat, centerLng);
  }, [centerLat, centerLng, evaluateDynamicCoordinates]);

  const handleCustomCoordinateScan = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedLat = parseFloat(inputLat);
    const parsedLng = parseFloat(inputLng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      setCenterLat(parsedLat);
      setCenterLng(parsedLng);
      evaluateDynamicCoordinates(parsedLat, parsedLng);
    }
  };

  const handleUseMyLocation = () => {
    if (userLocation) {
      setCenterLat(userLocation.lat);
      setCenterLng(userLocation.lng);
      setInputLat(userLocation.lat.toFixed(4));
      setInputLng(userLocation.lng.toFixed(4));
      evaluateDynamicCoordinates(userLocation.lat, userLocation.lng);
    }
  };

  // Filter dynamic assessments
  const highRiskAssessments = gridAssessments.filter(
    (a) => a.presentRiskLevel === 'high' || a.futureRiskLevel === 'high'
  );
  const moderateRiskAssessments = gridAssessments.filter(
    (a) => a.presentRiskLevel === 'moderate' || a.futureRiskLevel === 'moderate'
  );
  const futureRiskAssessments = gridAssessments.filter(
    (a) => a.futureRiskLevel === 'high' || a.futureRiskLevel === 'moderate'
  );

  return (
    <div id="dynamic-warnings-container" className="space-y-4 sm:space-y-5 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-blue-950 text-sky-300 border border-blue-800/40">
                {lang === 'bn' ? 'ডাইনামিক জলজট সতর্কবার্তা সিস্টেম' : 'Dynamic Waterlogging Warning System'}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-950/80 text-sky-300 border border-blue-800/40 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-sky-400" />
                Google Maps Weather
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.warnings.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {lang === 'bn'
                ? 'আবহাওয়া তথ্য, বর্ষণ তীব্রতা ও ড্রেনেজ ক্যাপাসিটির উপর ভিত্তি করে রিয়েল-টাইম জলজট পূর্বাভাস'
                : 'Real-time hydrological waterlogging risk evaluated via Google Maps Weather API telemetry'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-[#060e1d] border border-blue-900/40 text-slate-300 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>
                {incidents.length} {lang === 'bn' ? 'রিপোর্টেড' : 'Reported'} • {highRiskAssessments.length}{' '}
                {lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk'}
              </span>
            </span>

            <button
              onClick={() => evaluateDynamicCoordinates(centerLat, centerLng)}
              disabled={isLoading || isOffline}
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Telemetry'}
              className="p-2 bg-[#0d1b34] hover:bg-[#122444] border border-blue-900/40 text-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic Coordinate Scanner Bar (Location-Independent) */}
        <div className="mt-3.5 pt-3.5 border-t border-blue-900/30">
          <form
            onSubmit={handleCustomCoordinateScan}
            className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs"
          >
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'bn' ? 'কোঅর্ডিনেট স্ক্যানার:' : 'Coordinate Query:'}</span>
              </span>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#060e1d] border border-blue-900/40 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-1.5">Lat:</span>
                  <input
                    type="text"
                    value={inputLat}
                    onChange={(e) => setInputLat(e.target.value)}
                    placeholder="22.5726"
                    className="w-20 bg-transparent text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-[#060e1d] border border-blue-900/40 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-mono text-slate-400 mr-1.5">Lng:</span>
                  <input
                    type="text"
                    value={inputLng}
                    onChange={(e) => setInputLng(e.target.value)}
                    placeholder="88.3639"
                    className="w-20 bg-transparent text-white font-mono text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isOffline}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'স্ক্যান' : 'Scan'}</span>
                </button>
              </div>

              {userLocation && (
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="px-2.5 py-1.5 bg-[#0d1b34] hover:bg-[#122444] border border-blue-900/40 text-slate-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{lang === 'bn' ? 'আমার জিপিএস' : 'My GPS'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>
                {lastRefreshed ? `Updated at ${lastRefreshed}` : 'Live weather sync'}
              </span>
            </div>
          </form>
        </div>

        {apiError && (
          <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-600/35 text-xs text-amber-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      {/* Distinction Filter Tabs (Mandatory Classification) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-[#071124] p-1 rounded-xl border border-blue-900/30">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-blue-600/25 text-sky-200 border border-blue-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{lang === 'bn' ? 'সকল সতর্কতা' : 'All Advisories'}</span>
        </button>

        <button
          onClick={() => setActiveFilter('reported')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'reported'
              ? 'bg-amber-950/50 text-amber-200 border border-amber-600/40 shadow-sm'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>{lang === 'bn' ? 'রিপোর্টেড জলজট' : 'Reported Waterlogging'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#060e1d] text-[10px] text-amber-300 font-mono">
            {incidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('high')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'high'
              ? 'bg-amber-950/50 text-amber-200 border border-amber-600/40 shadow-sm'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-orange-400" />
          <span>{lang === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#060e1d] text-[10px] text-orange-300 font-mono">
            {highRiskAssessments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('moderate')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'moderate'
              ? 'bg-blue-950/60 text-sky-200 border border-blue-700/40 shadow-sm'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>{lang === 'bn' ? 'মাঝারি ঝুঁকি' : 'Moderate Risk'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#060e1d] text-[10px] text-sky-300 font-mono">
            {moderateRiskAssessments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveFilter('future')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'future'
              ? 'bg-blue-600/25 text-sky-200 border border-blue-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'bn' ? 'ভবিষ্যৎ পূর্বাভাস' : 'Future Risk Outlook'}</span>
          <span className="px-1.5 py-0.2 rounded-md bg-[#060e1d] text-[10px] text-sky-300 font-mono">
            {futureRiskAssessments.length}
          </span>
        </button>
      </div>

      {/* SECTION 1: REPORTED WATERLOGGING (Verified on-ground reports) */}
      {(activeFilter === 'all' || activeFilter === 'reported') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {lang === 'bn' ? 'বাস্তব রিপোর্টেড জলজট' : 'Reported Waterlogging Incidents'}
              </h3>
              <span className="text-[10px] font-semibold text-sky-300 bg-blue-950/80 border border-blue-800/40 px-2 py-0.5 rounded">
                {lang === 'bn' ? 'নাগরিক ও অন-গ্রাউন্ড রিপোর্ট' : 'Community & Citizen Reports'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {incidents.length} {lang === 'bn' ? 'টি সক্রিয় রিপোর্ট' : 'Active Reports'}
            </span>
          </div>

          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="bg-[#0a162d]/90 border border-amber-600/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 hover:border-amber-500/50 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-200 border border-amber-600/40 tracking-wider">
                      {lang === 'bn' ? 'জলমগ্ন এলাকা' : 'Waterlogged Spot'}
                    </span>
                    <span className="text-xs text-slate-300 font-medium flex items-center gap-1">
                      {incident.source === 'authority' ? (
                        <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      ) : (
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>
                        {incident.source === 'authority'
                          ? 'KMC Disaster Control'
                          : 'Citizen Community Report'}
                      </span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Reported: {incident.reportedAt}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {incident.confirmationsCount} confirmations
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {lang === 'bn' ? incident.titleBn : incident.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {lang === 'bn' ? incident.waterDepthDescBn : incident.waterDepthDesc} • {lang === 'bn' ? incident.roadConditionBn : incident.roadCondition}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#060e1d] border border-blue-900/35 rounded-xl p-2.5">
                  <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>
                      {incident.coordinates[0].toFixed(4)}° N, {incident.coordinates[1].toFixed(4)}° E
                    </span>
                  </div>
                  <div className="text-slate-300 font-medium text-[11px]">
                    Depth: <span className="text-amber-300 font-bold">{incident.waterDepthInches} inches</span> (Traffic: {incident.trafficStatus})
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      onSelectIncident(incident);
                      onNavigateTab('map');
                    }}
                    className="px-3 py-1.5 bg-[#0d1b34] hover:bg-[#122444] text-slate-200 border border-blue-900/40 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{lang === 'bn' ? 'ম্যাপে দেখুন' : 'Inspect on Map'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onNavigateTab('safeRoute')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বিকল্প পথ' : 'Find Detour'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: HIGH & MODERATE RISK PREDICTIVE WARNINGS (Driven by Google Maps Weather API) */}
      {(activeFilter === 'all' || activeFilter === 'high' || activeFilter === 'moderate') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {lang === 'bn' ? 'আবহাওয়া ভিত্তিক ঝুঁকি পূর্বাভাস' : 'Weather-Based Waterlogging Risk Predictions'}
              </h3>
              <span className="text-[10px] font-semibold text-sky-300 bg-blue-950/80 border border-blue-800/40 px-2 py-0.5 rounded">
                Google Maps Weather Telemetry
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {gridAssessments.length} {lang === 'bn' ? 'টি অবস্থান পরীক্ষিত' : 'Coordinates Evaluated'}
            </span>
          </div>

          <div className="space-y-3">
            {gridAssessments
              .filter((a) => {
                if (activeFilter === 'high') return a.presentRiskLevel === 'high' || a.futureRiskLevel === 'high';
                if (activeFilter === 'moderate') return a.presentRiskLevel === 'moderate' || a.futureRiskLevel === 'moderate';
                return true;
              })
              .map((assess) => {
                const isHigh = assess.presentRiskLevel === 'high';
                const isModerate = assess.presentRiskLevel === 'moderate';

                return (
                  <div
                    key={assess.id}
                    className={`border rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 transition-all ${
                      isHigh
                        ? 'bg-[#0a162d]/90 border-amber-600/35 hover:border-amber-500/50'
                        : isModerate
                        ? 'bg-[#0a162d]/90 border-blue-800/40 hover:border-blue-700/60'
                        : 'bg-[#0a162d]/90 border-blue-900/30'
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isHigh ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-200 border border-amber-600/40">
                            🟠 HIGH WATERLOGGING RISK
                          </span>
                        ) : isModerate ? (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950/70 text-sky-200 border border-blue-800/40">
                            🟡 MODERATE RISK
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-200 border border-emerald-700/50">
                            🟢 LOW RISK
                          </span>
                        )}

                        <span className="text-xs text-slate-300 font-mono">
                          {assess.coordinateLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Updated at {assess.updatedAt}</span>
                      </div>
                    </div>

                    {/* Meteorological Telemetry Snapshot */}
                    <div className="bg-[#060e1d] border border-blue-900/35 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Conditions</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          {assess.iconBaseUri && (
                            <img src={`${assess.iconBaseUri}.svg`} alt="icon" className="w-4 h-4 object-contain" />
                          )}
                          <span>{assess.currentCondition}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Rain Rate</div>
                        <div className="text-xs font-bold text-sky-300 mt-0.5">
                          {assess.currentPrecipRateMm} mm/hr ({assess.rainProbability}% prob)
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Past 24h Rain</div>
                        <div className="text-xs font-bold text-amber-300 mt-0.5">
                          {assess.recent24hPrecipMm.toFixed(1)} mm accumulated
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Thunderstorm Risk</div>
                        <div className="text-xs font-bold text-sky-300 mt-0.5">
                          {assess.thunderstormProb}% alert index
                        </div>
                      </div>
                    </div>

                    {/* Present Waterlogging Warning Reasoning */}
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${isHigh ? 'text-amber-400' : 'text-sky-400'}`} />
                        <span>{lang === 'bn' ? 'সতর্কতার কারণ:' : 'Hydrological Risk Reason:'}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed pl-5">
                        {lang === 'bn' ? assess.presentRiskReasonBn : assess.presentRiskReason}
                      </p>
                    </div>

                    {/* Future Outlook Row */}
                    <div className="bg-[#060e1d]/80 border border-blue-900/35 rounded-xl p-3 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{lang === 'bn' ? 'ভবিষ্যৎ বৃষ্টির পূর্বাভাস:' : 'Future Rain Outlook:'}</span>
                          <span className="text-white font-normal">({assess.futureExpectedPeriod})</span>
                        </span>
                        <span className="font-bold text-sky-400">
                          ~{assess.futureForecastRainMm} mm upcoming
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {lang === 'bn' ? assess.futureRiskReasonBn : assess.futureRiskReason}
                      </p>
                    </div>

                    {/* Footer Row: Data Source & Actions */}
                    <div className="pt-2 border-t border-blue-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="text-[10px] text-slate-500">
                        <span>Data source: </span>
                        <span className="font-semibold text-slate-400">{assess.dataSource}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigateTab('safeRoute')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'নিরাপদ পথ খুঁজুন' : 'Find Detour'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SECTION 3: FUTURE WATERLOGGING (Detailed Hourly Rainfall Projections) */}
      {(activeFilter === 'all' || activeFilter === 'future') && (
        <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span>{lang === 'bn' ? 'আগামী ঘণ্টার বৃষ্টিপাত ও জলজট ঝুঁকি পূর্বাভাস' : 'Upcoming Hourly Inundation Outlook'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn' 
                  ? 'গুগল ওয়েদার এপিআই-এর ঘণ্টাভিত্তিক প্রজেকশন অনুযায়ী ড্রেনেজ চ্যানেলের ঝুঁকি'
                  : 'Projected hourly precipitation spikes derived from Google Maps Weather API'}
              </p>
            </div>
            <span className="text-xs font-semibold text-sky-300 bg-blue-950/80 border border-blue-800/40 px-2.5 py-1 rounded-lg">
              Next 6 Hours
            </span>
          </div>

          {gridAssessments.length > 0 && gridAssessments[0].hourlyProjections.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {gridAssessments[0].hourlyProjections.map((hour, idx) => {
                const isHeavy = hour.qpfMm >= 8 || hour.rainProb >= 70;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 text-center flex flex-col justify-between border transition-all ${
                      isHeavy
                        ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
                        : 'bg-[#060e1d] border-blue-900/35 text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-300">{hour.time}</div>
                    
                    <div className="my-2 flex flex-col items-center">
                      {hour.iconBaseUri ? (
                        <img src={`${hour.iconBaseUri}.svg`} alt="forecast" className="w-7 h-7 object-contain" />
                      ) : (
                        <Droplets className={`w-5 h-5 ${isHeavy ? 'text-amber-400' : 'text-sky-400'}`} />
                      )}
                      <span className="text-sm font-bold text-white mt-1">{hour.temp}°C</span>
                    </div>

                    <div>
                      <div className={`text-xs font-bold ${isHeavy ? 'text-amber-300' : 'text-sky-300'}`}>
                        {hour.rainProb}% rain
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {hour.qpfMm} mm expected
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-4">
              Loading dynamic hourly forecast...
            </div>
          )}
        </div>
      )}

      {/* Explanatory Distinction & Compliance Legend */}
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5">
        <div className="font-bold text-slate-200 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>{lang === 'bn' ? 'সতর্কতার প্রকারভেদ ও তথ্যসূত্র নির্দেশিকা' : 'System Architecture & Data Source Distinction'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
          <div className="space-y-1">
            <span className="font-bold text-amber-300">Reported Waterlogging:</span>
            <p className="text-slate-400">
              On-ground reports submitted by local citizens and municipal emergency advisories. No physical automated road sensors are claimed; real weather alerts and precipitation risk are sourced directly from Google Maps Platform Weather API.
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-bold text-sky-300">Predictive Weather Risk:</span>
            <p className="text-slate-400">
              Algorithmic hydrological assessments based on Google Maps Platform Weather API metrics (precipitation rate, past 24h accumulation, and hourly forecast) evaluated against urban runoff drainage capacity.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-blue-900/30 text-[11px] text-slate-500 text-center">
          Weather telemetry powered by Google Maps Platform Weather API. Road-level waterlogging vulnerability calculated via hydrological drainage threshold modeling.
          <div className="pt-1 text-[10px] font-semibold text-slate-400 tracking-wider">
            Google Maps Platform
          </div>
        </div>
      </div>
    </div>
  );
};
