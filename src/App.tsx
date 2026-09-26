import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './components/HomeScreen';
import { LiveMap } from './components/LiveMap';
import { WeatherDashboard } from './components/WeatherDashboard';
import { EarlyWarningSystem } from './components/EarlyWarningSystem';
import { SafeRouteFinder } from './components/SafeRouteFinder';
import { OfflineMapManager } from './components/OfflineMapManager';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { EmergencyContactsModal } from './components/EmergencyContactsModal';
import { ReportWaterloggingModal } from './components/ReportWaterloggingModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { SafetyDisclaimer } from './components/SafetyDisclaimer';
import { StartupLoadingScreen } from './components/StartupLoadingScreen';
import { AuthScreen } from './components/AuthScreen';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Mic, Sparkles } from 'lucide-react';
import { 
  getStoredIncidents, 
  saveIncident, 
  confirmIncident, 
  getStoredOfflineZones, 
  toggleZoneDownload, 
  downloadAllZones,
  getStoredContacts,
  addCustomEmergencyContact,
  deleteCustomEmergencyContact,
  getSimulatedOffline,
  setSimulatedOffline,
  getSafeLocations
} from './utils/storage';
import { INITIAL_WEATHER, INITIAL_WARNINGS } from './data/kolkataData';
import { Language, TRANSLATIONS } from './data/translations';
import { WaterloggingIncident, SafeLocation, WeatherData, RiverGateSystemData } from './types';
import { reverseGeocodeWithGoogle, fetchRealLocationWeather } from './utils/gmpWeatherApi';
import { fetchAuthoritativeRiverGateTelemetry } from './utils/riverGateService';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCYGbcTomyXB1TaNYCYe1RXbj73uez4MUY';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isLoadingScreenVisible, setIsLoadingScreenVisible] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('jol_user_name') || '');
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [isOffline, setIsOfflineState] = useState<boolean>(() => {
    return !navigator.onLine || getSimulatedOffline();
  });

  // Maintain persistent Firebase Authentication session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.displayName) {
        setUserName(user.displayName);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // State collections
  const [incidents, setIncidents] = useState<WaterloggingIncident[]>(getStoredIncidents);
  const [safeLocations] = useState<SafeLocation[]>(getSafeLocations);
  const [weather, setWeather] = useState<WeatherData>(INITIAL_WEATHER);
  const [warnings] = useState(INITIAL_WARNINGS);
  const [offlineZones, setOfflineZones] = useState(getStoredOfflineZones);
  const [emergencyContacts, setEmergencyContacts] = useState(getStoredContacts);

  // User location: defaults to Kolkata Sector V IT Hub until GPS locks
  const [userLocation, setUserLocation] = useState({
    lat: 22.5735,
    lng: 88.4331,
    areaName: 'Sector V, Salt Lake IT Hub, Kolkata',
    areaNameBn: 'সেক্টর ফাইভ, সল্টলেক আইটি হাব, কলকাতা'
  });

  // Hooghly / Bhagirathi-Hooghly River Gates & Hydrological Telemetry State
  const [riverGatesData, setRiverGatesData] = useState<RiverGateSystemData | null>(null);
  const [riverGatesLoading, setRiverGatesLoading] = useState<boolean>(false);
  const [riverGatesError, setRiverGatesError] = useState<string | null>(null);

  /**
   * Real-time fetch function in the App component that calls an authoritative data source
   * for the Hooghly / Bhagirathi-Hooghly river gates status (such as West Bengal I&WD, CWC, or relevant telemetry API).
   *
   * If an official live API stream is available, parses gate positions.
   * If no public live API is available from the government department, it queries verified river gauges
   * and sets gate status to 'STATUS_UNAVAILABLE' ("Live gate status unavailable") instead of using simulated data.
   */
  const fetchRiverGatesTelemetry = useCallback(async (showSpinner: boolean = false) => {
    if (showSpinner) {
      setRiverGatesLoading(true);
    }
    setRiverGatesError(null);
    try {
      const data = await fetchAuthoritativeRiverGateTelemetry();
      setRiverGatesData(data);
    } catch (err: any) {
      console.warn('Real-time river gate telemetry query notification:', err);
      setRiverGatesError(err?.message || 'Failed to query river gate telemetry');
    } finally {
      if (showSpinner) {
        setRiverGatesLoading(false);
      }
    }
  }, []);

  // Periodic 60-second polling to dynamically update status in real time
  useEffect(() => {
    fetchRiverGatesTelemetry(true);
    const interval = setInterval(() => {
      fetchRiverGatesTelemetry(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchRiverGatesTelemetry]);

  // Modals state
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isHelplinesOpen, setIsHelplinesOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [reportCoords, setReportCoords] = useState<[number, number] | undefined>(undefined);
  const [selectedIncidentForMap, setSelectedIncidentForMap] = useState<WaterloggingIncident | null>(null);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      if (!getSimulatedOffline()) {
        setIsOfflineState(false);
      }
    };
    const handleOffline = () => {
      setIsOfflineState(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync real Google Maps Platform Weather API telemetry for coordinates
  const syncWeatherForCoords = async (lat: number, lng: number, name?: string) => {
    try {
      const realData = await fetchRealLocationWeather(lat, lng, GOOGLE_MAPS_API_KEY, name || 'Detected Location');
      setWeather(realData);
    } catch (err) {
      console.warn('Google Maps Weather sync warning:', err);
    }
  };

  // Immediate GPS Acquisition & Live Weather Synchronization
  const acquireGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          // First update coordinates immediately
          setUserLocation((prev) => ({
            ...prev,
            lat,
            lng,
            areaName: `Locating (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)...`,
            areaNameBn: `শনাক্ত হচ্ছে (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)...`
          }));

          // Reverse geocode with Google Maps Geocoding API
          try {
            const geocoded = await reverseGeocodeWithGoogle(lat, lng, GOOGLE_MAPS_API_KEY);
            setUserLocation({
              lat,
              lng,
              areaName: geocoded.areaName,
              areaNameBn: geocoded.areaNameBn
            });
            await syncWeatherForCoords(lat, lng, geocoded.areaName);
          } catch {
            const fallbackName = `GPS Location (${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E)`;
            setUserLocation({
              lat,
              lng,
              areaName: fallbackName,
              areaNameBn: fallbackName
            });
            await syncWeatherForCoords(lat, lng, fallbackName);
          }
        },
        async (err) => {
          console.log('GPS prompt status or error:', err.message);
          // If browser denies geolocation or times out, sync weather for current default location
          await syncWeatherForCoords(userLocation.lat, userLocation.lng, userLocation.areaName);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      syncWeatherForCoords(userLocation.lat, userLocation.lng, userLocation.areaName);
    }
  };

  // Run automatically at once when app loads
  useEffect(() => {
    acquireGPS();
  }, []);

  const handleSetOffline = (offline: boolean) => {
    setIsOfflineState(offline);
    setSimulatedOffline(offline);
  };

  // Cycles through prominent Kolkata nodes: Sector V -> Gariahat -> Jadavpur -> Central
  const toggleSimulatedKolkataZone = () => {
    const spots = [
      { lat: 22.5735, lng: 88.4331, name: 'Sector V, Salt Lake IT Hub', nameBn: 'সেক্টর ফাইভ, সল্টলেক আইটি হাব' },
      { lat: 22.5195, lng: 88.3664, name: 'Gariahat Crossing, South Kolkata', nameBn: 'গড়িয়াহাট ক্রসিং, দক্ষিণ কলকাতা' },
      { lat: 22.4988, lng: 88.3718, name: 'Jadavpur 8B / University Gate', nameBn: 'যাদবপুর ৮বি / বিশ্ববিদ্যালয় গেট' },
      { lat: 22.5815, lng: 88.3621, name: 'Thanthania / Central Avenue', nameBn: 'ঠনঠনিয়া / সেন্ট্রাল এভিনিউ' }
    ];

    const currentIdx = spots.findIndex(s => Math.abs(s.lat - userLocation.lat) < 0.005);
    const nextSpot = spots[(currentIdx + 1) % spots.length];
    setUserLocation({
      lat: nextSpot.lat,
      lng: nextSpot.lng,
      areaName: nextSpot.name,
      areaNameBn: nextSpot.nameBn
    });
  };

  // Upvote / Confirm Incident
  const handleConfirmIncident = (id: string) => {
    const res = confirmIncident(id);
    setIncidents(res.incidents);
  };

  // Submit User Report
  const handleSubmitReport = (newInc: WaterloggingIncident) => {
    const updated = saveIncident(newInc);
    setIncidents(updated);
    setSelectedIncidentForMap(newInc);
  };

  // Offline Zones Toggle
  const handleToggleZoneDownload = (zoneId: string) => {
    const updated = toggleZoneDownload(zoneId);
    setOfflineZones(updated);
  };

  const handleDownloadAllZones = () => {
    const updated = downloadAllZones();
    setOfflineZones(updated);
  };

  // Contacts
  const handleAddContact = (name: string, phone: string) => {
    const updated = addCustomEmergencyContact(name, phone);
    setEmergencyContacts(updated);
  };

  const handleDeleteContact = (id: string) => {
    const updated = deleteCustomEmergencyContact(id);
    setEmergencyContacts(updated);
  };

  // Navigation callbacks
  const handleSelectIncidentOnMap = (incident: WaterloggingIncident) => {
    setSelectedIncidentForMap(incident);
    setCurrentTab('map');
  };

  const handleNavigateAvoidIncident = (incident: WaterloggingIncident) => {
    setCurrentTab('safeRoute');
  };

  const handleOpenReportAtLocation = (coords: [number, number]) => {
    setReportCoords(coords);
    setIsReportModalOpen(true);
  };

  const handleFocusMapLocation = (coords: [number, number]) => {
    setCurrentTab('map');
  };

  return (
    <div className="min-h-screen bg-[#040914] text-slate-100 flex flex-col relative selection:bg-sky-500 selection:text-white font-sans antialiased civic-ambient-bg">
      {/* Subtle Government Atmosphere Ambient Orbs & Civic Dot Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl ambient-light-orb" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 bg-sky-600/08 rounded-full blur-3xl ambient-light-orb" style={{ animationDelay: '-6s' }} />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-slate-800/20 rounded-full blur-3xl ambient-light-orb" style={{ animationDelay: '-11s' }} />
        <div className="absolute inset-0 civic-dot-grid opacity-35" />
      </div>
      {/* Polished Startup / Loading Screen with Official West Bengal Government Branding */}
      {isLoadingScreenVisible && (
        <StartupLoadingScreen
          lang={lang}
          onComplete={() => setIsLoadingScreenVisible(false)}
        />
      )}

      {/* Firebase Google Authentication Flow */}
      {!isLoadingScreenVisible && authChecked && !currentUser && (
        <AuthScreen
          lang={lang}
          onAuthenticated={(user) => {
            setCurrentUser(user);
            if (user.displayName) {
              setUserName(user.displayName);
            }
          }}
        />
      )}

      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        lang={lang}
        setLang={setLang}
        isOffline={isOffline}
        setIsOffline={handleSetOffline}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenHelplines={() => setIsHelplinesOpen(true)}
        onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
        userEmail={currentUser?.email}
        userName={userName || currentUser?.displayName}
        userPhoto={currentUser?.photoURL}
        onLogout={handleLogout}
        onOpenReport={() => {
          setReportCoords(undefined);
          setIsReportModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-6 relative z-10">
        {currentTab === 'home' && (
          <HomeScreen
            lang={lang}
            userLocation={userLocation}
            weather={weather}
            warnings={warnings}
            incidents={incidents}
            isOffline={isOffline}
            onNavigateTab={setCurrentTab}
            onOpenSOS={() => setIsSOSOpen(true)}
            onOpenReport={() => {
              setReportCoords(undefined);
              setIsReportModalOpen(true);
            }}
            onOpenHelplines={() => setIsHelplinesOpen(true)}
            onSelectIncidentOnMap={handleSelectIncidentOnMap}
            onRefreshGPS={acquireGPS}
            riverGatesData={riverGatesData}
            riverGatesLoading={riverGatesLoading}
            onRefreshRiverGates={() => fetchRiverGatesTelemetry(true)}
          />
        )}

        {currentTab === 'map' && (
          <LiveMap
            lang={lang}
            incidents={incidents}
            safeLocations={safeLocations}
            userLocation={userLocation}
            isOffline={isOffline}
            selectedIncident={selectedIncidentForMap}
            onConfirmIncident={handleConfirmIncident}
            onOpenReportAtLocation={handleOpenReportAtLocation}
            onNavigateAvoidIncident={handleNavigateAvoidIncident}
          />
        )}

        {currentTab === 'safeRoute' && (
          <SafeRouteFinder
            lang={lang}
            safeLocations={safeLocations}
            onFocusMapLocation={handleFocusMapLocation}
            userLocation={userLocation}
            incidents={incidents}
            warnings={warnings}
            isOffline={isOffline}
          />
        )}

        {currentTab === 'weather' && (
          <WeatherDashboard
            weather={weather}
            lang={lang}
            isOffline={isOffline}
            userLocation={userLocation}
            riverGatesData={riverGatesData}
            riverGatesLoading={riverGatesLoading}
            onRefreshRiverGates={() => fetchRiverGatesTelemetry(true)}
          />
        )}

        {currentTab === 'warnings' && (
          <EarlyWarningSystem
            warnings={warnings}
            incidents={incidents}
            lang={lang}
            onNavigateTab={setCurrentTab}
            onSelectIncident={handleSelectIncidentOnMap}
            userLocation={userLocation}
            isOffline={isOffline}
          />
        )}

        {currentTab === 'offline' && (
          <OfflineMapManager
            zones={offlineZones}
            isOffline={isOffline}
            setIsOffline={handleSetOffline}
            onToggleDownloadZone={handleToggleZoneDownload}
            onDownloadAllZones={handleDownloadAllZones}
            lang={lang}
          />
        )}

        {/* Global Public Safety Disclaimer Card */}
        <div className="mt-8 mb-6">
          <SafetyDisclaimer lang={lang} />
        </div>
      </main>

      {/* Floating Global Voice Assistant Button (Desktop & Tablet) */}
      <button
        id="floating-voice-assistant-btn"
        onClick={() => setIsVoiceAssistantOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 group flex items-center gap-2.5 bg-[#0a1730]/95 hover:bg-[#0f2246] text-white p-3 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-slate-950/80 border border-sky-500/35 hover:border-sky-400/60 backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
        title={lang === 'bn' ? 'ভয়েস অ্যাসিস্ট্যান্ট খুলুন' : lang === 'hi' ? 'आवाज़ सहायक खोलें' : 'Open Voice Assistant'}
      >
        <span className="relative flex items-center justify-center">
          <Mic className="relative w-4 h-4 text-sky-400" />
        </span>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold tracking-tight leading-none flex items-center gap-1 text-slate-100">
            <span>{lang === 'bn' ? 'ভয়েস সহায়তা' : lang === 'hi' ? 'आवाज़ सहायता' : 'Voice Assistant'}</span>
            <Sparkles className="w-3 h-3 text-sky-400" />
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {lang === 'bn' ? 'বাংলা, हिन्दी ও English' : lang === 'hi' ? 'हिंदी, বাংলা और English' : 'Bengali, Hindi & English'}
          </span>
        </div>
      </button>

      {/* Floating Bottom Quick SOS Bar on Mobile */}
      <div className="sm:hidden sticky bottom-0 z-30 bg-[#071124]/95 border-t border-blue-900/30 p-2.5 backdrop-blur-md flex items-center justify-between gap-2 shadow-2xl">
        <button
          onClick={() => setIsSOSOpen(true)}
          className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/60 transition-transform active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          <span>{lang === 'bn' ? 'জরুরি এসওএস' : lang === 'hi' ? 'आपातकालीन एसओएस' : 'EMERGENCY SOS'}</span>
        </button>

        <button
          onClick={() => setIsVoiceAssistantOpen(true)}
          className="py-2.5 px-2.5 bg-[#0d1f3d] hover:bg-[#12284c] text-sky-300 font-bold rounded-xl text-xs border border-sky-800/40 flex items-center gap-1"
          title="Voice Assistant"
        >
          <Mic className="w-3.5 h-3.5 text-sky-400" />
          <span>{lang === 'bn' ? 'ভয়েস' : lang === 'hi' ? 'आवाज़' : 'Voice'}</span>
        </button>

        <button
          onClick={() => {
            setReportCoords(undefined);
            setIsReportModalOpen(true);
          }}
          className="py-2.5 px-2.5 bg-[#0d1b34] hover:bg-[#122444] text-slate-200 font-bold rounded-xl text-xs border border-blue-900/35 whitespace-nowrap"
        >
          {lang === 'bn' ? 'রিপোর্ট' : lang === 'hi' ? 'रिपोर्ट' : 'Report'}
        </button>

        <button
          onClick={() => setIsHelplinesOpen(true)}
          className="py-2.5 px-2.5 bg-emerald-950/40 text-emerald-300 font-bold rounded-xl text-xs border border-emerald-600/35 whitespace-nowrap"
        >
          14420
        </button>
      </div>

      {/* Modals */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        lang={lang}
        incidents={incidents}
        weather={weather}
        riverGates={riverGatesData}
        emergencyContacts={emergencyContacts}
        userLocation={userLocation}
        onNavigateTab={setCurrentTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenHelplines={() => setIsHelplinesOpen(true)}
        onOpenReport={() => {
          setReportCoords(undefined);
          setIsReportModalOpen(true);
        }}
      />

      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
        lang={lang}
        userLocation={userLocation}
        emergencyContacts={emergencyContacts}
        onAddContact={handleAddContact}
        onDeleteContact={handleDeleteContact}
      />

      <EmergencyContactsModal
        isOpen={isHelplinesOpen}
        onClose={() => setIsHelplinesOpen(false)}
        lang={lang}
        contacts={emergencyContacts}
      />

      <ReportWaterloggingModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportCoords(undefined);
        }}
        lang={lang}
        initialCoords={reportCoords}
        userLocation={userLocation}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}
