import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  PhoneCall, 
  Share2, 
  Volume2, 
  VolumeX, 
  X, 
  AlertOctagon, 
  Send, 
  CheckCircle, 
  UserPlus, 
  Trash2,
  ExternalLink
} from 'lucide-react';
import { EmergencyContact } from '../types';
import { Language, TRANSLATIONS } from '../data/translations';
import { emergencyBeacon } from '../utils/audio';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userLocation: { lat: number; lng: number; areaName: string; areaNameBn: string };
  emergencyContacts: EmergencyContact[];
  onAddContact: (name: string, phone: string) => void;
  onDeleteContact: (id: string) => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  lang,
  userLocation,
  emergencyContacts,
  onAddContact,
  onDeleteContact
}) => {
  const t = TRANSLATIONS[lang];
  const [countdown, setCountdown] = useState<number | null>(3);
  const [sosActivated, setSosActivated] = useState<boolean>(false);
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [trappedDetail, setTrappedDetail] = useState<string>('trapped_water'); // 'trapped_water' | 'stalled_car' | 'medical_hazard' | 'electric_wire'

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Countdown timer on initial open to prevent accidental trigger
  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setSosActivated(false);
      emergencyBeacon.stop();
      setIsSirenActive(false);
      return;
    }

    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setSosActivated(true);
      setCountdown(null);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  const toggleSiren = () => {
    if (isSirenActive) {
      emergencyBeacon.stop();
      setIsSirenActive(false);
    } else {
      emergencyBeacon.start();
      setIsSirenActive(true);
    }
  };

  const cancelSOS = () => {
    emergencyBeacon.stop();
    setIsSirenActive(false);
    onClose();
  };

  const mapsUrl = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
  
  const getSosMessage = () => {
    const area = lang === 'bn' ? userLocation.areaNameBn : userLocation.areaName;
    if (lang === 'bn') {
      return `🚨 জরুরি এসওএস অ্যালার্ট (কলকাতা জলমগ্নতা) 🚨\nআমি প্রবল বর্ষা ও জলমগ্নতায় বিপদে পড়েছি!\nঅবস্থান: ${area}\nজিপিএস: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}\nম্যাপ লিংক: ${mapsUrl}\nসময়: ${currentTime}\nদয়া করে উদ্ধারকাজে সাহায্য করুন বা পুলিশ/কেএমসি-কে জানান!`;
    }
    return `🚨 EMERGENCY SOS ALERT (Kolkata Flood) 🚨\nI am stranded in severe waterlogging and require immediate assistance!\nLocation: ${area}\nCoordinates: ${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)}\nMaps Link: ${mapsUrl}\nTime: ${currentTime}\nPlease dispatch rescue or alert Kolkata Police / KMC control room!`;
  };

  const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(getSosMessage())}`;
  const smsLink = `sms:?body=${encodeURIComponent(getSosMessage())}`;

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    onAddContact(newContactName.trim(), newContactPhone.trim());
    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#081226] border border-rose-500/60 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-blue-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {t.sos.title}
              </h3>
              <p className="text-[11px] text-rose-300">
                {lang === 'bn' ? 'কলকাতা জরুরি উদ্ধার ও বিপদ সংকেত' : 'Kolkata Monsoon Rapid Distress Beacon'}
              </p>
            </div>
          </div>
          <button
            onClick={cancelSOS}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#050a15] hover:bg-slate-800 border border-blue-900/30 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Accidental Trigger Guard / Countdown */}
        {countdown !== null && countdown > 0 ? (
          <div className="text-center py-6 sm:py-7 space-y-4 bg-rose-950/30 border border-rose-500/30 rounded-xl p-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-600/30 border-2 border-rose-500 text-2xl font-black text-white">
              {countdown}
            </div>
            <p className="text-sm font-bold text-rose-200">
              {t.sos.confirmCountdown} {countdown} {t.sos.seconds}
            </p>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              {lang === 'bn' 
                ? 'ভুলবশত চাপ লেগে থাকলে বাতিল বাটনে চাপুন। ৩ সেকেন্ড পর সতর্কবার্তা পাঠানো শুরু হবে।'
                : 'Safety guard: If activated by accident, click Cancel now to prevent false emergency dispatch.'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={cancelSOS}
                className="px-4 py-2 rounded-lg bg-[#050a15] hover:bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer border border-blue-900/40 transition-colors"
              >
                {t.sos.cancelSos}
              </button>
              <button
                onClick={() => {
                  setCountdown(null);
                  setSosActivated(true);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
              >
                {t.sos.immediateTransmit}
              </button>
            </div>
          </div>
        ) : (
          /* 2. SOS Activated Screen */
          <div className="space-y-3.5">
            {/* Location & GPS readout */}
            <div className="bg-[#050b17] border border-rose-500/35 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400 flex items-center gap-1">
                  <AlertOctagon className="w-4 h-4" />
                  <span>{t.sos.sosTransmittedTitle}</span>
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  <span>{currentTime}</span>
                </span>
              </div>

              <div className="pt-2 border-t border-blue-900/30 text-xs space-y-1">
                <p className="flex items-center gap-1.5 text-white font-bold">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{lang === 'bn' ? userLocation.areaNameBn : userLocation.areaName}</span>
                </p>
                <p className="font-mono text-[11px] text-slate-400 pl-5">
                  GPS: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)} (Accurate ~5m)
                </p>
              </div>
            </div>

            {/* Distress Audio Siren Toggle */}
            <div className="bg-[#050b17] border border-blue-900/30 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isSirenActive ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {isSirenActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    {isSirenActive ? t.sos.sirenOn : t.sos.sirenOff}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {lang === 'bn' ? 'বৃষ্টির শব্দে উদ্ধারের জন্য তীব্র হুইসেল বাজবে' : 'Loud repeating whistle for night search'}
                  </div>
                </div>
              </div>

              <button
                onClick={toggleSiren}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isSirenActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                    : 'bg-[#0a162d] hover:bg-slate-800 text-slate-200 border border-blue-900/40'
                }`}
              >
                {isSirenActive ? (lang === 'bn' ? 'বন্ধ করুন' : 'Mute') : (lang === 'bn' ? 'চালু করুন' : 'Start')}
              </button>
            </div>

            {/* Instant Broadcast Buttons (WhatsApp & SMS) */}
            <div className="space-y-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>{t.sos.whatsappShare}</span>
              </a>

              <a
                href={smsLink}
                className="w-full py-2 px-4 bg-[#050b17] hover:bg-slate-800 border border-blue-900/40 text-slate-200 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>{t.sos.smsShare}</span>
              </a>
            </div>

            {/* Kolkata Official Emergency Speed Dials */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                {lang === 'bn' ? 'সরাসরি সরকারি জরুরি হেল্পলাইন' : 'Direct Kolkata Emergency Dispatchers'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:100"
                  className="p-2.5 rounded-xl bg-[#050b17] hover:bg-slate-800 border border-blue-900/30 flex items-center gap-2 text-xs font-bold text-white transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <div>{lang === 'bn' ? 'পুলিশ কন্ট্রোল' : 'Police'}</div>
                    <span className="text-[10px] text-slate-400">100</span>
                  </div>
                </a>

                <a
                  href="tel:14420"
                  className="p-2.5 rounded-xl bg-[#050b17] hover:bg-slate-800 border border-blue-900/30 flex items-center gap-2 text-xs font-bold text-white transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div>{lang === 'bn' ? 'কেএমসি ড্রেনেজ' : 'KMC Drainage'}</div>
                    <span className="text-[10px] text-slate-400">14420</span>
                  </div>
                </a>

                <a
                  href="tel:1912"
                  className="p-2.5 rounded-xl bg-[#050b17] hover:bg-slate-800 border border-blue-900/30 flex items-center gap-2 text-xs font-bold text-white transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div>{lang === 'bn' ? 'সিইএসসি বিদ্যুৎ' : 'CESC Power'}</div>
                    <span className="text-[10px] text-slate-400">1912</span>
                  </div>
                </a>

                <a
                  href="tel:101"
                  className="p-2.5 rounded-xl bg-[#050b17] hover:bg-slate-800 border border-blue-900/30 flex items-center gap-2 text-xs font-bold text-white transition-colors"
                >
                  <PhoneCall className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div>{lang === 'bn' ? 'দমকল ও উদ্ধার' : 'Fire Rescue'}</div>
                    <span className="text-[10px] text-slate-400">101</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Custom Emergency Contacts Section */}
            <div className="pt-2 border-t border-blue-900/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'bn' ? 'সংরক্ষিত ব্যক্তিগত পরিচিতি' : 'Custom Contacts'}
                </span>
                <button
                  onClick={() => setShowAddContact(!showAddContact)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddContact ? (lang === 'bn' ? 'বন্ধ করুন' : 'Close') : (lang === 'bn' ? 'পরিচিতি যোগ' : 'Add Contact')}</span>
                </button>
              </div>

              {/* Add form */}
              {showAddContact && (
                <form onSubmit={handleCreateContact} className="p-3 bg-[#050b17] border border-blue-900/30 rounded-xl space-y-2 mb-2">
                  <input
                    type="text"
                    placeholder={t.sos.contactNamePlaceholder}
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#081226] border border-blue-900/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t.sos.contactPhonePlaceholder}
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#081226] border border-blue-900/40 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {lang === 'bn' ? 'পরিচিতি সেভ করুন' : 'Save Emergency Contact'}
                  </button>
                </form>
              )}

              {/* Custom Contacts list */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {emergencyContacts
                  .filter((c) => !c.isOfficial)
                  .map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#050b17] border border-blue-900/25 text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{contact.name}</div>
                        <a href={`tel:${contact.phone}`} className="text-blue-400 text-[11px] hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-600/40 hover:bg-emerald-600 hover:text-white"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => onDeleteContact(contact.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Cancel Button */}
            <div className="pt-2 text-center">
              <button
                onClick={cancelSOS}
                className="w-full py-2 rounded-lg bg-[#050b17] hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-blue-900/35 cursor-pointer transition-colors"
              >
                {t.sos.cancelSos}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
