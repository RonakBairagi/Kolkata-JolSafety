import React from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  CloudRain, 
  AlertTriangle, 
  Navigation, 
  Download, 
  FileText, 
  PhoneCall, 
  LifeBuoy, 
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  Users,
  Compass,
  ArrowUpRight,
  Waves,
  RefreshCw
} from 'lucide-react';
import { WaterloggingIncident, WeatherData, EarlyWarning, RiverGateSystemData } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';

interface HomeScreenProps {
  lang: Language;
  userLocation: { lat: number; lng: number; areaName: string; areaNameBn: string };
  weather: WeatherData;
  warnings: EarlyWarning[];
  incidents: WaterloggingIncident[];
  isOffline: boolean;
  onNavigateTab: (tab: string) => void;
  onOpenSOS: () => void;
  onOpenReport: () => void;
  onOpenHelplines: () => void;
  onSelectIncidentOnMap: (incident: WaterloggingIncident) => void;
  onRefreshGPS: () => void;
  riverGatesData?: RiverGateSystemData | null;
  riverGatesLoading?: boolean;
  onRefreshRiverGates?: () => Promise<void> | void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lang,
  userLocation,
  weather,
  warnings,
  incidents,
  isOffline,
  onNavigateTab,
  onOpenSOS,
  onOpenReport,
  onOpenHelplines,
  onSelectIncidentOnMap,
  onRefreshGPS,
  riverGatesData,
  riverGatesLoading,
  onRefreshRiverGates
}) => {
  const t = TRANSLATIONS[lang];
  const criticalWarning = warnings[0];

  // Helper for severity styling
  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return 'bg-red-950/70 text-red-200 border-red-700/50';
      case 'severe':
        return 'bg-orange-950/60 text-orange-200 border-orange-700/50';
      case 'moderate':
        return 'bg-amber-950/50 text-amber-200 border-amber-700/40';
      default:
        return 'bg-blue-950/50 text-sky-200 border-blue-800/40';
    }
  };

  const getSeverityLabel = (sev: string) => {
    switch (sev) {
      case 'critical':
        return lang === 'bn' ? 'বিপজ্জনক (>২ ফুট)' : 'Critical (>2 ft)';
      case 'severe':
        return lang === 'bn' ? 'মারাত্মক (১-২ ফুট)' : 'Severe (1-2 ft)';
      case 'moderate':
        return lang === 'bn' ? 'মাঝারি (৬-১২")' : 'Moderate (6-12")';
      default:
        return lang === 'bn' ? 'সামান্য (২-৬")' : 'Low (2-6")';
    }
  };

  const renderHomeGateBadge = () => {
    if (!riverGatesData || !riverGatesData.isLiveApiAvailable) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#060e1d] text-slate-300 border border-blue-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>⚪ {t.weather.gateStatusUnavailable}</span>
        </span>
      );
    }
    const hasClosedGate = riverGatesData.gates.some((g) => g.status === 'CLOSED');
    if (hasClosedGate) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-950/70 text-red-200 border border-red-700/50">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <span>🔴 {t.weather.gateStatusClosed}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-700/50">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>🟢 {t.weather.gateStatusOpen}</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* 1. Real Location & Rain Possibilities Bar */}
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-3.5 sm:p-4 shadow-sm backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Real Detected User Location */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <MapPin className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{lang === 'bn' ? 'শনাক্ত বাস্তব অবস্থান' : 'Live Detected Location'}</span>
                </span>
                <button
                  onClick={onRefreshGPS}
                  className="text-[10px] text-sky-300 hover:text-white underline font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'জিপিএস রিফ্রেশ' : 'Sync GPS'}
                </button>
              </div>
              <p className="text-sm sm:text-base font-bold text-white flex flex-wrap items-center gap-1.5 mt-0.5">
                <span>{lang === 'bn' ? userLocation.areaNameBn : userLocation.areaName}</span>
                <span className="text-xs font-mono text-slate-300 font-normal bg-[#060e1d] px-2 py-0.5 rounded-md border border-blue-900/40">
                  {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
                </span>
              </p>
            </div>
          </div>

          {/* Real-Time Rain & Weather Telemetry from Google Maps Weather API */}
          <div 
            onClick={() => onNavigateTab('weather')}
            className="flex flex-wrap items-center gap-3 bg-[#060e1d]/90 hover:bg-[#09152b] border border-blue-900/35 hover:border-blue-700/50 rounded-xl p-2.5 sm:px-3 sm:py-2.5 cursor-pointer transition-all"
          >
            {/* Rainfall Rate */}
            <div className="flex items-center gap-2">
              <CloudRain className={`w-4 h-4 shrink-0 ${weather.rainfallIntensityMmHr > 0 ? 'text-sky-400' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1">
                  <span>{weather.rainfallIntensityMmHr} mm/h</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {lang === 'bn' ? 'বৃষ্টির তীব্রতা' : 'Rain Rate'}
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-blue-900/40 hidden sm:block" />

            {/* Rain Possibility */}
            <div>
              <div className="text-xs font-bold text-sky-300">
                {weather.precipitationProb}%
              </div>
              <div className="text-[10px] text-slate-400">
                {lang === 'bn' ? 'বৃষ্টির সম্ভাবনা' : 'Rain Possibility'}
              </div>
            </div>

            <div className="h-6 w-px bg-blue-900/40 hidden sm:block" />

            {/* Conditions & Temp */}
            <div>
              <div className="text-xs font-bold text-slate-200">
                {weather.temperature}°C • {weather.condition}
              </div>
              <div className="text-[10px] text-slate-400">
                Weather Telemetry
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
          </div>
        </div>
      </div>

      {/* 1.5. Real-Time Hooghly River Sluice Lock Gates Telemetry Banner */}
      <div 
        id="home-river-gates-banner"
        onClick={() => onNavigateTab('weather')}
        className="bg-gradient-to-r from-[#09152b] via-[#0c1c38] to-[#09152b] border border-blue-900/35 hover:border-blue-700/50 rounded-2xl p-3.5 sm:p-4 shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform text-sky-400">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                  <span>{t.home.riverGateBannerTitle}</span>
                </h3>
                {renderHomeGateBadge()}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t.home.riverGateBannerSubtitle} • {lang === 'bn' ? 'গার্ডেনরিচ নদীর জলস্তর' : 'Garden Reach River Level'}:{' '}
                <span className="font-mono font-bold text-sky-300">
                  {riverGatesData?.tideLevelMeters ? `${riverGatesData.tideLevelMeters.toFixed(2)}m` : '2.70m'}
                </span>{' '}
                <span className="text-[10px] text-slate-400">
                  ({lang === 'bn' ? 'বিপদসীমা' : 'Danger'}: 5.94m)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Quick Refresh Telemetry Button */}
            {onRefreshRiverGates && (
              <button
                id="home-sync-river-gates-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshRiverGates();
                }}
                disabled={riverGatesLoading}
                title={lang === 'bn' ? 'টেলিমেট্রি রিফ্রেশ করুন' : 'Sync authoritative telemetry'}
                className="px-2.5 py-1.5 rounded-lg bg-[#060e1d] hover:bg-[#0a162d] border border-blue-900/40 text-sky-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${riverGatesLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t.home.syncGateBtn}</span>
              </button>
            )}

            {/* Jump to Full Telemetry in Weather Dashboard */}
            <div className="px-3 py-1.5 rounded-lg bg-blue-600/20 group-hover:bg-blue-600/30 border border-blue-500/35 text-sky-200 group-hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all">
              <span>{t.home.viewGateTelemetryBtn}</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Top-Priority EMERGENCY SOS CARD: STRICTLY RED RESERVED FOR CRITICAL EMERGENCY */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-950/85 via-[#0b1528] to-red-950/60 border-2 border-red-600/60 rounded-2xl p-4 sm:p-6 shadow-xl shadow-red-950/50">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-950 text-red-200 border border-red-700/60 text-[10px] font-extrabold uppercase tracking-wide">
              <ShieldAlert className="w-3.5 h-3.5 text-red-300" />
              <span>{t.home.sosBannerTitle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.sos.title}
            </h2>
            <p className="text-xs sm:text-sm text-red-100/80 max-w-xl">
              {t.home.sosBannerSubtitle}
            </p>
          </div>

          <button
            id="home-sos-trigger-btn"
            onClick={onOpenSOS}
            className="w-full sm:w-auto px-6 py-4 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold text-base sm:text-lg rounded-xl shadow-lg shadow-red-950/60 border border-red-500 flex items-center justify-center gap-3 transition-all cursor-pointer group active:scale-95"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-white group-hover:scale-110 transition-transform" />
            <span className="tracking-wide uppercase font-extrabold">{t.home.sosButtonText}</span>
          </button>
        </div>

        {/* Ambient subtle glow behind SOS */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3. Active Disaster Warning Banner */}
      {criticalWarning && (
        <div 
          onClick={() => onNavigateTab('warnings')}
          className="bg-amber-950/30 border border-amber-600/40 hover:border-amber-500/60 rounded-2xl p-3.5 sm:p-4 transition-all cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-950/80 border border-amber-600/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold bg-amber-950 text-amber-200 px-2 py-0.5 rounded border border-amber-700/50">
                  {criticalWarning.source}
                </span>
                <span className="text-xs text-amber-300 font-semibold">
                  {criticalWarning.issuedAt}
                </span>
              </div>
              <h3 className="text-sm font-bold text-amber-100 group-hover:text-white transition-colors">
                {lang === 'bn' ? criticalWarning.titleBn : criticalWarning.title}
              </h3>
              <p className="text-xs text-amber-200/80 line-clamp-2 mt-1">
                {lang === 'bn' ? criticalWarning.actionAdviceBn : criticalWarning.actionAdvice}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400/60 group-hover:text-amber-300 shrink-0 self-center" />
          </div>
        </div>
      )}

      {/* 4. Core Navigation Tiles (Emergency Grid) */}
      <div>
        <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2.5 px-1">
          {t.home.quickActions}
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Live Map */}
          <button
            id="home-nav-live-map"
            onClick={() => onNavigateTab('map')}
            className="p-3.5 sm:p-4 rounded-xl bg-[#0a162d]/90 hover:bg-[#0e1d3b] border border-blue-900/25 hover:border-blue-600/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Compass className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                {t.tabs.map}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn' ? 'গভীরতা ও রাস্তা বন্ধ' : 'Water depths & blocks'}
              </p>
            </div>
          </button>

          {/* Safe Route */}
          <button
            id="home-nav-safe-route"
            onClick={() => onNavigateTab('safeRoute')}
            className="p-3.5 sm:p-4 rounded-xl bg-[#0a162d]/90 hover:bg-[#0e1d3b] border border-blue-900/25 hover:border-blue-600/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Navigation className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                {t.tabs.safeRoute}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn' ? 'উড়ালপুল ও শুকনো পথ' : 'Dry elevated passages'}
              </p>
            </div>
          </button>

          {/* Report Waterlogging */}
          <button
            id="home-nav-report-water"
            onClick={onOpenReport}
            className="p-3.5 sm:p-4 rounded-xl bg-[#0a162d]/90 hover:bg-[#0e1d3b] border border-blue-900/25 hover:border-blue-600/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                {lang === 'bn' ? 'জল জমার খবর দিন' : 'Report Water'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn' ? 'নাগরিক সতর্কতা' : 'Crowdsource incident'}
              </p>
            </div>
          </button>

          {/* Offline Maps */}
          <button
            id="home-nav-offline-maps"
            onClick={() => onNavigateTab('offline')}
            className="p-3.5 sm:p-4 rounded-xl bg-[#0a162d]/90 hover:bg-[#0e1d3b] border border-blue-900/25 hover:border-blue-600/40 text-left transition-all flex flex-col justify-between group cursor-pointer shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-950/80 border border-blue-800/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-sky-300 transition-colors" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                {t.tabs.offline}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'bn' ? 'নেট না থাকলেও ম্যাপ' : 'No-internet pack'}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 5. Recently Reported Waterlogging Hotspots in Kolkata */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400">
              {t.home.recentIncidents}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'সেক্টর ফাইভ, গড়িয়াহাট, যাদবপুর ও অন্যান্য প্রধান এলাকা'
                : 'Sector V, Gariahat, Jadavpur and central corridors'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('map')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{t.home.viewAllOnMap}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {incidents.slice(0, 3).map((incident) => (
            <div
              key={incident.id}
              onClick={() => onSelectIncidentOnMap(incident)}
              className="bg-[#0b162c] border border-blue-900/25 hover:border-blue-700/40 rounded-xl p-3.5 space-y-2.5 transition-all hover:bg-[#0d1a34] cursor-pointer flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(incident.severity)}`}>
                    {getSeverityLabel(incident.severity)}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{incident.reportedAt}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-2">
                  {lang === 'bn' ? incident.titleBn : incident.title}
                </h4>

                <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                  <span className="truncate">{lang === 'bn' ? incident.areaBn : incident.area}</span>
                </p>

                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                  {lang === 'bn' ? incident.waterDepthDescBn : incident.waterDepthDesc}
                </p>
              </div>

              <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-slate-400">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  <span>{incident.confirmationsCount} {t.map.confirmations}</span>
                </div>
                {incident.verifiedByAuthority && (
                  <span className="flex items-center gap-1 text-sky-300 text-[10px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-sky-400" />
                    <span>{lang === 'bn' ? 'কেএমসি দ্বারা স্বীকৃত' : 'Civic Verified'}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Official Helplines Quick Access Banner */}
      <div className="bg-[#0a162d] border border-blue-900/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-600/30 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">
              {lang === 'bn' ? 'কলকাতা পুরসভা ও দুর্যোগ হেল্পলাইন' : 'Kolkata Emergency Helplines'}
            </h4>
            <p className="text-xs text-slate-400">
              KMC: <strong className="text-slate-200">14420</strong> | Police: <strong className="text-slate-200">100</strong> | CESC: <strong className="text-slate-200">1912</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onOpenHelplines}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          {lang === 'bn' ? 'জরুরি নম্বরে ডায়াল করুন' : 'View & Dial Helplines'}
        </button>
      </div>

      {/* 7. Safety Advice Footer Notice */}
      <div className="p-3 bg-[#060e1d]/80 border border-blue-900/25 rounded-xl text-center text-xs text-slate-400">
        <p>{t.home.disclaimerShort}</p>
      </div>
    </div>
  );
};
