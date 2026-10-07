import React from "react";

/**
 * CryptoLens AI — Unified Vector Brand Identity Logo
 * 
 * Concept:
 * Stylized futuristic "C" aperture lens + central intelligent focus core + AI sparkle accent.
 * Gradient: Cyan (#00E5FF) → Electric Blue (#3B82F6) → Violet (#8B5CF6)
 */
export const CryptoLensIcon = ({ size = 36, className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${className}`}
      aria-label="CryptoLens AI Icon"
    >
      <defs>
        <linearGradient id="cl-icon-grad" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="52%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        <linearGradient id="cl-spark-grad" x1="42" y1="4" x2="60" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>

        <radialGradient id="cl-lens-core-grad" cx="29" cy="32" r="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="45%" stopColor="#3B82F6" />
          <stop offset="85%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#050B14" />
        </radialGradient>
      </defs>

      {/* Outer C-Lens Aperture Arc */}
      <path
        d="M 45 15.5 A 24 24 0 1 0 45 48.5"
        stroke="url(#cl-icon-grad)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Inner Cyber Aperture Ring */}
      <path
        d="M 40.5 21 A 17 17 0 1 0 40.5 43"
        stroke="url(#cl-icon-grad)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="22 5 7 5"
        opacity="0.8"
      />

      {/* Camera / Reticle Crosshairs */}
      <line x1="8" y1="32" x2="14" y2="32" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" opacity="0.85" />
      <line x1="29" y1="10" x2="29" y2="15" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />
      <line x1="29" y1="49" x2="29" y2="54" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round" opacity="0.75" />

      {/* Central Intelligent Focus Core / Iris */}
      <circle cx="29" cy="32" r="7.5" fill="url(#cl-lens-core-grad)" />
      <circle cx="29" cy="32" r="4.2" stroke="#00E5FF" strokeWidth="1.2" fill="#0A1424" opacity="0.9" />
      <circle cx="29" cy="32" r="2" fill="#FFFFFF" />

      {/* Upper AI Sparkle Accent */}
      <path
        d="M 49 5 Q 49 13 57 13 Q 49 13 49 21 Q 49 13 41 13 Q 49 13 49 5 Z"
        fill="url(#cl-spark-grad)"
      />
      <circle cx="49" cy="13" r="1.5" fill="#FFFFFF" />
    </svg>
  );
};

const CryptoLensLogo = ({
  size = "md",
  iconOnly = false,
  showTagline = false,
  className = "",
}) => {
  const sizeMap = {
    sm: { icon: 28, text: "text-base", badge: "text-[9px] px-1 py-0.2" },
    md: { icon: 36, text: "text-lg", badge: "text-[10px] px-1.5 py-0.5" },
    lg: { icon: 44, text: "text-2xl", badge: "text-xs px-2 py-0.5" },
    xl: { icon: 54, text: "text-3xl", badge: "text-xs px-2.5 py-1" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  if (iconOnly) {
    return <CryptoLensIcon size={currentSize.icon} className={className} />;
  }

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <div className="relative flex items-center justify-center p-1 rounded-xl bg-slate-950/80 border border-cyan-500/20 shadow-lg shadow-cyan-500/10 group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/25 transition duration-300">
        <CryptoLensIcon size={currentSize.icon} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold font-heading text-white tracking-wide ${currentSize.text}`}>
            Crypto<span className="text-cyan-400 font-extrabold">Lens</span>
          </span>
          <span
            className={`font-mono font-extrabold rounded-md bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 border border-cyan-500/30 text-cyan-300 shadow-sm shadow-cyan-500/20 ${currentSize.badge}`}
          >
            AI
          </span>
        </div>

        {showTagline && (
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-0.5">
            See Deeper. Trade Smarter. Stay Ahead.
          </span>
        )}
      </div>
    </div>
  );
};

export default CryptoLensLogo;
