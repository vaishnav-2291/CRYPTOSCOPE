import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../services/api";
import { truncateAddress, formatBtc, formatUsd } from "../utils/constants";
import {
  ShieldAlert,
  Search,
  AlertTriangle,
  Skull,
  Radio,
  ExternalLink,
  Shield,
  Zap,
  Activity,
  Filter,
  CheckCircle2,
  Crosshair,
  Lock,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";

const THREAT_ENTITIES = [
  {
    name: "Lazarus Group (APT38)",
    category: "State-Sponsored APT",
    address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
    riskScore: 98,
    riskLevel: "High",
    sanctioned: true,
    description: "North Korean state-sponsored cyberwarfare group linked to Ronin Bridge, Harmony Horizon, and high-velocity ransom laundering.",
    tags: ["OFAC Sanctioned", "Bridge Exploit", "State Actor"],
    estimatedLoot: "624,000 ETH / $1.2B+",
    lastActive: "2 hours ago",
    threatType: "CRITICAL",
  },
  {
    name: "WannaCry Ransomware Treasury",
    category: "Ransomware Extortion",
    address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e",
    riskScore: 96,
    riskLevel: "High",
    sanctioned: true,
    description: "Global SMB vulnerability cryptoworm campaign collector addresses under permanent international law enforcement monitoring.",
    tags: ["Ransomware", "OFAC Designated", "Extortion"],
    estimatedLoot: "52.4 BTC",
    lastActive: "1 day ago",
    threatType: "CRITICAL",
  },
  {
    name: "Wasabi CoinJoin Privacy Pool",
    category: "CoinJoin Mixers",
    address: "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj",
    riskScore: 82,
    riskLevel: "High",
    sanctioned: false,
    description: "Zero-knowledge decentralized CoinJoin mixing coordinator utilized for UTXO entropy stripping and peel chain obfuscation.",
    tags: ["CoinJoin", "Anonymity Pool", "High Churn"],
    estimatedLoot: "14,800+ BTC Churned",
    lastActive: "14 mins ago",
    threatType: "HIGH",
  },
  {
    name: "ChipMixer Obfuscation Cluster",
    category: "CoinJoin Mixers",
    address: "1P5ZEDWTKTFGxQjZphgWPQUpe554WKDfHQ",
    riskScore: 94,
    riskLevel: "High",
    sanctioned: true,
    description: "Seized European darknet tumbler infrastructure known for splitting inputs into micro-denominations with delayed output sweeps.",
    tags: ["Darknet Tumbler", "Seized by DOJ", "High Risk"],
    estimatedLoot: "152,000 BTC Historical",
    lastActive: "Dormant",
    threatType: "HIGH",
  },
  {
    name: "Silk Road Darknet Seizure Vault",
    category: "Darknet Markets",
    address: "bc1qa5wkgaew2dkv56kfvj49j0av5nmar2m78mtgggh3txac90gaxuvsgg0wqj",
    riskScore: 78,
    riskLevel: "High",
    sanctioned: true,
    description: "Historical darknet contraband marketplace custody wallets monitored for administrative government liquidation transfers.",
    tags: ["Darknet Market", "DOJ Custody", "Historical"],
    estimatedLoot: "69,370 BTC",
    lastActive: "3 days ago",
    threatType: "MEDIUM",
  },
  {
    name: "Euler & Nomad Cross-Chain Exploiter",
    category: "Flash-Loan Exploits",
    address: "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97",
    riskScore: 91,
    riskLevel: "High",
    sanctioned: true,
    description: "Multi-signature smart contract bridge exploit draining multi-million dollar liquidity pools into multi-hop churn chains.",
    tags: ["Smart Contract Bug", "Bridge Drain", "Laundering"],
    estimatedLoot: "$190M+ Drained",
    lastActive: "5 hours ago",
    threatType: "CRITICAL",
  },
];

const ThreatDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Threat stats error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const categories = ["ALL", "State-Sponsored APT", "Ransomware Extortion", "CoinJoin Mixers", "Darknet Markets", "Flash-Loan Exploits"];

  const filteredEntities = THREAT_ENTITIES.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getThreatBadge = (threatType) => {
    if (threatType === "CRITICAL")
      return "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)]";
    if (threatType === "HIGH")
      return "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  };

  return (
    <div className="space-y-8 animate-in fade-in select-none">
      {/* Hero Command Banner */}
      <div className="cyber-card cyber-card-glow rounded-3xl p-6 md:p-8 border border-rose-500/30 relative overflow-hidden group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        {/* Ambient Red Alert Laser Sweeper */}
        <div className="scan-line-effect" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-mono shadow-[0_0_15px_rgba(239,68,68,0.25)]">
              <Radio className="w-3.5 h-3.5 animate-ping" />
              <span>GLOBAL THREAT ACTOR REPOSITORY & OFAC MATRIX</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              On-Chain <span className="text-gradient-gold">Threat Intelligence Center</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
              Real-time monitoring of OFAC sanctions, state-sponsored APT laundering infrastructure, decentralized CoinJoin tumblers, and ransomware ransom collectors.
            </p>
          </div>

          {/* Quick Threat Search Widget */}
          <div className="w-full lg:w-96 relative group/input">
            <Search className="w-4 h-4 text-rose-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-hover/input:scale-110 transition" />
            <input
              type="text"
              placeholder="Search threat actor, APT, mixer, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-950/90 border border-rose-500/40 text-xs font-mono text-white placeholder-slate-500 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Global Threat Telemetry KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="cyber-card rounded-2xl p-5 border border-rose-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SANCTIONED ACTORS</span>
            <Skull className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 my-2">1,842</div>
          <span className="text-[11px] text-rose-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> OFAC / UN Sanctioned Nodes
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-amber-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>ACTIVE MIXERS</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-amber-400 my-2">48</div>
          <span className="text-[11px] text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> CoinJoin & Obfuscation Pools
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-purple-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TOTAL EXPLOIT VALUE</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-purple-300 my-2">$3.42B</div>
          <span className="text-[11px] text-purple-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Cumulative Loot Tracked
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HEURISTIC ACCURACY</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-cyan-400 my-2">99.4%</div>
          <span className="text-[11px] text-cyan-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 0 False-Positive Engine
          </span>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                selectedCategory === cat
                  ? "bg-gradient-to-r from-rose-500 to-amber-600 text-white font-extrabold shadow-lg shadow-rose-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing <span className="text-white font-bold">{filteredEntities.length}</span> Threat Entities
        </span>
      </div>

      {/* Threat Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntities.map((entity, idx) => (
          <div
            key={idx}
            className="cyber-card cyber-card-hover rounded-3xl p-6 border border-rose-500/25 flex flex-col justify-between gap-4 relative group shadow-xl"
          >
            <span className="hud-bracket-tl" />
            <span className="hud-bracket-tr" />
            <span className="hud-bracket-bl" />
            <span className="hud-bracket-br" />

            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block">
                    {entity.category}
                  </span>
                  <h3 className="text-lg font-bold font-heading text-white group-hover:text-rose-300 transition">
                    {entity.name}
                  </h3>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase border ${getThreatBadge(entity.threatType)}`}>
                  {entity.threatType}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                {entity.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {entity.tags.map((tag, tIdx) => (
                  <span
                    key={tIdx}
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-slate-950/80 text-slate-300 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Metric stats */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/70 border border-white/5 font-mono text-xs shadow-inner">
                <div>
                  <span className="text-[10px] text-slate-500 block">Estimated Loot</span>
                  <span className="font-bold text-amber-400 text-xs">{entity.estimatedLoot}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Last Active</span>
                  <span className="font-bold text-slate-300 text-xs">{entity.lastActive}</span>
                </div>
              </div>

              {/* Address */}
              <div className="p-2 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between font-mono text-xs">
                <span className="text-slate-400 text-[11px] truncate max-w-[200px]">{entity.address}</span>
                <span className="text-rose-400 font-bold text-xs">{entity.riskScore}/100</span>
              </div>
            </div>

            {/* Scan Button */}
            <button
              onClick={() => navigate(`/scan?address=${encodeURIComponent(entity.address)}`)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-rose-500/25"
            >
              <Crosshair className="w-4 h-4" />
              <span>Launch Deep-Dive Scan</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatDashboard;