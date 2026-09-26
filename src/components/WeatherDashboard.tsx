import React, { useState, useEffect, useCallback } from 'react';
import { 
  CloudRain, 
  Droplets, 
  Wind, 
  Thermometer, 
  Waves, 
  Clock, 
  Info, 
  Activity, 
  RefreshCw, 
  Sun, 
  CloudLightning, 
  Eye, 
  Compass, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Gauge,
  Sunrise,
  Sunset
} from 'lucide-react';
import { WeatherData, RiverGateSystemData } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { 
  fetchGmpCurrentConditions, 
  fetchGmpDailyForecast, 
  fetchGmpHourlyForecast,
  GmpCurrentConditions,
  GmpForecastDay,
  GmpForecastHour
} from '../utils/gmpWeatherApi';
import { RiverGateStatusSection } from './RiverGateStatusSection';

// Source: Google Maps Platform Code Assist
// Solution attribution: gmp_mcp_codeassist_v1_aistudio

interface WeatherDashboardProps {
  weather: WeatherData;
  lang: Language;
  isOffline: boolean;
  userLocation?: {
    lat: number;
    lng: number;
    areaName?: string;
    areaNameBn?: string;
  };
  riverGatesData?: RiverGateSystemData | null;
  riverGatesLoading?: boolean;
  onRefreshRiverGates?: () => Promise<void> | void;
}

interface MonitoringStation {
  id: string;
  name: string;
  nameBn: string;
  lat: number;
  lng: number;
  description: string;
  descriptionBn: string;
}

