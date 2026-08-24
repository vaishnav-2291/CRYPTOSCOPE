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
} from "lucide-react";

const Navbar = ({ onQuickScan }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [marketData, setMarketData] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);

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
    const interval = setInterval(fetchMarket, 60000); // 60s live update
    return () => clearInterval(interval);
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
      navigate(`/?scan=${encodeURIComponent(searchInput.trim())}`);
    }
    setSearchInput("");
  };

  const handleSelectSample = (sampleAddr) => {
    setShowSamplesMenu(false);
    if (onQuickScan) {
      onQuickScan(sampleAddr);
    } else {
      navigate(`/?scan=${encodeURIComponent(sampleAddr)}`);
    }
  };

  const btcPrice = marketData?.bitcoin?.usd || 96420;
  const btcChange = marketData?.bitcoin?.usd_24h_change || 2.85;
  const isBtcPositive = btcChange >= 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-[#080C14]/90 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <div className="w-full h-full bg-[#080C14] rounded-[11px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold font-heading text-white tracking-wide">
                Crypto<span className="text-cyan-400">Scope</span> <span className="text-xs font-mono text-cyan-300 font-normal px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">AI 2.0</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Live Bitcoin Ticker & Sparkline */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">₿ BTC:</span>
            <span className="text-white font-bold">{formatUsd(btcPrice)}</span>
            <span
              className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[11px] font-bold ${
                isBtcPositive
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-rose-400 bg-rose-500/10"
              }`}
            >
              {isBtcPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {isBtcPositive ? "+" : ""}
              {btcChange.toFixed(2)}%
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10" />

          {/* Quick Presets Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSamplesMenu(!showSamplesMenu)}
              className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition text-xs font-sans font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sample Wallets <ChevronDown className="w-3 h-3" />
            </button>

            {showSamplesMenu && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-1">
                  Select Preset Target
                </div>
                {SAMPLE_WALLETS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSample(sample.address)}
                    className="w-full text-left p-2 rounded-lg hover:bg-cyan-500/10 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300">
                        {sample.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {truncateAddress(sample.address, 6, 6)}
                      </div>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${sample.badgeColor}`}>
                      {sample.expectedRisk}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Address Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-64 lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Scan Bitcoin address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
          />
        </form>

        {/* Right User Navigation */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-xs">
                  {user?.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user?.name || "User"}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 uppercase">
                    {isAdmin ? "Admin" : "Analyst"}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in">
                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                  >
                    <User className="w-3.5 h-3.5" /> Profile & Stats
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition"
                    >
                      <Zap className="w-3.5 h-3.5" /> Admin Console
                    </Link>
                  )}
                  <Link
                    to="/watchlist"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-cyan-500/10 transition"
                  >
                    <Bell className="w-3.5 h-3.5" /> Watchlist ({watchlistCount})
                  </Link>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;