/**
 * CryptoScope AI — Global UI Constants & Formatting Utilities
 */

export const formatBtc = (val) => {
  if (val === null || val === undefined) return "0.00000000 BTC";
  const num = Number(val);
  return `${num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 })} BTC`;
};

export const formatUsd = (val) => {
  if (val === null || val === undefined) return "$0.00";
  const num = Number(val);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: num > 1000 ? 0 : 2,
  }).format(num);
};

export const truncateAddress = (addr, start = 6, end = 6) => {
  if (!addr || typeof addr !== "string") return "";
  if (addr.length <= start + end) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
};

export const getRiskLevel = (score = 0) => {
  const s = typeof score === "number" ? score : parseFloat(score) || 0;
  if (s >= 70) return "High";
  if (s >= 40) return "Medium";
  return "Low";
};

export const getRiskTheme = (levelOrScore = "Low") => {
  let level = levelOrScore;
  if (typeof levelOrScore === "number" || (!isNaN(Number(levelOrScore)) && typeof levelOrScore === "string" && !/low|med|high|crit/i.test(levelOrScore))) {
    level = getRiskLevel(Number(levelOrScore));
  }
  const l = (level || "").toString().toLowerCase();
  if (l.includes("high") || l.includes("critical")) {
    return {
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      solid: "bg-red-500",
      glow: "glow-red",
      label: "HIGH RISK",
      badge: "border-red-500/40 text-red-400 bg-red-500/10",
      barColor: "#EF4444",
      icon: "🚨",
    };
  }
  if (l.includes("med")) {
    return {
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      solid: "bg-amber-500",
      glow: "glow-amber",
      label: "MEDIUM RISK",
      badge: "border-amber-500/40 text-amber-400 bg-amber-500/10",
      barColor: "#F59E0B",
      icon: "🟡",
    };
  }
  return {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    solid: "bg-emerald-500",
    glow: "glow-green",
    label: "LOW RISK",
    badge: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    barColor: "#10B981",
    icon: "🟢",
  };
};

export const getSeverityBadge = (severity = "LOW") => {
  switch (severity.toUpperCase()) {
    case "CRITICAL":
      return "bg-rose-950/80 text-rose-300 border border-rose-500/40";
    case "HIGH":
      return "bg-red-950/70 text-red-300 border border-red-500/40";
    case "MEDIUM":
      return "bg-amber-950/70 text-amber-300 border border-amber-500/40";
    case "INFO":
      return "bg-cyan-950/70 text-cyan-300 border border-cyan-500/40";
    default:
      return "bg-slate-800 text-slate-300 border border-slate-700";
  }
};
