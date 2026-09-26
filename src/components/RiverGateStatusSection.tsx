import React, { useState, useEffect, useCallback } from 'react';
import { 
  Waves, 
  RefreshCw, 
  AlertCircle, 
  Info, 
  Building2, 
  Gauge, 
  ShieldAlert,
  HelpCircle,
  Clock
} from 'lucide-react';
import { RiverGateSystemData, RiverGateStatusCode } from '../types';
import { fetchAuthoritativeRiverGateTelemetry } from '../utils/riverGateService';
import { Language, TRANSLATIONS } from '../data/translations';

interface RiverGateStatusSectionProps {
  lang: Language;
  telemetryData?: RiverGateSystemData | null;
  loading?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export const RiverGateStatusSection: React.FC<RiverGateStatusSectionProps> = ({ 
  lang,
  telemetryData,
  loading: externalLoading,
  onRefresh
}) => {
  const [internalTelemetry, setInternalTelemetry] = useState<RiverGateSystemData | null>(null);
  const [internalLoading, setInternalLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [secondsUntilNextRefresh, setSecondsUntilNextRefresh] = useState<number>(60);

  const t = TRANSLATIONS[lang];

  // Resolve active telemetry: prefer telemetryData from App component
  const telemetry = telemetryData ?? internalTelemetry;
  const isLoading = externalLoading !== undefined ? (externalLoading && !telemetry) : (internalLoading && !telemetry);

  const loadTelemetry = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        const data = await fetchAuthoritativeRiverGateTelemetry();
        setInternalTelemetry(data);
      }
      setSecondsUntilNextRefresh(60);
    } catch (err) {
      console.error('Failed to query authoritative river gate telemetry:', err);
    } finally {
      setInternalLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [onRefresh]);

  // Initial load if telemetryData is not provided from outside
  useEffect(() => {
    if (!telemetryData) {
      loadTelemetry();
    } else {
      setInternalLoading(false);
    }
  }, [telemetryData, loadTelemetry]);

  // Periodic 60-second auto-refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextRefresh((prev) => {
        if (prev <= 1) {
          loadTelemetry(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loadTelemetry]);

