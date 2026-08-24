/**
 * CryptoScope AI — Global UI Constants & Sample Intel Directory
 */

export const SAMPLE_WALLETS = [
  {
    name: "Satoshi Genesis (Historic)",
    address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    category: "Genesis / Historic",
    expectedRisk: "Low",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    name: "Binance Cold Storage",
    address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo",
    category: "Exchange Vault",
    expectedRisk: "Low-Medium",
    badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  },
  {
    name: "Wasabi CoinJoin Mixer",
    address: "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj",
    category: "Privacy / Mixer",
    expectedRisk: "High",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
  {
    name: "WannaCry Ransomware Treasury",
    address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
    category: "Ransomware / Sanctions",
    expectedRisk: "High (Critical)",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
  {
    name: "Mt. Gox Hack Stolen Assets",
    address: "1FeexV6bAHb8ybZjqQMjJrcCrHGW9sb6uF",
    category: "Exploit Stolen Funds",
    expectedRisk: "High (Critical)",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  },
  {
    name: "Kraken Hot Wallet Cluster",
    address: "38U5G48Rj9VbF9t8cE1256yq75fJd5rT1g",
    category: "Exchange Liquidity",
    expectedRisk: "Medium",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  },
];

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

export const getRiskTheme = (level = "Low") => {
  const l = (level || "").toLowerCase();
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
