import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Language } from '../data/translations';

interface WestBengalEmblemProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: string;
  lang?: Language;
  layout?: 'horizontal' | 'vertical';
  variant?: 'light' | 'dark' | 'transparent';
}

/**
 * Authentic Official Government of West Bengal Emblem Component
 * 
 * Uses the authentic official emblem (Seal of West Bengal with the National Emblem of India
 * and the Biswa Bangla motif) with an authoritative fallback placeholder if the asset cannot load.
 */
export const WestBengalEmblem: React.FC<WestBengalEmblemProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'text-slate-200',
  lang = 'en',
  layout = 'horizontal',
  variant = 'transparent'
}) => {
  const [hasError, setHasError] = useState(false);

  // Size mappings for the official emblem image container
  const containerSizeClasses = {
    xs: 'w-6 h-6 p-0.5',
    sm: 'w-8 h-8 p-1',
    md: 'w-10 h-10 p-1.5',
    lg: 'w-14 h-14 p-2',
    xl: 'w-20 h-20 p-2.5'
  };

  const textSizes = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base font-bold'
  };

  return (
    <div 
      className={`inline-flex items-center ${
        layout === 'vertical' ? 'flex-col text-center gap-1.5' : 'flex-row text-left gap-2.5'
      } ${className}`}
    >
      {/* Official Authentic Emblem on White Background for High Contrast & Crisp Visibility */}
      <div 
        className={`${containerSizeClasses[size]} rounded-full bg-white flex items-center justify-center shrink-0 shadow-md ring-1 ring-slate-200/50`}
      >
        {!hasError ? (
          <img
            src="/wb-gov-logo.svg"
            alt={lang === 'bn' ? 'পশ্চিমবঙ্গ সরকার সিলমোহর' : 'Government of West Bengal Emblem'}
            className="w-full h-full object-contain"
            onError={() => setHasError(true)}
            loading="eager"
          />
        ) : (
          /* Standard Government Crest Fallback Placeholder if external asset fails */
          <div 
            className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center text-amber-600 shrink-0"
            title="Government of West Bengal Seal Placeholder"
          >
            <Shield className="w-2/3 h-2/3" />
          </div>
        )}
      </div>

      {/* Official Government Department Typography */}
      {showText && (
        <div className={`flex flex-col leading-tight ${textColor}`}>
          <span className={`font-extrabold tracking-wide ${textSizes[size]}`}>
            {lang === 'bn' ? 'পশ্চিমবঙ্গ সরকার' : 'Government of West Bengal'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {lang === 'bn' ? 'দুর্যোগ ব্যবস্থাপনা ও অসামরিক প্রতিরক্ষা' : 'Disaster Management & Civil Defence'}
          </span>
        </div>
      )}
    </div>
  );
};