  const renderStatusBadge = (status: RiverGateStatusCode) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-200 border border-emerald-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>🟢 {t.weather.gateStatusOpen}</span>
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-950/70 text-red-200 border border-red-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span>🔴 {t.weather.gateStatusClosed}</span>
          </span>
        );
      case 'PARTIALLY_OPEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/50 text-amber-200 border border-amber-700/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>🟡 {t.weather.gateStatusPartiallyOpen}</span>
          </span>
        );
      case 'STATUS_UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#060e1d] text-slate-300 border border-blue-900/40">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>⚪ {t.weather.gateStatusUnavailable}</span>
          </span>
        );
    }
  };

  if (isLoading && !telemetry) {
    return (
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-6 text-center space-y-3">
        <RefreshCw className="w-6 h-6 text-sky-400 animate-spin mx-auto" />
        <p className="text-xs font-bold text-slate-300">
          {lang === 'bn' 
            ? 'সরকারি নদী গেট টেলিমেট্রি লোড হচ্ছে...' 
            : 'Connecting to authoritative West Bengal I&WD / CWC telemetry...'}
        </p>
      </div>
    );
  }

  const tideLevel = telemetry?.tideLevelMeters ?? 2.7;
  // Warning level 5.48m, Danger level 5.94m
  const isNearWarning = tideLevel >= 5.0;

  return (
    <div className="space-y-4">
      {/* Primary River Gate & Telemetry Dashboard Card */}
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Header with Title and Auto-refresh controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-900/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-800/40 flex items-center justify-center shrink-0 mt-0.5 text-sky-400">
              <Waves className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {t.weather.tideTitle}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-sky-300 border border-blue-800/40 uppercase">
                  {lang === 'bn' ? 'সরকারি ডেটা' : 'OFFICIAL TELEMETRY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {t.weather.riverGateSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* Countdown / Sync Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#060e1d] border border-blue-900/40 text-[11px] text-slate-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'bn' ? `রিফ্রেশ: ${secondsUntilNextRefresh} সে` : `Sync in ${secondsUntilNextRefresh}s`}</span>
            </div>

            {/* Sync Now Button */}
            <button
              id="refresh-river-gates-btn"
              onClick={() => loadTelemetry(true)}
              disabled={refreshing}
              className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/35 text-sky-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t.weather.syncTelemetry}</span>
            </button>
          </div>
        </div>

        {/* Official Status Notice: Transparent notice if live API is unavailable */}
        {!telemetry?.isLiveApiAvailable && (
          <div className="bg-[#060e1d] border border-amber-600/35 rounded-xl p-3 sm:p-3.5 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>⚪ {t.weather.liveGateStatusUnavailable}</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {lang === 'bn' ? telemetry?.generalStatusNoticeBn : telemetry?.generalStatusNotice}
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-400" />
                <span>I&WD West Bengal</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-400" />
                <span>Central Water Commission (CWC)</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-400" />
                <span>KMC Sewerage & Drainage</span>
              </span>
            </div>
          </div>
        )}

        {/* Verified Hydrological Gauges: CWC Garden Reach / Hooghly River */}
        <div className="bg-[#060e1d]/90 border border-blue-900/30 rounded-xl p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {lang === 'bn' ? 'যাচাইকৃত নদীর জলস্তর (গার্ডেনরিচ / কলকাতা)' : 'Verified River Gauge (Garden Reach / Kolkata)'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {t.weather.lastUpdated}: {telemetry?.lastChecked}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Current Gauge / Tide Level */}
            <div className={`p-3 rounded-lg border ${isNearWarning ? 'bg-amber-950/40 border-amber-600/40' : 'bg-[#09152b] border-blue-900/30'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.weather.riverLevel}</div>
              <div className="text-xl font-bold text-white mt-0.5">
                {tideLevel.toFixed(2)} <span className="text-xs font-normal text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-sky-300 mt-0.5">
                {isNearWarning 
                  ? (lang === 'bn' ? 'উচ্চ জোয়ারের কাছাকাছি' : 'Near High Tide Level') 
                  : (lang === 'bn' ? 'স্বাভাবিক স্তর' : 'Normal Tidal Level')}
              </div>
            </div>

            {/* Warning Level */}
            <div className="p-3 rounded-lg bg-[#09152b] border border-blue-900/30">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.weather.warningLevel}</div>
              <div className="text-xl font-bold text-amber-300 mt-0.5">
                5.48 <span className="text-xs font-normal text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">CWC Warning Mark</div>
            </div>

            {/* Danger Level */}
            <div className="p-3 rounded-lg bg-[#09152b] border border-blue-900/30">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.weather.dangerLevel}</div>
              <div className="text-xl font-bold text-red-400 mt-0.5">
                5.94 <span className="text-xs font-normal text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Inundation Mark</div>
            </div>

            {/* Extreme Danger (HFL) */}
            <div className="p-3 rounded-lg bg-[#09152b] border border-blue-900/30">
              <div className="text-[10px] uppercase font-bold text-slate-400">{t.weather.extremeDangerLevel}</div>
              <div className="text-xl font-bold text-slate-200 mt-0.5">
                6.78 <span className="text-xs font-normal text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Historical Peak (HFL)</div>
            </div>
          </div>
        </div>

        {/* Monitored Gates List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'bn' ? 'পর্যবেক্ষণাধীন নদী ও খাল স্লুইস লক গেট' : 'Monitored River & Canal Sluice Lock Gates'}</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              {telemetry?.gates.length || 0} {lang === 'bn' ? 'টি মূল গেট' : 'Monitored Gates'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {telemetry?.gates.map((gate) => (
              <div 
                key={gate.id}
                className="bg-[#081326] border border-blue-900/25 hover:border-blue-700/40 rounded-xl p-3.5 transition-all space-y-2.5 shadow-sm"
              >
                {/* Gate Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="text-sm font-bold text-white leading-snug">
                      {lang === 'bn' ? gate.nameBn : gate.name}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      📍 {lang === 'bn' ? gate.locationBn : gate.location}
                    </p>
                  </div>
                  {renderStatusBadge(gate.status)}
                </div>

                {/* Telemetry Metrics */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-900/30 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">{t.weather.riverLevel}:</span>
                    <span className="font-mono font-bold text-white">
                      {gate.riverLevelMeters ? `${gate.riverLevelMeters.toFixed(2)}m` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">{t.weather.dangerLevel}:</span>
                    <span className="font-mono font-bold text-red-400">
                      {gate.dangerLevelMeters ? `${gate.dangerLevelMeters.toFixed(2)}m` : 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">{t.weather.officialDataSource}:</span>
                    <span className="text-slate-300 font-medium">
                      {gate.dataSource}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block">{t.weather.lastUpdated}:</span>
                    <span className="font-mono text-slate-400 text-[10.5px]">
                      {gate.lastUpdated}
                    </span>
                  </div>
                </div>

                {/* Operating Protocol & Safety Function */}
                <div className="bg-[#060e1d] rounded-lg p-2.5 text-[11px] text-slate-300 flex items-start gap-2 border border-blue-900/30">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    {lang === 'bn' ? gate.operationProtocolBn : gate.operationProtocol}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gravity Sluice Drainage Notice */}
        <div className="bg-[#060e1d] border border-blue-900/30 rounded-xl p-3 text-[11px] text-slate-300 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {lang === 'bn'
              ? 'গড়িয়াহাট, ঠনঠনিয়া, পার্ক সার্কাস ও কলকাতার প্রধান নিকাশি ব্যবস্থা নদীর জোয়ারের সাথে যুক্ত গ্র্যাভিটি স্লুইসের উপর নির্ভরশীল। নদীর জলস্তর খালের চেয়ে কম থাকলে জল স্বয়ংক্রিয়ভাবে প্রবাহিত হয়।'
              : 'Urban drainage in Gariahat, Thanthania, and Central Kolkata relies on gravity sluices into River Hooghly. Storm pumps and outfalls discharge when river tide is lower than canal head.'}
          </p>
        </div>

      </div>
    </div>
  );
};
