import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Droplets, ShieldCheck, Waves, Radio } from 'lucide-react';
import { WestBengalEmblem } from './WestBengalEmblem';
import { Language } from '../data/translations';

interface StartupLoadingScreenProps {
  onComplete: () => void;
  lang?: Language;
}

export const StartupLoadingScreen: React.FC<StartupLoadingScreenProps> = ({
  onComplete,
  lang = 'en'
}) => {
  const [progress, setProgress] = useState(0);
  const [statusMessageIndex, setStatusMessageIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const statusMessages = [
    {
      en: 'Initializing Kolkata Hydrological & Flood Telemetry...',
      bn: 'কলকাতা হাইড্রোলজিক্যাল ও জলমগ্নতা সার্ভার সক্রিয় হচ্ছে...'
    },
    {
      en: 'Syncing Hooghly River Gate Gauges & Drainage Status...',
      bn: 'গঙ্গার লকগেট ও নিকাশি পাম্পিং ডেটা সংযোগ হচ্ছে...'
    },
    {
      en: 'Loading Civic Safe Routes & Live Alert Grid...',
      bn: 'জরুরি নিরাপদ পথ ও সতর্কবার্তা গ্রিড সিঙ্ক সম্পন্ন...'
    },
    {
      en: 'System Ready • Kolkata JolSafety Active',
      bn: 'ব্যবস্থা প্রস্তুত • কলকাতা জলসেফটি সক্রিয়'
    }
  ];

  useEffect(() => {
    // Smooth progress increment
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const increment = prev < 50 ? 8 : prev < 85 ? 6 : 4;
        return Math.min(prev + increment, 100);
      });
    }, 110);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 35) {
      setStatusMessageIndex(0);
    } else if (progress < 70) {
      setStatusMessageIndex(1);
    } else if (progress < 95) {
      setStatusMessageIndex(2);
    } else {
      setStatusMessageIndex(3);
    }
  }, [progress]);

  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      // Graceful delay on completion before fading out
      const timer = setTimeout(() => {
        setIsExiting(true);
        const exitTimer = setTimeout(() => {
          onComplete();
        }, 550);
        return () => clearTimeout(exitTimer);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [progress, isExiting, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="startup-loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-slate-950 text-slate-100 select-none overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 30%, #0d1b2e 0%, #030712 100%)'
          }}
        >
          {/* Subtle Ambient Water Ripple Animations in Background */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
            {/* Concentric Sonar Flood Rings */}
            {[1, 2, 3].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.6, opacity: 0.35 }}
                animate={{ 
                  scale: [0.8, 1.8, 2.8],
                  opacity: [0.35, 0.15, 0]
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  delay: ring * 1.3,
                  ease: 'easeOut'
                }}
                className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-sky-500/20"
              />
            ))}

            {/* Ambient Deep-Sea Glow */}
            <div className="absolute w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] bg-sky-600/08 rounded-full blur-3xl pointer-events-none translate-y-24" />
          </div>

          {/* Top Section: Official Government of West Bengal Provenance */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full pt-8 sm:pt-10 px-4 flex flex-col items-center text-center z-10"
          >
            {/* Government Emblem and Bilingual Header */}
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#0a162d]/90 border border-blue-900/40 shadow-xl backdrop-blur-md">
              <WestBengalEmblem size="sm" lang={lang} />
              <div className="flex flex-col text-left">
                <span className="text-[11px] sm:text-xs font-bold tracking-wider text-slate-100 uppercase">
                  {lang === 'bn' ? 'পশ্চিমবঙ্গ সরকার' : 'Government of West Bengal'}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">
                  {lang === 'bn' 
                    ? 'দুর্যোগ ব্যবস্থাপনা বিভাগ ও কলকাতা পৌরসংস্থা' 
                    : 'Disaster Management & Civil Defence • KMC'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Center Section: JolSafety Brand, Water Animation & Emergency Badge */}
          <div className="flex flex-col items-center text-center px-4 max-w-md z-10 -mt-6 sm:-mt-8">
            {/* JolSafety Icon with Water Droplet */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2, type: 'spring', stiffness: 200 }}
              className="relative mb-5"
            >
              {/* Outer pulsing ring */}
              <div className="absolute -inset-3 rounded-2xl bg-blue-600/20 blur-md" />
              
              {/* Central Badge */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-700 p-[1px] shadow-2xl shadow-blue-950/80 border border-blue-400/30">
                <div className="w-full h-full bg-[#081326] rounded-[15px] flex items-center justify-center backdrop-blur-sm">
                  <Droplets className="w-10 h-10 sm:w-11 sm:h-11 text-sky-400" />
                </div>
              </div>

              {/* Live Signal Indicator Pill */}
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md bg-[#071124] border border-emerald-500/40 flex items-center gap-1 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">LIVE</span>
              </div>
            </motion.div>

            {/* JolSafety App Titles with Visual Hierarchy */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-1"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
                <span>Kolkata</span>
                <span className="text-sky-400 font-extrabold">
                  JolSafety
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-300">
                {lang === 'bn' 
                  ? 'কলকাতা বর্ষাকালীন জলমগ্নতা ও জরুরি দুর্যোগ ব্যবস্থাপনা' 
                  : 'Monsoon Waterlogging Emergency & Disaster Management Portal'}
              </p>
              <p className="text-[11px] text-slate-400 font-normal">
                {lang === 'bn'
                  ? 'সরাসরি নিকাশি মনিটরিং • নিরাপদ রুট • জরুরি এসওএস'
                  : 'Real-time Drainage Monitoring • Safe Routes • Emergency SOS'}
              </p>
            </motion.div>

            {/* Progress Indicator */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="w-full mt-6 flex flex-col items-center space-y-2.5"
            >
              {/* Progress Bar */}
              <div className="w-64 sm:w-72 h-1.5 bg-[#0a1730] rounded-full overflow-hidden border border-blue-900/40 p-[1px] relative shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400 shadow-sm shadow-blue-500/50"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.15 }}
                />
              </div>

              {/* Telemetry Status Ticker */}
              <div className="h-6 flex items-center justify-center gap-2 text-[11px] text-sky-300 font-medium">
                <Radio className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[280px] sm:max-w-xs text-center">
                  {lang === 'bn' 
                    ? statusMessages[statusMessageIndex].bn 
                    : statusMessages[statusMessageIndex].en}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Bottom Section: Official Public Service Accreditation */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="w-full pb-6 px-4 flex flex-col items-center text-center space-y-1.5 z-10"
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {lang === 'bn' 
                  ? 'রাজ্য জরুরি অপারেশন সেন্টার (SEOC): ১০৭০ • কেএমসি হেল্পলাইন: ১৪৪২০' 
                  : 'State Emergency Operation Centre (SEOC): 1070 • KMC Civic Helpline: 14420'}
              </span>
            </div>
            <p className="text-[9px] text-slate-500">
              Government of West Bengal Public Safety Initiative • Department of Disaster Management & Civil Defence
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
