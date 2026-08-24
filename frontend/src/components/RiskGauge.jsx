import React from "react";
import { getRiskTheme } from "../utils/constants";
import { Shield, Radio, Activity } from "lucide-react";

const RiskGauge = ({ score = 0, level = "Low", size = 240 }) => {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const theme = getRiskTheme(level);

  // SVG Gauge calculations
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const arcAngle = 240;
  const arcLength = circumference * (arcAngle / 360);
  const strokeDashoffset = arcLength - (arcLength * safeScore) / 100;

  // Tick marks
  const ticks = [0, 20, 40, 60, 80, 100];

  return (
    <div className="flex flex-col items-center justify-center relative p-2 select-none group">
      {/* Outer Holographic Radar Glow Ring */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size * 0.9 }}
      >
        {/* Ambient Pulsing Glow Backdrop */}
        <div
          className="absolute inset-4 rounded-full opacity-30 blur-2xl transition-all duration-1000 animate-pulse-slow"
          style={{ backgroundColor: theme.barColor }}
        />

        {/* Rotating Radar Sweep Overlay */}
        <div className="absolute inset-2 rounded-full overflow-hidden pointer-events-none opacity-20">
          <div
            className="w-full h-full animate-radar-spin origin-center"
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 270deg, ${theme.barColor} 360deg)`,
            }}
          />
        </div>

        {/* SVG Concentric Gauge */}
        <svg
          viewBox="0 0 200 190"
          className="w-full h-full transform -rotate-210 origin-center overflow-visible z-10"
        >
          <defs>
            {/* Dynamic Neon Gradient Arc */}
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>

            {/* Glowing Filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Thin Tech Boundary Ring */}
          <circle
            cx="100"
            cy="100"
            r={radius + 10}
            fill="none"
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />

          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Value Progress Arc with Glow */}
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
            filter="url(#gaugeGlow)"
          />

          {/* Inner Dotted Radar Track */}
          <circle
            cx="100"
            cy="100"
            r={radius - 14}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1.5"
            strokeDasharray="2 4"
          />
        </svg>

        {/* Center Holographic HUD Core */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-5 text-center pointer-events-none z-20">
          {/* Animated Core Ring */}
          <div
            className="w-20 h-20 rounded-full border border-dashed flex items-center justify-center animate-spin"
            style={{ borderColor: `${theme.barColor}40`, animationDuration: "20s" }}
          />

          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1 mb-0.5">
              <Radio className="w-3 h-3 animate-pulse text-cyan-400" /> RISK SCORE
            </span>

            <div className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight text-white flex items-baseline drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]">
              <span className={theme.text}>{safeScore}</span>
              <span className="text-xs text-slate-500 font-mono ml-0.5">/100</span>
            </div>

            <div
              className="mt-1 flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider shadow-lg"
              style={{
                backgroundColor: `${theme.barColor}20`,
                borderColor: `${theme.barColor}60`,
                color: theme.barColor,
                boxShadow: `0 0 15px ${theme.barColor}30`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: theme.barColor }} />
              <span>{level} Risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Level Range Indicator */}
      <div className="flex items-center justify-between w-full max-w-[220px] text-[10px] font-mono text-slate-400 -mt-1 pt-2 border-t border-white/10">
        <span className="text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 0 Low
        </span>
        <span className="text-amber-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 40 Med
        </span>
        <span className="text-rose-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> 70 High
        </span>
      </div>
    </div>
  );
};

export default RiskGauge;