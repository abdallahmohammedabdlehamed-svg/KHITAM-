import React from 'react';

interface KhitamLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const KhitamLogo: React.FC<KhitamLogoProps> = ({
  size = 40,
  showText = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform hover:scale-[1.02]"
        aria-label="شعار خِتام"
      >
        <defs>
          {/* Background Radial Gradient */}
          <radialGradient
            id="khitamBg"
            cx="40%"
            cy="35%"
            r="70%"
            fx="35%"
            fy="30%"
          >
            <stop offset="0%" stopColor="#0B4B34" />
            <stop offset="60%" stopColor="#073827" />
            <stop offset="100%" stopColor="#031F15" />
          </radialGradient>

          {/* Ring Gradient */}
          <linearGradient id="orbitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="60%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          {/* Gold Book Gradient */}
          <linearGradient id="goldBook" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* White Page Gradient */}
          <linearGradient id="whitePage" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Soft Shadow Filter */}
          <filter id="subtleGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Squircle Badge Outer Container */}
        <rect
          x="4"
          y="4"
          width="112"
          height="112"
          rx="30"
          fill="url(#khitamBg)"
          stroke="#10B981"
          strokeWidth="1.2"
          strokeOpacity="0.35"
        />

        {/* Circular Orbital Ring */}
        <circle
          cx="60"
          cy="58"
          r="44"
          fill="none"
          stroke="url(#orbitGrad)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray="260 20"
          opacity="0.9"
        />

        {/* Celestial Golden Sphere on the Orbit */}
        <circle cx="94" cy="38" r="5.5" fill="url(#goldBook)" filter="url(#subtleGlow)" />

        {/* Arabic Calligraphy 'خِتام' (Master Vector Path) */}
        <g filter="url(#subtleGlow)">
          {/* Main Body of 'خِتام' */}
          <path
            d="M 23 75 
               C 23 60, 31 52, 41 49 
               C 49 46, 52 49, 53 54 
               C 54 58, 54 59, 58 59 
               C 62 59, 63 56, 64 50 
               C 66 38, 70 34, 73 34
               C 75 34, 76 38, 76 56 
               C 76 59, 78 59, 83 59
               C 89 59, 93 54, 96 49 
               C 99 44, 102 47, 100 52 
               C 96 61, 88 68, 75 68
               C 66 68, 64 63, 62 63
               C 60 63, 58 67, 53 67
               C 48 67, 46 62, 40 62 
               C 34 62, 30 67, 28 77 
               C 27 80, 23 80, 23 75 Z"
            fill="#F8FAFC"
          />

          {/* Dots of Khaa and Taa */}
          {/* Dot for Khaa */}
          <polygon points="45,39 49,34 53,39 49,43" fill="#F8FAFC" />
          
          {/* Two Dots for Taa */}
          <polygon points="63,42 66,38 69,42 66,45" fill="#F8FAFC" />
          <polygon points="71,39 74,35 77,39 74,42" fill="#F8FAFC" />

          {/* Dot for Jeem/Mīm lower anchor */}
          <polygon points="87,71 91,66 95,71 91,75" fill="#F8FAFC" />
        </g>

        {/* Stylized Open Quran Leaves (Wings) underneath */}
        <g filter="url(#subtleGlow)">
          {/* Golden Upper Pages */}
          <path
            d="M 60 92 
               C 45 77, 34 76, 28 78 
               C 36 84, 48 84, 60 92 
               C 72 84, 84 84, 92 78 
               C 86 76, 75 77, 60 92 Z"
            fill="url(#goldBook)"
          />

          {/* White Lower Arc Layer */}
          <path
            d="M 60 97 
               C 47 84, 38 84, 32 86 
               C 40 91, 50 91, 60 97 
               C 70 91, 80 91, 88 86 
               C 82 84, 73 84, 60 97 Z"
            fill="url(#whitePage)"
            opacity="0.95"
          />
        </g>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight text-[#0F3E2E]">خِتَـام</span>
            <span className="text-xs font-semibold text-amber-600 tracking-wider">KHITAM</span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">منصة حفظ القرآن الكريم وتثبيته</span>
        </div>
      )}
    </div>
  );
};
