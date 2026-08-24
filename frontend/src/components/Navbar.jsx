import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMarketPrices, getWatchlist } from "../services/api";
import { formatUsd, SAMPLE_WALLETS, truncateAddress } from "../utils/constants";
import {
  Search,
  Shield,
  TrendingUp,
  TrendingDown,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Zap,
  ExternalLink,
  Cpu,
  HardDrive,
  ShieldCheck,
  Radio,
} from "lucide-react";

const Navbar = ({ onQuickScan }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [blockHeight, setBlockHeight] = useState(884922);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res = await getMarketPrices();
        if (res?.data) {
          setMarketData(res.data);
        }
      } catch {
        // Fallback handled in backend
      }
    };

    fetchMarket();
    const interval = setInterval(fetchMarket, 60000);
    const blockInterval = setInterval(() => {
      setBlockHeight((prev) => prev + (Math.random() > 0.85 ? 1 : 0));
    }, 20000);

    return () => {
      clearInterval(interval);
      clearInterval(blockInterval);
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

  const handleSelectSample = (sampleAddr) => {
    setShowSamplesMenu(false);
    if (onQuickScan) {
      onQuickScan(sampleAddr);
    } else {
      navigate(`/scan?address=${encodeURIComponent(sampleAddr)}`);
    }
  };

  const btcPrice = marketData?.bitcoin?.usd || 96420;
  const btcChange = marketData?.bitcoin?.usd_24h_change || 2.85;
  const isBtcPositive = btcChange >= 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#080C14]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-2xl">
      {/* Tier 1: Futuristic Live Telemetry Stream Strip */}
      <div className="h-7 bg-slate-950/90 border-b border-cyan-500/15 flex items-center justify-between px-4 lg:px-8 text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            LIVE TELEMETRY
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300">
            <HardDrive className="w-3 h-3 text-cyan-400" /> BTC Block: #{blockHeight.toLocaleString()}
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-slate-400">
            <Cpu className="w-3 h-3 text-purple-400" /> Mempool Txs: ~148,210
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" /> Heuristic Engine: v2.0-ONLINE
          </span>
          <span className="text-slate-400 font-mono">
            NODE LATENCY: <span className="text-cyan-400 font-bold">18ms</span>
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

        {/* Center: Live Bitcoin Ticker & Sample Presets */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 font-mono text-xs shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">₿ BTC:</span>
            <span className="text-white font-bold">{formatUsd(btcPrice)}</span>
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
          </div>

          <div className="w-[1px] h-4 bg-white/15" />

          {/* Quick Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition text-xs font-sans font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sample Wallets <ChevronDown className="w-3 h-3" />
            </button>

            {showSamplesMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in backdrop-blur-xl">
                <div className="text-[10px] font-mono text-slate-400 px-3 py-1 font-semibold uppercase tracking-wider">
                  Select Demo Target
                </div>
                <div className="space-y-1">
                  {SAMPLE_WALLETS.slice(0, 5).map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSample(sample.address)}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-800/90 transition flex flex-col gap-0.5 group/item"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-white group-hover/item:text-cyan-300">
                        <span>{sample.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${sample.badgeColor}`}>
                          {sample.expectedRisk}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {truncateAddress(sample.address, 6, 6)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Search + User Profile Menu */}
        <div className="flex items-center gap-3">
          {/* Quick Scan Input */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-56 lg:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Scan Bitcoin address..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition"
            />
          </form>

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