const KOLKATA_STATIONS: MonitoringStation[] = [
  {
    id: 'alipore',
    name: 'Alipore Meteorological Observatory (HQ)',
    nameBn: 'আলিপুর আবহাওয়া দপ্তর মানমন্দির',
    lat: 22.5334,
    lng: 88.3263,
    description: 'Primary IMD Regional Doppler Radar Station',
    descriptionBn: 'প্রধান আলিপুর ডপলার ওয়েদার রাডার'
  },
  {
    id: 'sector_v',
    name: 'Sector V / Salt Lake IT Hub',
    nameBn: 'সেক্টর ফাইভ / সল্টলেক আইটি হাব',
    lat: 22.5735,
    lng: 88.4331,
    description: 'Eastern corridor & Salt Lake drainage basin',
    descriptionBn: 'পূর্ব কলকাতা ও সল্টলেক জল নিষ্কাশন অঞ্চল'
  },
  {
    id: 'central',
    name: 'Central Kolkata (Thanthania & Dharmatala)',
    nameBn: 'মধ্য কলকাতা (ঠনঠনিয়া ও ধর্মতলা)',
    lat: 22.5697,
    lng: 88.3592,
    description: 'High-risk low-lying commercial core',
    descriptionBn: 'অতি সংবেদনশীল নিচু এলাকা'
  },
  {
    id: 'hooghly',
    name: 'Howrah & Hooghly River Sluice Lock Gates',
    nameBn: 'হাওড়া ও হুগলি নদী লক গেট সংলগ্ন',
    lat: 22.5857,
    lng: 88.3426,
    description: 'Tidal surge & river discharge monitoring',
    descriptionBn: 'জোয়ার-ভাঁটা ও নদী সংযোগ পর্যবেক্ষণ'
  },
  {
    id: 'south',
    name: 'South Kolkata (Jadavpur & Gariahat)',
    nameBn: 'দক্ষিণ কলকাতা (যাদবপুর ও গড়িয়াহাট)',
    lat: 22.4988,
    lng: 88.3718,
    description: 'Residential & canal drainage zone',
    descriptionBn: 'আবাসিক ও খাল সংযোগ ড্রেনেজ জোন'
  }
];

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  weather,
  lang,
  isOffline,
  userLocation,
  riverGatesData,
  riverGatesLoading,
  onRefreshRiverGates
}) => {
  const t = TRANSLATIONS[lang];
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Stations including user GPS if available
  const stations: MonitoringStation[] = [
    ...(userLocation
      ? [{
          id: 'user_gps',
          name: userLocation.areaName || 'My Current Location',
          nameBn: userLocation.areaNameBn || 'আমার বর্তমান অবস্থান',
          lat: userLocation.lat,
          lng: userLocation.lng,
          description: 'Live GPS Location Coordinates',
          descriptionBn: 'লাইভ জিপিএস অবস্থান'
        }]
      : []),
    ...KOLKATA_STATIONS
  ];

  const [selectedStationId, setSelectedStationId] = useState<string>(
    userLocation ? 'user_gps' : 'alipore'
  );
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  // Google Maps Platform Weather States
  const [gmpCurrent, setGmpCurrent] = useState<GmpCurrentConditions | null>(null);
  const [gmpDays, setGmpDays] = useState<GmpForecastDay[] | null>(null);
  const [gmpHours, setGmpHours] = useState<GmpForecastHour[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const selectedStation = stations.find((s) => s.id === selectedStationId) || stations[0];

  const fetchWeatherData = useCallback(async () => {
    if (isOffline) {
      return;
    }
    if (!apiKey) {
      setApiError('Google Maps Platform API Key not found');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      const [currentRes, daysRes, hoursRes] = await Promise.allSettled([
        fetchGmpCurrentConditions(selectedStation.lat, selectedStation.lng, apiKey),
        fetchGmpDailyForecast(selectedStation.lat, selectedStation.lng, apiKey, 5),
        fetchGmpHourlyForecast(selectedStation.lat, selectedStation.lng, apiKey, 10)
      ]);

      let hasSuccess = false;

      if (currentRes.status === 'fulfilled') {
        setGmpCurrent(currentRes.value);
        hasSuccess = true;
      } else {
        console.warn('Google Maps Weather Current Conditions failed:', currentRes.reason);
      }

      if (daysRes.status === 'fulfilled') {
        setGmpDays(daysRes.value.forecastDays || []);
        hasSuccess = true;
      } else {
        console.warn('Google Maps Weather Daily Forecast failed:', daysRes.reason);
      }

      if (hoursRes.status === 'fulfilled') {
        setGmpHours(hoursRes.value.forecastHours || []);
        hasSuccess = true;
      } else {
        console.warn('Google Maps Weather Hourly Forecast failed:', hoursRes.reason);
      }

      if (hasSuccess) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(timeStr);
      } else {
        setApiError('Unable to reach Google Maps Weather service; showing cached telemetry.');
      }
    } catch (err: any) {
      console.error('Failed to fetch Google Maps Platform Weather data:', err);
      setApiError('Weather service offline; displaying cached radar bulletin.');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isOffline, selectedStation.lat, selectedStation.lng]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Derive display values (preferring GMP Weather API, falling back to cached baseline)
  const currentTemp = gmpCurrent?.temperature?.degrees != null
    ? Math.round(gmpCurrent.temperature.degrees * 10) / 10
    : weather.temperature;

  const feelsLike = gmpCurrent?.feelsLikeTemperature?.degrees != null
    ? Math.round(gmpCurrent.feelsLikeTemperature.degrees * 10) / 10
    : currentTemp + 5;

  const weatherDesc = gmpCurrent?.weatherCondition?.description?.text || weather.condition;
  const iconBase = gmpCurrent?.weatherCondition?.iconBaseUri;
  const iconUrl = iconBase ? `${iconBase}.svg` : undefined;

  const humidity = gmpCurrent?.relativeHumidity != null
    ? gmpCurrent.relativeHumidity
    : weather.humidity;

  const windSpeed = gmpCurrent?.wind?.speed?.value != null
    ? Math.round(gmpCurrent.wind.speed.value)
    : weather.windSpeedKmH;

  const windDirection = gmpCurrent?.wind?.direction?.cardinal || 'SW';
  const windGust = gmpCurrent?.wind?.gust?.value != null ? Math.round(gmpCurrent.wind.gust.value) : null;

  const precipProb = gmpCurrent?.precipitation?.probability?.percent != null
    ? gmpCurrent.precipitation.probability.percent
    : weather.precipitationProb;

  const precipQpf = gmpCurrent?.precipitation?.qpf?.quantity != null
    ? gmpCurrent.precipitation.qpf.quantity
    : (weather.rainfallIntensityMmHr > 0 ? weather.rainfallIntensityMmHr : 0);

  const tstormProb = gmpCurrent?.thunderstormProbability != null
    ? gmpCurrent.thunderstormProbability
    : 45;

  const uvIndex = gmpCurrent?.uvIndex ?? 0;
  const cloudCover = gmpCurrent?.cloudCover ?? 85;
  const airPressure = gmpCurrent?.airPressure?.meanSeaLevelMillibars != null
    ? Math.round(gmpCurrent.airPressure.meanSeaLevelMillibars)
    : 1008;
  const visibilityKm = gmpCurrent?.visibility?.distance != null
    ? gmpCurrent.visibility.distance
    : 16;

  const tempMax = gmpCurrent?.currentConditionsHistory?.maxTemperature?.degrees != null
    ? Math.round(gmpCurrent.currentConditionsHistory.maxTemperature.degrees)
    : null;
  const tempMin = gmpCurrent?.currentConditionsHistory?.minTemperature?.degrees != null
    ? Math.round(gmpCurrent.currentConditionsHistory.minTemperature.degrees)
    : null;

  return (
    <div id="weather-dashboard-container" className="space-y-4 sm:space-y-5 pb-12">
      {/* Station Selector & Header Bar */}
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-4 sm:p-5 shadow-sm backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-950 text-sky-300 border border-blue-800/40">
                <Sparkles className="w-3 h-3 text-sky-400" />
                <span>Google Maps Platform Weather API</span>
              </span>
              {isOffline ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-200 border border-amber-700/40">
                  {lang === 'bn' ? 'অফলাইন ক্যাশ' : 'Offline Cache'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-200 border border-emerald-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {lang === 'bn' ? 'লাইভ রাডার ফিড' : 'Live Radar Feed'}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {t.weather.title}
            </h2>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'কলকাতা ও সংলগ্ন অঞ্চলের নির্ভুল আবহাওয়া, বৃষ্টিপাত পূর্বাভাস ও জল নিষ্কাশন মনিটরিং'
                : 'High-precision meteorological telemetry, rainfall projections & Hooghly lock gate status'}
            </p>
          </div>

          {/* Station Selection Dropdown & Manual Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <select
                id="station-selector"
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full sm:w-auto appearance-none bg-[#060e1d] border border-blue-900/40 text-xs font-semibold text-white rounded-xl pl-8 pr-8 py-2.5 hover:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#071124]">
                    {lang === 'bn' ? s.nameBn : s.name}
                  </option>
                ))}
              </select>
              <MapPin className="w-3.5 h-3.5 text-sky-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              id="refresh-weather-btn"
              onClick={fetchWeatherData}
              disabled={isLoading || isOffline}
              title={lang === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Weather'}
              className="p-2.5 bg-[#060e1d] hover:bg-[#0a162d] border border-blue-900/40 text-slate-200 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Selected Station Location Detail Bar */}
        <div className="mt-3 pt-3 border-t border-blue-900/30 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-medium text-slate-300">
              {lang === 'bn' ? selectedStation.descriptionBn : selectedStation.description}
            </span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              ({selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>
              {lastSyncedTime
                ? `${lang === 'bn' ? 'আপডেট:' : 'Updated:'} ${lastSyncedTime}`
                : weather.updatedAt}
            </span>
          </div>
        </div>

        {apiError && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/35 text-xs text-amber-200 flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{apiError}</span>
          </div>
        )}
      </div>

      {/* Main Real-Time Weather Condition Hero */}
      <div className="bg-gradient-to-br from-[#0a162d] via-[#0d1c3a] to-[#071124] border border-blue-900/35 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Temperature & Condition Visual */}
          <div className="lg:col-span-6 flex items-center gap-5">
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center shrink-0">
              {iconUrl ? (
                <img
                  src={iconUrl}
                  alt={weatherDesc}
                  className="w-14 h-14 sm:w-16 sm:h-16 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <CloudRain className="w-10 h-10 text-sky-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  {currentTemp}°C
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  {lang === 'bn' ? 'অনুভূত' : 'Feels like'} {feelsLike}°C
                </span>
              </div>

              <div className="text-base sm:text-lg font-bold text-sky-300">
                {weatherDesc}
              </div>

              {tempMax != null && tempMin != null && (
                <div className="text-xs text-slate-400 flex items-center gap-2 pt-0.5">
                  <span>H: {tempMax}°C</span>
                  <span>•</span>
                  <span>L: {tempMin}°C</span>
                  <span>•</span>
                  <span>{cloudCover}% {lang === 'bn' ? 'মেঘলা' : 'Cloud Cover'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Critical Weather Badges */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {/* Precipitation Chance */}
            <div className="bg-[#060e1d] border border-blue-900/35 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{lang === 'bn' ? 'বৃষ্টির সম্ভাবনা' : 'Rain Probability'}</span>
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-white">{precipProb}%</div>
              <div className="text-[10px] text-sky-300 font-semibold mt-0.5">
                {precipQpf > 0 ? `${precipQpf} mm expected` : 'Intermittent showers'}
              </div>
            </div>

            {/* Thunderstorm Risk */}
            <div className="bg-[#060e1d] border border-blue-900/35 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{lang === 'bn' ? 'বজ্রবিদ্যুৎ' : 'Thunderstorm'}</span>
                <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-amber-300">{tstormProb}%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {tstormProb > 50 ? (lang === 'bn' ? 'উচ্চ সম্ভাবনা' : 'High Alert') : (lang === 'bn' ? 'মাঝারি' : 'Moderate')}
              </div>
            </div>

            {/* Wind Gust */}
            <div className="bg-[#060e1d] border border-blue-900/35 rounded-xl p-3 col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{lang === 'bn' ? 'বাতাস' : 'Wind'}</span>
                <Wind className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <div className="text-xl font-bold text-white">
                {windSpeed} <span className="text-xs font-normal text-slate-400">km/h</span>
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {windDirection}{windGust ? ` (Gust ${windGust})` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Authoritative West Bengal I&WD / CWC River Gate & Hydrological Telemetry */}
      <RiverGateStatusSection 
        lang={lang} 
        telemetryData={riverGatesData}
        loading={riverGatesLoading}
        onRefresh={onRefreshRiverGates}
      />

      {/* Atmospheric Telemetry Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Rainfall Intensity */}
        <div className="bg-[#0a162d]/90 border border-blue-900/25 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t.weather.rainfallRate}</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {precipQpf > 0 ? precipQpf : weather.rainfallIntensityMmHr}{' '}
              <span className="text-xs font-normal text-slate-400">mm</span>
            </div>
            <div className="text-[11px] font-bold text-sky-300 mt-1 uppercase">
              {lang === 'bn' ? 'বর্ষণের তীব্রতা' : 'Precipitation Volume'}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="bg-[#0a162d]/90 border border-blue-900/25 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">{t.weather.humidity}</span>
            <Thermometer className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{humidity}%</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {humidity > 80 ? (lang === 'bn' ? 'উচ্চ আর্দ্রতা' : 'Saturated Air') : (lang === 'bn' ? 'স্বাভাবিক' : 'Moderate')}
            </div>
          </div>
        </div>

        {/* Air Pressure */}
        <div className="bg-[#0a162d]/90 border border-blue-900/25 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {lang === 'bn' ? 'বায়ুচাপ' : 'Pressure'}
            </span>
            <Gauge className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {airPressure} <span className="text-xs font-normal text-slate-400">hPa</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {airPressure < 1005 ? (lang === 'bn' ? 'নিম্নচাপ বলয়' : 'Depression Formed') : (lang === 'bn' ? 'স্বাভাবিক চাপ' : 'Normal Pressure')}
            </div>
          </div>
        </div>

        {/* Visibility */}
        <div className="bg-[#0a162d]/90 border border-blue-900/25 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {lang === 'bn' ? 'দৃশ্যমানতা' : 'Visibility'}
            </span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {visibilityKm} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {visibilityKm < 5 ? (lang === 'bn' ? 'বৃষ্টিতে দৃশ্যমানতা হ্রাস' : 'Reduced in Rain') : (lang === 'bn' ? 'পরিষ্কার' : 'Clear View')}
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Section: Hourly Timeline & 5-Day Outlook with Toggle */}
      <div className="bg-[#0a162d]/90 border border-blue-900/30 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t.weather.hourlyForecast}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-950 text-sky-300 border border-blue-800/40">
                Google Maps Weather
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'bn' 
                ? 'আগামী কয়েক ঘণ্টায় বৃষ্টিপাত, মেঘ ও তাপমাত্রার নির্ভুল পূর্বাভাস'
                : 'Hour-by-hour rain probability, precipitation QPF and 5-day meteorological outlook'}
            </p>
          </div>

          {/* Toggle Tab Buttons */}
          <div className="flex items-center bg-[#060e1d] p-1 rounded-xl border border-blue-900/40 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('hourly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'hourly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'bn' ? 'ঘণ্টাভিত্তিক' : 'Hourly Timeline'}
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {lang === 'bn' ? '৫ দিনের পূর্বাভাস' : '5-Day Outlook'}
            </button>
          </div>
        </div>

        {/* Tab 1: Hourly Forecast Timeline */}
        {activeTab === 'hourly' && (
          <div className="space-y-3">
            {gmpHours && gmpHours.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {gmpHours.slice(0, 10).map((hour, idx) => {
                  const hourDate = hour.displayDateTime
                    ? `${hour.displayDateTime.hours}:00`
                    : `+${idx + 1}h`;
                  const prob = hour.precipitation?.probability?.percent ?? 30;
                  const qpf = hour.precipitation?.qpf?.quantity ?? 0;
                  const temp = hour.temperature?.degrees != null ? Math.round(hour.temperature.degrees) : 28;
                  const isHighRain = prob >= 60;
                  const hourIcon = hour.weatherCondition?.iconBaseUri
                    ? `${hour.weatherCondition.iconBaseUri}.svg`
                    : null;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-2.5 text-center flex flex-col justify-between border transition-all ${
                        isHighRain
                          ? 'bg-amber-950/40 border-amber-600/40 hover:border-amber-500'
                          : 'bg-[#060e1d] border-blue-900/30 hover:border-blue-700/50'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-300">{hourDate}</div>
                      
                      <div className="my-2 flex flex-col items-center justify-center">
                        {hourIcon ? (
                          <img src={hourIcon} alt="weather" className="w-7 h-7 object-contain my-1" />
                        ) : (
                          <CloudRain className={`w-5 h-5 ${isHighRain ? 'text-amber-400' : 'text-sky-400'}`} />
                        )}
                        <span className="text-sm font-bold text-white">{temp}°C</span>
                      </div>

                      <div>
                        <div className={`text-[11px] font-bold ${isHighRain ? 'text-amber-300' : 'text-sky-300'}`}>
                          {prob}% rain
                        </div>
                        {qpf > 0 && (
                          <div className="text-[10px] text-slate-400">{qpf} mm</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback to default hourly structure if GMP hourly is loading or offline */
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {weather.forecastHourly.map((hour, idx) => {
                  const isHigh = hour.rainfallMm >= 40;
                  const barHeightPct = Math.min(100, Math.round((hour.rainfallMm / 60) * 100));
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl p-2.5 text-center flex flex-col justify-between border transition-all ${
                        isHigh
                          ? 'bg-amber-950/40 border-amber-600/40'
                          : 'bg-[#060e1d] border-blue-900/30'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-300">{hour.time}</div>
                      <div className="h-16 flex items-end justify-center py-2">
                        <div 
                          style={{ height: `${barHeightPct}%` }}
                          className={`w-4 rounded-t-sm transition-all ${
                            isHigh ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isHigh ? 'text-amber-300' : 'text-sky-300'}`}>
                          {hour.rainfallMm} mm
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {hour.prob}% rain
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 5-Day Daily Outlook from Google Maps Weather */}
        {activeTab === 'daily' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {gmpDays && gmpDays.length > 0 ? (
              gmpDays.map((day, idx) => {
                const dateLabel = day.displayDate
                  ? `${day.displayDate.day}/${day.displayDate.month}`
                  : `Day ${idx + 1}`;
                const maxT = day.maxTemperature?.degrees != null ? Math.round(day.maxTemperature.degrees) : 32;
                const minT = day.minTemperature?.degrees != null ? Math.round(day.minTemperature.degrees) : 26;
                const dayCond = day.daytimeForecast?.weatherCondition?.description?.text || 'Showers';
                const dayIcon = day.daytimeForecast?.weatherCondition?.iconBaseUri
                  ? `${day.daytimeForecast.weatherCondition.iconBaseUri}.svg`
                  : null;
                const rainPercent = day.daytimeForecast?.precipitation?.probability?.percent ?? 60;
                const rainQpf = day.daytimeForecast?.precipitation?.qpf?.quantity ?? 0;

                return (
                  <div
                    key={idx}
                    className="bg-[#060e1d] border border-blue-900/30 rounded-xl p-3 flex flex-col justify-between hover:border-blue-700/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          {idx === 0 ? (lang === 'bn' ? 'আজ' : 'Today') : dateLabel}
                        </span>
                        <span className="text-[11px] font-bold text-sky-300">
                          {rainPercent}% rain
                        </span>
                      </div>

                      <div className="flex items-center gap-3 my-2.5">
                        {dayIcon ? (
                          <img src={dayIcon} alt={dayCond} className="w-9 h-9 object-contain" />
                        ) : (
                          <CloudRain className="w-7 h-7 text-sky-400" />
                        )}
                        <div>
                          <div className="text-base font-bold text-white">
                            {maxT}° <span className="text-xs font-normal text-slate-400">/ {minT}°C</span>
                          </div>
                          <div className="text-xs text-slate-300 font-medium line-clamp-1">
                            {dayCond}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-900/30 text-[10px] text-slate-400 flex items-center justify-between">
                      {rainQpf > 0 ? (
                        <span>Rain: {rainQpf} mm</span>
                      ) : (
                        <span>Wind: {day.daytimeForecast?.wind?.speed?.value ? `${Math.round(day.daytimeForecast.wind.speed.value)} km/h` : '10 km/h'}</span>
                      )}
                      {day.sunEvents?.sunriseTime && (
                        <span className="flex items-center gap-0.5 text-amber-300">
                          <Sunrise className="w-2.5 h-2.5" />
                          {new Date(day.sunEvents.sunriseTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              [1, 2, 3, 4, 5].map((d) => (
                <div key={d} className="bg-[#060e1d] border border-blue-900/30 rounded-xl p-3">
                  <div className="text-xs font-bold text-white mb-2">Day +{d}</div>
                  <div className="text-base font-bold text-white">31°C / 26°C</div>
                  <div className="text-xs text-sky-300 mt-1">Thunderstorm & Rain</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Official Weather Attribution & Mandated Compliance Notices */}
      <div className="p-3.5 bg-[#060e1d]/80 border border-blue-900/25 rounded-xl space-y-1.5 text-center text-xs text-slate-400">
        <p className="font-medium text-slate-300">
          {t.weather.officialStation}
        </p>
        <p className="text-[11px] text-slate-500">
          Meteorological data powered by Google Maps Platform Weather API & Alipore Meteorological Centre Doppler Radar.
        </p>
        <div className="pt-0.5 text-[11px] font-semibold text-slate-400 tracking-wider">
          Google Maps
        </div>
      </div>
    </div>
  );
};
