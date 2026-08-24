import React from "react";
import { getRiskTheme } from "../utils/constants";

const RiskGauge = ({ score = 0, level = "Low", size = 220 }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const theme = getRiskTheme(level);

  // SVG Gauge calculations
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Use a 240 degree arc for speedometer appearance
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (arcLength * safeScore) / 100;

  return (
    <div className="flex flex-col items-center justify-center relative p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size * 0.85 }}>
        <svg
          viewBox="0 0 200 180"
          className="w-full h-full transform -rotate-210 origin-center overflow-visible"
        >
          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Value Progress Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={theme.barColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${theme.barColor}80)`,
            }}
          />
        </svg>

        {/* Center Content Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 text-center pointer-events-none">
          <div className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-white flex items-baseline">
            <span className={theme.text}>{safeScore}</span>
            <span className="text-xs md:text-sm text-slate-500 font-mono ml-1">/100</span>
          </div>

          <div className="mt-1 flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-semibold uppercase tracking-wider backdrop-blur-sm"
               style={{ backgroundColor: `${theme.barColor}15`, borderColor: `${theme.barColor}40`, color: theme.barColor }}>
            <span>{theme.icon}</span>
            <span>{level} Risk</span>
          </div>
        </div>
      </div>

      {/* Sub-label */}
      <div className="flex items-center justify-between w-full max-w-[200px] text-[10px] text-slate-400 font-mono -mt-2">
        <span className="text-emerald-400">0 Low</span>
        <span className="text-amber-400">40 Med</span>
        <span className="text-rose-400">70 High</span>
      </div>
    </div>
  );
};

export default RiskGauge;