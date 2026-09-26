import React from 'react';
import { AlertOctagon, ShieldAlert, Zap, AlertTriangle, LifeBuoy } from 'lucide-react';
import { Language, TRANSLATIONS } from '../data/translations';
import { WestBengalEmblem } from './WestBengalEmblem';

interface SafetyDisclaimerProps {
  lang: Language;
}

export const SafetyDisclaimer: React.FC<SafetyDisclaimerProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="bg-[#0a162d]/90 border border-blue-900/35 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 text-slate-300">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            {t.safetyDisclaimer.title}
          </h3>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300 font-semibold tracking-wide">
          {lang === 'bn' ? 'নাগরিক সুরক্ষা নির্দেশিকা' : 'Public Safety Protocol'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
        <div className="p-3 bg-[#060c18] rounded-xl border border-blue-900/30 space-y-1">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'চলন্ত জলে প্রবেশ নিষিদ্ধ' : 'Moving Floodwater Hazard'}
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">{t.safetyDisclaimer.bullet1}</p>
        </div>

        <div className="p-3 bg-[#060c18] rounded-xl border border-blue-900/30 space-y-1">
          <span className="font-bold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'খোলা ম্যানহোল ও ড্রেন সতর্কতা' : 'Open Manholes & Gully Pits'}
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">{t.safetyDisclaimer.bullet2}</p>
        </div>

        <div className="p-3 bg-[#060c18] rounded-xl border border-blue-900/30 space-y-1">
          <span className="font-bold text-amber-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'বিদ্যুৎস্পৃষ্ট হওয়ার ঝুঁকি' : 'Electrocution Danger'}
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">{t.safetyDisclaimer.bullet3}</p>
        </div>

        <div className="p-3 bg-[#060c18] rounded-xl border border-blue-900/30 space-y-1">
          <span className="font-bold text-blue-400 flex items-center gap-1.5">
            <LifeBuoy className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'সরকারি সহায়তা সংযোগ' : 'Official Disaster Dispatch'}
          </span>
          <p className="text-slate-400 text-[11px] leading-relaxed">{t.safetyDisclaimer.bullet4}</p>
        </div>
      </div>

      {/* Official Government of West Bengal Public Service Accreditation Footer */}
      <div className="pt-3.5 border-t border-blue-900/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <WestBengalEmblem size="sm" lang={lang} />
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              {lang === 'bn' 
                ? 'পশ্চিমবঙ্গ সরকার • দুর্যোগ ব্যবস্থাপনা ও অসামরিক প্রতিরক্ষা বিভাগ' 
                : 'Government of West Bengal • Department of Disaster Management & Civil Defence'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'bn' 
                ? 'কলকাতা পৌরসংস্থা (কেএমসি) ও রাজ্য জরুরি অপারেশন সেন্টারের সমন্বয়ে নাগরিক সুরক্ষা পরিষেবা' 
                : 'Civic safety initiative in coordination with Kolkata Municipal Corporation (KMC) & SEOC'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 shrink-0">
          <span className="px-2.5 py-1 bg-[#060c18] rounded-lg border border-blue-900/40 text-slate-300">
            SEOC: <strong className="text-blue-400 font-bold">1070</strong>
          </span>
          <span className="px-2.5 py-1 bg-[#060c18] rounded-lg border border-blue-900/40 text-slate-300">
            KMC Control: <strong className="text-emerald-400 font-bold">14420</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
