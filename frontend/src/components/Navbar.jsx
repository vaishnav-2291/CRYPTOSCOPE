import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMarketPrices, getWatchlist, getMempoolTelemetry } from "../services/api";
import { formatUsd } from "../utils/constants";
import {
  Search,
  Shield,
  TrendingUp,
  TrendingDown,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Zap,
  ExternalLink,
  Cpu,
  HardDrive,
  ShieldCheck,
  Radio,
  Layers,
} from "lucide-react";

const Navbar = ({ onQuickScan, onOpenCommand }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [telemetryData, setTelemetryData] = useState({ recommendedFee: null, blockHeight: null });
  const [searchInput, setSearchInput] = useState("");
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [marketStatus, setMarketStatus] = useState("LOADING");

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          getMarketPrices().catch(() => null),
          getMempoolTelemetry().catch(() => null),
        ]);

        if (mRes?.data) {
          setMarketData(mRes.data);
          setMarketStatus(mRes.status || "LIVE");
        } else {
          setMarketStatus("UNAVAILABLE");
        }

        if (tRes) {
          setTelemetryData(tRes);
        }
      } catch {
        setMarketStatus("UNAVAILABLE");
      }
    };

    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getWatchlist()
        .then((res) => {
          if (res?.watchlist) setWatchlistCount(res.watchlist.length);
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    if (onQuickScan) {
      onQuickScan(searchInput.trim());
    } else {
      navigate(`/scan?address=${encodeURIComponent(searchInput.trim())}`);
    }
    setSearchInput("");
  };

  const btcPrice = marketData?.bitcoin?.usd;
  const btcChange = marketData?.bitcoin?.usd_24h_change;
  const isBtcPositive = btcChange !== undefined ? btcChange >= 0 : true;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-2xl">
      {/* Tier 1: Live Telemetry Stream Strip */}
      <div className="h-7 bg-slate-950/90 border-b border-cyan-500/15 flex items-center justify-between px-4 lg:px-8 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LIVE TELEMETRY
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
            <HardDrive className="w-3 h-3 text-cyan-400" /> Network: Bitcoin Mainnet
          </span>
          <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
            <Zap className="w-3 h-3 text-cyan-400" /> Fee: {telemetryData.recommendedFee ? `${telemetryData.recommendedFee} sat/vB` : "—"}
          </span>
          <span className="inline-flex items-center gap-1 text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
            <Layers className="w-3 h-3 text-purple-400" /> Block: {telemetryData.blockHeight ? Number(telemetryData.blockHeight).toLocaleString() : "—"}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
            <Cpu className="w-3 h-3 text-slate-500" /> Mempool / Blockstream Live
          </span>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" /> Heuristic Engine: v2.0-ACTIVE
          </span>
          <span className="text-slate-400 font-mono">
            STATUS: <span className="text-cyan-400 font-bold">{marketStatus}</span>
          </span>
        </div>
      </div>

      {/* Tier 2: Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="w-full h-full bg-[#080C14] rounded-[11px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-white tracking-wide flex items-center gap-1.5">
                Crypto<span className="text-cyan-400">Scope</span>{" "}
                <span className="text-[10px] font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30">
                  AI 2.0
                </span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Bitcoin Ticker */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">₿ BTC:</span>
            <span className="text-white font-bold">
              {btcPrice !== undefined ? formatUsd(btcPrice) : "Loading..."}
            </span>
            {btcChange !== undefined && (
              <span
                className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-bold ${
                  isBtcPositive
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                }`}
              >
                {isBtcPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isBtcPositive ? "+" : ""}
                {btcChange.toFixed(2)}%
              </span>
            )}
            {marketStatus === "STALE" && (
              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                STALE
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Search + User Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Scan Input & Cmd+K Shortcut */}
          <div className="hidden md:flex items-center relative w-60 lg:w-72">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan address..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-8 pr-14 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
              />
            </form>
            {onOpenCommand && (
              <button
                type="button"
                onClick={onOpenCommand}
                className="absolute right-2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-800 border border-slate-700 hover:border-cyan-500/40 transition flex items-center gap-0.5"
                title="Open Command Palette (Cmd+K / Ctrl+K)"
              >
                <span>⌘</span>K
              </button>
            )}
          </div>

          {/* User Profile Pill / Login */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 text-xs text-white transition shadow"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-slate-950 text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold leading-tight truncate max-w-[120px]">{user?.name || "Analyst"}</span>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase font-bold">{user?.role || "User"}</span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in backdrop-blur-xl space-y-1 text-xs">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" /> Account Settings
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-purple-300 hover:text-white hover:bg-purple-500/20 transition font-mono"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin Console
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;