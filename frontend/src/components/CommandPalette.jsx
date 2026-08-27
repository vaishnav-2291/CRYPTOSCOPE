import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getScanHistory } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { truncateAddress } from "../utils/constants";
import {
  Search,
  LayoutDashboard,
  Shield,
  Layers,
  GitCompare,
  Eye,
  ShieldAlert,
  Activity,
  History,
  TrendingUp,
  Settings,
  Zap,
  Briefcase,
  ArrowRight,
  Clock,
  CornerDownLeft,
  X,
} from "lucide-react";

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [recentScans, setRecentScans] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Fetch actual live recent scans when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      if (isAuthenticated) {
        getScanHistory()
          .then((res) => {
            if (res?.history && Array.isArray(res.history)) {
              setRecentScans(res.history.slice(0, 5));
            }
          })
          .catch(() => {});
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, isAuthenticated]);

  const navActions = [
    { id: "dashboard", name: "Overview Dashboard", category: "Navigation", path: "/", icon: LayoutDashboard },
    { id: "scan", name: "Wallet Analyzer & Scan", category: "Analyze", path: "/scan", icon: Search },
    { id: "forensics", name: "Forensics Intelligence Terminal", category: "Investigate", path: "/forensics", icon: Zap, badge: "v2.0" },
    { id: "cases", name: "Investigation Case Workspace", category: "Investigate", path: "/cases", icon: Briefcase, badge: "v3.0" },
    { id: "batch", name: "Batch Multi-Scan", category: "Analyze", path: "/batch", icon: Layers, badge: "New" },
    { id: "compare", name: "Wallet Comparison Matrix", category: "Analyze", path: "/compare", icon: GitCompare },
    { id: "watchlist", name: "Risk Watchlist & Alerts", category: "Monitor", path: "/watchlist", icon: Eye },
    { id: "threat", name: "Live Threat Radar (SOC)", category: "Monitor", path: "/threat", icon: ShieldAlert },
    { id: "soc", name: "SOC Network Monitor", category: "Monitor", path: "/soc", icon: Activity },
    { id: "market", name: "Live Market Intelligence", category: "Monitor", path: "/market", icon: TrendingUp },
    { id: "history", name: "Persistent Audit Trail & History", category: "Investigate", path: "/history", icon: History },
  ];

  if (isAdmin) {
    navActions.push({
      id: "admin",
      name: "Admin Governance Console",
      category: "Management",
      path: "/admin",
      icon: Settings,
      badge: "Admin",
    });
  }

  // Determine if query looks like a Bitcoin address
  const isAddressQuery =
    query.trim().length >= 14 &&
    (/^(1|3|bc1|tb1|[2mn])/i.test(query.trim()) || query.trim().length > 25);

  const filteredNav = query.trim()
    ? navActions.filter(
        (item) =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : navActions;

  // Flatten active items for keyboard index selection
  const flatItems = [];
  if (isAddressQuery) {
    flatItems.push({ type: "address", address: query.trim() });
  }
  filteredNav.forEach((item) => flatItems.push({ type: "nav", ...item }));
  if (!query.trim() && recentScans.length > 0) {
    recentScans.forEach((scan) => flatItems.push({ type: "recent", ...scan }));
  }

  const handleSelect = (item) => {
    if (!item) return;
    if (item.type === "address") {
      navigate(`/scan?address=${encodeURIComponent(item.address)}`);
    } else if (item.type === "nav") {
      navigate(item.path);
    } else if (item.type === "recent") {
      navigate(`/scan?address=${encodeURIComponent(item.address)}`);
    }
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < flatItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex]);
      } else if (query.trim()) {
        navigate(`/scan?address=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 sm:pt-28 p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative z-10 w-full max-w-xl rounded-2xl bg-[#0D1527]/95 border border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/60">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search tools, pages, or paste any Bitcoin address..."
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-slate-400 border border-slate-700">
                ESC
              </kbd>
            </div>

            {/* Results Container */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-3">
              {/* Direct Address Scan Action */}
              {isAddressQuery && (
                <div className="p-1">
                  <div
                    onClick={() => handleSelect({ type: "address", address: query.trim() })}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                      selectedIndex === 0
                        ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                        : "bg-slate-900/60 border border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          Run Live Forensics Audit
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-normal">(Direct Address)</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">{query.trim()}</div>
                      </div>
                    </div>
                    <CornerDownLeft className="w-4 h-4 text-cyan-400 shrink-0" />
                  </div>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Platform Tools & Modules
                </div>
                {filteredNav.map((item, idx) => {
                  const Icon = item.icon;
                  const itemIndex = isAddressQuery ? idx + 1 : idx;
                  const isSelected = selectedIndex === itemIndex;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect({ type: "nav", ...item })}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition text-xs font-medium ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 font-semibold"
                          : "text-slate-300 hover:bg-slate-900/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {item.badge}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Recent Scans (Only if query is empty) */}
              {!query.trim() && recentScans.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" /> Recent Live Scans
                  </div>
                  {recentScans.map((scan, idx) => {
                    const itemIndex = filteredNav.length + idx;
                    const isSelected = selectedIndex === itemIndex;

                    return (
                      <div
                        key={scan._id || idx}
                        onClick={() => handleSelect({ type: "recent", ...scan })}
                        onMouseEnter={() => setSelectedIndex(itemIndex)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition text-xs font-mono ${
                          isSelected
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "text-slate-300 hover:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate text-white">{truncateAddress(scan.address, 10, 10)}</span>
                          {scan.entityTag?.name && (
                            <span className="text-[10px] text-cyan-400 font-sans">({scan.entityTag.name})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] shrink-0">
                          <span className="text-purple-400 font-bold">{scan.riskScore || 0}/100</span>
                          <span className="text-slate-500">{new Date(scan.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2 bg-slate-950/90 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span>Navigate: <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded">↑</kbd> <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded">↓</kbd></span>
                <span>Select: <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-700 rounded">↵</kbd></span>
              </div>
              <span className="text-cyan-400">CryptoScope AI Command Hub</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
