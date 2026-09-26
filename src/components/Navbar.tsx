import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  Globe, 
  PhoneCall, 
  ShieldAlert, 
  Menu, 
  X,
  Droplets,
  MapPin,
  Mic,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import { WestBengalEmblem } from './WestBengalEmblem';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  onOpenSOS: () => void;
  onOpenHelplines: () => void;
  onOpenReport: () => void;
  onOpenVoiceAssistant?: () => void;
  userEmail?: string | null;
  userName?: string | null;
  userPhoto?: string | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  isOffline,
  setIsOffline,
  onOpenSOS,
  onOpenHelplines,
  onOpenReport,
  onOpenVoiceAssistant,
  userEmail,
  userName,
  userPhoto,
  onLogout
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

  const navItems = [
    { id: 'home', label: t.tabs.home },
    { id: 'map', label: t.tabs.map },
    { id: 'safeRoute', label: t.tabs.safeRoute },
    { id: 'weather', label: t.tabs.weather },
    { id: 'warnings', label: t.tabs.warnings },
    { id: 'offline', label: t.tabs.offline }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#071124]/95 backdrop-blur-md border-b border-blue-900/25 text-slate-100 shadow-sm shadow-slate-950/40">
      {/* Offline Status Warning Bar when offline is active */}
      {isOffline && (
        <div className="bg-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 text-center text-xs text-amber-200 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{t.offline.offlineActiveNotice}</span>
          <button 
            onClick={() => setIsOffline(false)}
            className="underline ml-2 hover:text-amber-100 font-semibold cursor-pointer"
          >
            {t.simOnlineBtn}
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand Logo & Government Endorsement */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div 
              onClick={() => { setCurrentTab('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-blue-600 to-sky-700 flex items-center justify-center shadow-md shadow-blue-950/40 group-hover:scale-105 transition-transform border border-blue-400/20">
                <Droplets className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1">
                    Kolkata <span className="text-sky-400 font-bold">JolSafety</span>
                  </span>
                  <span className="text-[10px] bg-blue-950/80 text-sky-300 font-semibold px-1.5 py-0.5 rounded border border-blue-800/40">
                    {lang === 'bn' ? 'কলকাতা' : 'WB'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden sm:block tracking-normal">
                  {lang === 'bn' ? 'নাগরিক জলমগ্নতা ও দুর্যোগ সহায়তা পোর্টাল' : 'Civic Waterlogging & Disaster Management'}
                </p>
              </div>
            </div>

            {/* Official Government of West Bengal Crest & Badge */}
            <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-blue-900/30 shrink-0">
              <WestBengalEmblem size="sm" lang={lang} />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold text-slate-200 tracking-wide">
                  {lang === 'bn' ? 'পশ্চিমবঙ্গ সরকার' : 'Govt. of West Bengal'}
                </span>
                <span className="text-[9px] text-slate-400">
                  {lang === 'bn' ? 'দুর্যোগ ব্যবস্থাপনা বিভাগ' : 'Disaster Management'}
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#09152b] p-1 rounded-xl border border-blue-900/30">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600/25 text-sky-200 border border-blue-500/30 shadow-sm shadow-blue-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right utility buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Report Button */}
            <button
              id="header-report-btn"
              onClick={onOpenReport}
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#0d1b34] hover:bg-[#122444] text-slate-200 border border-blue-900/35 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'bn' ? 'জল জমা রিপোর্ট' : lang === 'hi' ? 'जलभराव रिपोर्ट' : 'Report Water'}</span>
            </button>

            {/* Offline simulator toggle button */}
            <button
              id="header-offline-toggle"
              onClick={() => setIsOffline(!isOffline)}
              title={isOffline ? 'Currently Offline - Click to Go Online' : 'Currently Online - Click to Test Offline Mode'}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isOffline
                  ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                  : 'bg-emerald-950/30 text-emerald-300 border-emerald-600/30 hover:bg-emerald-900/40'
              }`}
            >
              {isOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.offlineBadge}</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.onlineBadge}</span>
                </>
              )}
            </button>

            {/* 3-Language Switcher (Bengali, Hindi, English) */}
            <div className="flex items-center rounded-lg bg-[#0a162d] p-0.5 border border-blue-900/35 text-[11px] font-bold">
              <button
                id="header-lang-bn"
                onClick={() => setLang('bn')}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${
                  lang === 'bn' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="বাংলা"
              >
                বাং
              </button>
              <button
                id="header-lang-hi"
                onClick={() => setLang('hi')}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${
                  lang === 'hi' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="हिन्दी"
              >
                हिं
              </button>
              <button
                id="header-lang-en"
                onClick={() => setLang('en')}
                className={`px-1.5 py-1 rounded transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Voice Assistant Trigger Button */}
            {onOpenVoiceAssistant && (
              <button
                id="header-voice-btn"
                onClick={onOpenVoiceAssistant}
                className="flex items-center gap-1.5 bg-[#0d1f3d] hover:bg-[#12284c] text-sky-300 hover:text-white border border-sky-800/40 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-blue-950/40"
                title={lang === 'bn' ? 'ভয়েস অ্যাসিস্ট্যান্ট' : lang === 'hi' ? 'आवाज़ सहायक' : 'Voice Assistant'}
              >
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">{lang === 'bn' ? 'ভয়েস' : lang === 'hi' ? 'आवाज़' : 'Voice'}</span>
              </button>
            )}

            {/* Quick Helplines button */}
            <button
              id="header-helplines-btn"
              onClick={onOpenHelplines}
              className="p-2 rounded-lg bg-[#0d1b34] hover:bg-[#122444] text-slate-200 border border-blue-900/35 cursor-pointer transition-colors"
              title="Kolkata Helplines (14420 / 100 / 1912)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            {/* Emergency SOS Button in header: STRICTLY RESERVED RED */}
            <button
              id="header-sos-btn"
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-md shadow-red-950/60 cursor-pointer transition-all active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS</span>
            </button>

            {/* Authenticated User / Logout (Desktop) */}
            {onLogout && (
              <button
                id="header-logout-btn"
                onClick={onLogout}
                title={userEmail ? `${userName || 'Citizen'} (${userEmail}) - Log out` : 'Log out'}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d1b34] hover:bg-[#122444] text-slate-300 hover:text-rose-400 border border-blue-900/35 text-xs font-semibold cursor-pointer transition-colors"
              >
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt={userName || 'User'} 
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span className="max-w-[90px] truncate">{userName || (userEmail ? userEmail.split('@')[0] : 'User')}</span>
                <LogOut className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              id="header-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-[#0d1b34] text-slate-300 hover:text-white border border-blue-900/35 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4 text-slate-200" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-blue-900/30 space-y-1">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${
                    active
                      ? 'bg-blue-600/25 text-sky-200 border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 border-t border-blue-900/30 flex flex-col gap-2">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#0a162d] rounded-lg border border-blue-900/30">
                <span className="text-xs text-slate-400 font-medium">Language / ভাষা / भाषा:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLang('bn')}
                    className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                  >
                    বাংলা
                  </button>
                  <button
                    onClick={() => setLang('hi')}
                    className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'hi' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                  >
                    हिन्दी
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-2 py-0.5 rounded text-xs font-bold ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-300'}`}
                  >
                    EN
                  </button>
                </div>
              </div>
              {onOpenVoiceAssistant && (
                <button
                  id="mobile-voice-btn"
                  onClick={() => { onOpenVoiceAssistant(); setMobileMenuOpen(false); }}
                  className="w-full py-2 px-3 bg-[#0d1f3d] text-sky-200 border border-sky-800/40 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Mic className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lang === 'bn' ? 'ভয়েস অ্যাসিস্ট্যান্ট' : lang === 'hi' ? 'আवाज़ सहायक' : 'Voice Assistant'}</span>
                </button>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { onOpenReport(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2 px-3 bg-[#0d1b34] text-slate-200 border border-blue-900/35 rounded-lg text-xs font-semibold text-center"
                >
                  {lang === 'bn' ? 'জল জমা রিপোর্ট দিন' : lang === 'hi' ? 'जलभराव रिपोर्ट करें' : 'Report Waterlogging'}
                </button>
                <button
                  onClick={() => { onOpenHelplines(); setMobileMenuOpen(false); }}
                  className="flex-1 py-2 px-3 bg-emerald-950/40 text-emerald-300 border border-emerald-600/35 rounded-lg text-xs font-semibold text-center"
                >
                  {lang === 'bn' ? 'জরুরি হেল্পলাইন' : lang === 'hi' ? 'आपातकालीन हेल्पलाइन' : 'Emergency Numbers'}
                </button>
              </div>

              {/* User profile / Logout (Mobile) */}
              {onLogout && (
                <div className="pt-2 border-t border-blue-900/30 flex items-center justify-between text-xs px-1">
                  <div className="flex items-center gap-2">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={userName || 'User'}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
                        <UserIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex flex-col text-left max-w-[170px]">
                      <span className="font-bold text-slate-200 truncate">{userName || 'Citizen'}</span>
                      <span className="text-[10px] text-slate-400 truncate">{userEmail || 'Google Verified'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                  </button>
                </div>
              )}

              {/* Government of West Bengal Official Public Safety Badge */}
              <div className="pt-2 border-t border-blue-900/30 flex items-center justify-center gap-2 text-center">
                <WestBengalEmblem size="xs" lang={lang} />
                <span className="text-[10px] font-semibold text-slate-400">
                  {lang === 'bn' 
                    ? 'পশ্চিমবঙ্গ সরকার • দুর্যোগ ব্যবস্থাপনা বিভাগ' 
                    : 'Government of West Bengal • Disaster Management'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
