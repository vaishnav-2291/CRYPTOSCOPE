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
          getWatchlist().then((wRes) => {
            if (wRes?.watchlist) setWatchlistCount(wRes.watchlist.length);
          }).catch(() => {});
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

  // Donut Chart Data
  const highRisk = stats?.highRiskWallets || 1;
  const medRisk = stats?.mediumRiskWallets || 2;
  const lowRisk = stats?.lowRiskWallets || 5;

  const donutData = {
    labels: ["Low Risk (0-39)", "Medium Risk (40-69)", "High Risk (70-100)"],
    datasets: [
      {
        data: [lowRisk, medRisk, highRisk],
        backgroundColor: ["#10B981", "#F59E0B", "#EF4444"],
        borderColor: "#080C14",
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#94A3B8", font: { size: 10, family: "Inter" } },
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Hero Welcome Banner */}
      <div className="cyber-card cyber-card-glow rounded-3xl p-6 md:p-8 border border-cyan-500/30 relative overflow-hidden">
        <div className="scan-line-effect" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Intelligence Suite 2.0 Active
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold font-heading text-white tracking-tight">
              Blockchain Security & <span className="text-gradient-cyan">Risk Command Center</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time Bitcoin UTXO tracking, 5-axis deterministic heuristics, fund flow graph mapping, and entity intelligence audits.
            </p>
          </div>

          {/* Quick Scan Input directly on Dashboard */}
          <form onSubmit={handleQuickScan} className="w-full lg:w-96 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan any Bitcoin address..."
                value={quickAddr}
                onChange={(e) => setQuickAddr(e.target.value)}
                className="w-full pl-10 pr-24 py-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Scan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>TOTAL SCANS</span>
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-white my-2">
            {stats?.totalScans?.toLocaleString() || "12"}
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">Platform Scans Tracked</span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>HIGH RISK FLAGS</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-rose-400 my-2">
            {highRisk}
          </div>
          <span className="text-[11px] text-rose-300 font-mono">Mixer / Exploit Matches</span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>WATCHED TARGETS</span>
            <Eye className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-purple-300 my-2">
            {watchlistCount}
          </div>
          <span className="text-[11px] text-purple-400 font-mono">Monitored In Watchlist</span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>AVG RISK SCORE</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono text-amber-400 my-2">
            {stats?.averageRiskScore || 42}/100
          </div>
          <span className="text-[11px] text-amber-300 font-mono">5-Axis Baseline Mean</span>
        </div>
      </div>

      {/* Market Ticker Sparklines & Risk Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Market Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Live Crypto Market Rates
              </h3>
              <span className="text-xs font-mono text-slate-400">CoinGecko Feed</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 font-mono">
              {["bitcoin", "ethereum", "solana"].map((coinKey) => {
                const coin = marketData?.[coinKey];
                const price = coin?.usd || (coinKey === "bitcoin" ? 96420 : coinKey === "ethereum" ? 2780 : 195);
                const change = coin?.usd_24h_change || (coinKey === "bitcoin" ? 2.85 : coinKey === "ethereum" ? -0.92 : 4.15);
                const isPos = change >= 0;

                return (
                  <div key={coinKey} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-slate-300">{coinKey}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          isPos ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                        }`}
                      >
                        {isPos ? "+" : ""}{change.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-lg font-bold text-white">{formatUsd(price)}</div>
                    <div className="text-[10px] text-slate-500">24h Volume: {formatUsd(coin?.usd_24h_vol || 10000000000)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/batch"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-cyan-500/20 flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-mono text-cyan-400">BATCH SCANNER</div>
                <div className="text-sm font-bold text-white mt-0.5">Scan 20 Wallets</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/compare"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-cyan-500/20 flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-mono text-amber-400">COMPARE VIEW</div>
                <div className="text-sm font-bold text-white mt-0.5">Side-by-Side Matrix</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              to="/watchlist"
              className="p-4 rounded-2xl cyber-card cyber-card-hover border border-cyan-500/20 flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-mono text-purple-400">WATCHLIST</div>
                <div className="text-sm font-bold text-white mt-0.5">Risk Delta Alerts</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </div>

        {/* Risk Distribution Donut (1 col) */}
        <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
          <div className="pb-3 border-b border-white/10">
            <h3 className="text-lg font-bold font-heading text-white">Risk Distribution</h3>
            <p className="text-xs text-slate-400">Platform Scan Breakdown</p>
          </div>

          <div className="h-52 w-full my-4">
            <Doughnut data={donutData} options={donutOptions} />
          </div>

          <div className="flex items-center justify-around text-xs font-mono text-center pt-3 border-t border-white/5">
            <div>
              <span className="text-emerald-400 font-bold">{lowRisk}</span>
              <div className="text-[10px] text-slate-500">Low Risk</div>
            </div>
            <div>
              <span className="text-amber-400 font-bold">{medRisk}</span>
              <div className="text-[10px] text-slate-500">Medium</div>
            </div>
            <div>
              <span className="text-rose-400 font-bold">{highRisk}</span>
              <div className="text-[10px] text-slate-500">High Risk</div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Target Wallets Quick Launcher */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Curated Demo Target Wallets
            </h3>
            <p className="text-xs text-slate-400">
              One-click access to historic, exchange, privacy mixer, and threat actor addresses for testing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_WALLETS.slice(0, 6).map((sample, idx) => (
            <button
              key={idx}
              onClick={() => navigate(`/scan?address=${encodeURIComponent(sample.address)}`)}
              className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 text-left transition flex flex-col justify-between gap-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                  {sample.name}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${sample.badgeColor}`}>
                  {sample.expectedRisk}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
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