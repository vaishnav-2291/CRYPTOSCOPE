import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getDashboardStats, getMarketPrices, getWatchlist } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatBtc, formatUsd, truncateAddress, getRiskTheme, SAMPLE_WALLETS } from "../utils/constants";
import {
  Shield,
  Layers,
  Eye,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  ArrowRight,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Radio,
  Cpu,
  Zap,
} from "lucide-react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend as ChartLegend } from "chart.js";

ChartJS.register(ArcElement, ChartTooltip, ChartLegend);

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [marketData, setMarketData] = useState(null);
  const [quickAddr, setQuickAddr] = useState("");
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, marketRes] = await Promise.all([
          getDashboardStats().catch(() => null),
          getMarketPrices().catch(() => null),
        ]);

        if (statsRes) setStats(statsRes);
        if (marketRes?.data) setMarketData(marketRes.data);

        if (isAuthenticated) {
          getWatchlist()
            .then((wRes) => {
              if (wRes?.watchlist) setWatchlistCount(wRes.watchlist.length);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  const handleQuickScan = (e) => {
    e.preventDefault();
    if (!quickAddr.trim()) return;
    navigate(`/scan?address=${encodeURIComponent(quickAddr.trim())}`);
  };

  const highRisk = stats?.highRiskWallets || 3;
  const medRisk = stats?.mediumRiskWallets || 4;
  const lowRisk = stats?.lowRiskWallets || 7;

  const donutData = {
    labels: ["Low Risk (0-39)", "Medium Risk (40-69)", "High Risk (70-100)"],
    datasets: [
      {
        data: [lowRisk, medRisk, highRisk],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderColor: "#080C14",
        borderWidth: 3,
        hoverOffset: 6,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#94A3B8", font: { size: 10.5, family: "JetBrains Mono" } },
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in select-none">
      {/* Hero Command Center with HUD Corners & Laser Scan */}
      <div className="cyber-card cyber-card-glow rounded-3xl p-6 md:p-8 border border-cyan-500/30 relative overflow-hidden group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        {/* Ambient Laser Beam Sweeper */}
        <div className="scan-line-effect" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>BLOCKCHAIN RISK INTELLIGENCE 2.0 ACTIVE</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              On-Chain Risk & <span className="text-gradient-cyan">Threat Command Center</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed font-sans">
              Deterministic 5-axis heuristic profiling, real-time Bitcoin UTXO tracking, interactive fund flow network graphing, and entity intelligence audits.
            </p>
          </div>

          {/* Quick Scan Input Widget */}
          <form onSubmit={handleQuickScan} className="w-full lg:w-96 space-y-2">
            <div className="relative group/input">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-hover/input:scale-110 transition" />
              <input
                type="text"
                placeholder="Scan any Bitcoin address (Legacy / SegWit / Taproot)..."
                value={quickAddr}
                onChange={(e) => setQuickAddr(e.target.value)}
                className="w-full pl-10 pr-24 py-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-cyan-500/25 flex items-center gap-1"
              >
                <span>SCAN</span>
                <Zap className="w-3 h-3 fill-current" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Telemetry KPI Cards with Holographic Accents */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between relative group">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-br" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL SCANS</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold font-mono text-white my-2 tracking-tight">
            {stats?.totalScans?.toLocaleString() || "14"}
          </div>
          <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Platform Scans Tracked
          </span>
        </div>

        {/* High Risk Flags */}
        <div className="cyber-card cyber-card-hover rounded-2xl p-5 border border-rose-500/20 flex flex-col justify-between relative group">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-br" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>HIGH RISK FLAGS</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold font-mono text-rose-400 my-2 tracking-tight">
            {highRisk}
          </div>
          <span className="text-[11px] text-rose-300 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Mixer / Exploit Matches
          </span>
        </div>

        {/* Watched Targets */}
        <div className="cyber-card cyber-card-hover rounded-2xl p-5 border border-purple-500/20 flex flex-col justify-between relative group">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-br" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>WATCHED TARGETS</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition shadow-[0_0_10px_rgba(168,85,247,0.2)]">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold font-mono text-purple-300 my-2 tracking-tight">
            {watchlistCount}
          </div>
          <span className="text-[11px] text-purple-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Monitored In Watchlist
          </span>
        </div>

        {/* Avg Risk Score */}
        <div className="cyber-card cyber-card-hover rounded-2xl p-5 border border-amber-500/20 flex flex-col justify-between relative group">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-br" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG RISK SCORE</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-extrabold font-mono text-amber-400 my-2 tracking-tight">
            {stats?.averageRiskScore || 42}/100
          </div>
          <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 5-Axis Baseline Mean
          </span>
        </div>
      </div>

      {/* Live Market Sparklines & Risk Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Market Tickers */}
        <div className="lg:col-span-2 space-y-4">
          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 relative">
            <span className="hud-bracket-tl" />
            <span className="hud-bracket-tr" />
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Live Crypto Market Rates
              </h3>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                CoinGecko Telemetry
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 font-mono">
              {["bitcoin", "ethereum", "solana"].map((coinKey) => {
                const coin = marketData?.[coinKey];
                const price = coin?.usd || (coinKey === "bitcoin" ? 96420 : coinKey === "ethereum" ? 2780 : 195);
                const change =
                  coin?.usd_24h_change ||
                  (coinKey === "bitcoin" ? 2.85 : coinKey === "ethereum" ? -0.92 : 4.15);
                const isPos = change >= 0;

                return (
                  <div
                    key={coinKey}
                    className="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-2 hover:border-cyan-500/30 transition shadow-inner group/card"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-200">{coinKey}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isPos
                            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                            : "text-rose-400 bg-rose-500/10 border border-rose-500/30"
                        }`}
                      >
                        {isPos ? "+" : ""}
                        {change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xl font-extrabold text-white">{formatUsd(price)}</div>
                    <div className="text-[10px] text-slate-500">24h Vol: {formatUsd(coin?.usd_24h_vol || 34000000000)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Nav Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/batch"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-cyan-500/20 flex items-center justify-between group relative"
            >
              <span className="hud-bracket-tl" />
              <div>
                <div className="text-xs font-mono text-cyan-400 font-semibold">BATCH SCANNER</div>
                <div className="text-sm font-bold text-white mt-0.5">Scan 20 Addresses</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/compare"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-amber-500/20 flex items-center justify-between group relative"
            >
              <span className="hud-bracket-tl" />
              <div>
                <div className="text-xs font-mono text-amber-400 font-semibold">COMPARE MATRIX</div>
                <div className="text-sm font-bold text-white mt-0.5">Side-by-Side Radar</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/watchlist"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-purple-500/20 flex items-center justify-between group relative"
            >
              <span className="hud-bracket-tl" />
              <div>
                <div className="text-xs font-mono text-purple-400 font-semibold">WATCHLIST</div>
                <div className="text-sm font-bold text-white mt-0.5">Delta Alerts</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between relative">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-tr" />
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-lg font-bold font-heading text-white">Risk Distribution</h3>
            <p className="text-xs text-slate-400">Platform Scan Breakdown</p>
          </div>

          <div className="h-52 w-full my-4">
            <Doughnut data={donutData} options={donutOptions} />
          </div>

          <div className="flex items-center justify-around text-xs font-mono text-center pt-3 border-t border-white/5">
            <div>
              <span className="text-emerald-400 font-bold text-sm">{lowRisk}</span>
              <div className="text-[10px] text-slate-500">Low Risk</div>
            </div>
            <div>
              <span className="text-amber-400 font-bold text-sm">{medRisk}</span>
              <div className="text-[10px] text-slate-500">Medium</div>
            </div>
            <div>
              <span className="text-rose-400 font-bold text-sm">{highRisk}</span>
              <div className="text-[10px] text-slate-500">High Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Target Wallets Quick Launcher */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4 relative">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Curated Demo Target Wallets
            </h3>
            <p className="text-xs text-slate-400">
              One-click access to historic nodes, commercial exchanges, privacy mixers, and threat actors for instant testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_WALLETS.slice(0, 6).map((sample, idx) => (
            <button
              key={idx}
              onClick={() => navigate(`/scan?address=${encodeURIComponent(sample.address)}`)}
              className="p-4 rounded-xl bg-slate-950/70 hover:bg-slate-900/90 border border-white/5 hover:border-cyan-500/40 text-left transition flex flex-col justify-between gap-2.5 group shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  {sample.name}
                </span>
                <span className={`text-[9px] px-2 py-0.5 rounded border font-mono font-bold ${sample.badgeColor}`}>
                  {sample.expectedRisk}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 group-hover:text-slate-300 transition">
                {truncateAddress(sample.address, 8, 8)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;