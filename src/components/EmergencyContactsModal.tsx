import React from 'react';
import { X, PhoneCall, Shield, AlertTriangle, ExternalLink, LifeBuoy } from 'lucide-react';
import { EmergencyContact } from '../types';
import { Language } from '../data/translations';

interface EmergencyContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  contacts: EmergencyContact[];
}

export const EmergencyContactsModal: React.FC<EmergencyContactsModalProps> = ({
  isOpen,
  onClose,
  lang,
  contacts
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#081226] border border-blue-900/40 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl text-slate-100 my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-blue-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {lang === 'bn' ? 'কলকাতা সরকারি জরুরি হেল্পলাইন' : 'Official Kolkata Helplines'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'bn' ? '২৪/৭ দুর্যোগ মোকাবিলা ও উদ্ধারকারী নম্বর' : '24x7 Municipal & Disaster Response Numbers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-[#050a15] hover:bg-slate-800 border border-blue-900/30 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contacts List */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-[#050b17] border border-blue-900/30 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-blue-700/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {lang === 'bn' ? contact.nameBn : contact.name}
                  </h4>
                  {contact.isOfficial && (
                    <span className="text-[9px] uppercase font-bold bg-blue-950 text-blue-300 border border-blue-700/40 px-1.5 py-0.5 rounded">
                      Official
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {lang === 'bn' ? contact.descriptionBn : contact.description}
                </p>
              </div>

              <a
                href={`tel:${contact.phone}`}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{contact.phone}</span>
              </a>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-blue-900/30 text-center">
          <p className="text-[11px] text-slate-400">
            {lang === 'bn'
              ? 'বিদ্যুৎ সংক্রান্ত বিপদে অবিলম্বে সিইএসসি ১৯১২ নম্বরে যোগাযোগ করুন।'
              : 'For electric sparking in floodwaters, immediately alert CESC at 1912.'}
          </p>
        </div>
      </div>
    </div>
  );
};
