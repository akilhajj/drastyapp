import React from 'react';
import { useLang } from '../lib/lang';
import { X, Star, Heart } from 'lucide-react';

interface Props {
  onSelect: (choice: 'islamic' | 'christian') => void;
  onClose: () => void;
}

export default function ReligionSelector({ onSelect, onClose }: Props) {
  const { t, lang } = useLang();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card p-8 max-w-md w-full animate-slide-up text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/30 to-transparent rounded-2xl pointer-events-none" />
        <div className="relative">
          {/* 3D Book illustration */}
          <div className="w-24 h-24 mx-auto mb-6 animate-float">
            <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-2xl">
              <defs>
                <linearGradient id="bookGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>
              {/* Book */}
              <rect x="15" y="20" width="90" height="75" rx="8" fill="url(#bookGold)" />
              <rect x="18" y="23" width="84" height="69" rx="7" fill="#fde68a" />
              <rect x="55" y="20" width="4" height="75" fill="#d97706" />
              <rect x="25" y="35" width="25" height="2" rx="1" fill="#b45309" opacity="0.6" />
              <rect x="25" y="41" width="20" height="2" rx="1" fill="#b45309" opacity="0.4" />
              <rect x="65" y="35" width="25" height="2" rx="1" fill="#b45309" opacity="0.6" />
              <rect x="65" y="41" width="20" height="2" rx="1" fill="#b45309" opacity="0.4" />
              {/* Shine */}
              <ellipse cx="35" cy="28" rx="12" ry="5" fill="white" opacity="0.2" transform="rotate(-20 35 28)" />
              {/* Stars */}
              <circle cx="95" cy="15" r="3" fill="#fbbf24" opacity="0.9" />
              <circle cx="20" cy="100" r="2" fill="#a78bfa" opacity="0.7" />
              <circle cx="105" cy="90" r="2.5" fill="#60a5fa" opacity="0.7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">{t('religionSelector')}</h2>
          <p className="text-white/60 text-sm mb-8">{t('religionPrompt')}</p>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => onSelect('islamic')}
              className="group relative p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl" />
              <div className="relative">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="font-bold text-white text-sm">{t('islamicEd')}</div>
                <div className="text-white/50 text-xs mt-1">{lang === 'ar' ? 'التربية الإسلامية' : 'Islamic Education'}</div>
              </div>
            </button>

            <button onClick={() => onSelect('christian')}
              className="group relative p-5 rounded-2xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 hover:border-sky-400 transition-all duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent rounded-2xl" />
              <div className="relative">
                <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-sky-400" />
                </div>
                <div className="font-bold text-white text-sm">{t('christianEd')}</div>
                <div className="text-white/50 text-xs mt-1">{lang === 'ar' ? 'التربية المسيحية' : 'Christian Education'}</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
