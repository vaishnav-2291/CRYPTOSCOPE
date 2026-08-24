import React, { useState, useEffect } from "react";
import { getWatchlist, addToWatchlist, removeFromWatchlist, rescanWatchlist } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { SAMPLE_WALLETS, truncateAddress, getRiskTheme } from "../utils/constants";
import {
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Search,
  CheckCircle2,
  Bell,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const WatchlistManager = ({ onSelectAddress }) => {
  const { isAuthenticated } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState(null);
  const [alertChanges, setAlertChanges] = useState([]);

  const fetchList = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getWatchlist();
      if (res?.watchlist) {
        setWatchlist(res.watchlist);
      }
    } catch (err) {
      setError("Failed to load watchlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [isAuthenticated]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newAddress.trim()) return;

    try {
      setError(null);
      const res = await addToWatchlist(newAddress.trim(), newLabel.trim());
      if (res?.watchlist) {
        setWatchlist(res.watchlist);
        setNewAddress("");
        setNewLabel("");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to add wallet.");
    }
  };

  const handleRemove = async (addr) => {
    try {
      const res = await removeFromWatchlist(addr);
      if (res?.watchlist) {
        setWatchlist(res.watchlist);
      }
    } catch (err) {
      setError("Failed to remove address.");
    }
  };

  const handleRescanAll = async () => {
    try {
      setRescanning(true);
      setError(null);
      const res = await rescanWatchlist();
      if (res?.watchlist) {
        setWatchlist(res.watchlist);
        if (res.changes && res.changes.length > 0) {
          setAlertChanges(res.changes);
        }
      }
    } catch (err) {
      setError("Failed to re-scan watchlist.");
    } finally {
      setRescanning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="cyber-card rounded-2xl p-12 text-center border border-cyan-500/20">
        <Eye className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-60" />
        <h3 className="text-xl font-bold font-heading text-white">Watchlist & Risk Alerts</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
          Sign in to pin wallets, track risk score shifts over time, and receive automated in-app risk alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/25 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold font-heading text-white">Wallet Risk Watchlist</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pin critical target addresses to monitor risk deviations, score shifts, and fund flow movements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRescanAll}
            disabled={rescanning || watchlist.length === 0}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-medium border border-cyan-500/30 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? "animate-spin" : ""}`} />
            {rescanning ? "Re-scanning All Targets..." : "Re-Scan All Watchlist"}
          </button>
        </div>
      </div>

      {/* Alert Banner for Score Changes */}
      {alertChanges.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Risk Score Changes Detected ({alertChanges.length} Addresses)</span>
          </div>
          <div className="space-y-1">
            {alertChanges.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-slate-200 font-mono">
                <span>{c.label} ({truncateAddress(c.address, 6, 6)}):</span>
                <span className={`font-bold ${c.diff > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {c.oldScore} → {c.newScore} ({c.diff > 0 ? `+${c.diff}` : c.diff} pts)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add to Watchlist Form */}
      <form onSubmit={handleAdd} className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-3">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-cyan-400" /> Add Address to Monitoring Watchlist
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Bitcoin Address (e.g. 1A1zP1e...)"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="md:col-span-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Custom Label (e.g. Cold Vault / OTC Desk)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {error && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add to Watchlist
          </button>
        </div>
      </form>

      {/* Watchlist Table */}
      {watchlist.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Your watchlist is currently empty. Add Bitcoin addresses above to monitor their risk status.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Label</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Last Risk Score</th>
                <th className="py-3 px-4">Added Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {watchlist.map((item) => {
                const theme = getRiskTheme(item.lastRiskLevel);
                return (
                  <tr key={item.address} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-semibold text-white">
                      {item.label}
                    </td>
                    <td className="py-3 px-4 text-cyan-300">
                      {truncateAddress(item.address, 8, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
                        {item.lastRiskScore}/100 • {item.lastRiskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(item.addedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {onSelectAddress && (
                        <button
                          onClick={() => onSelectAddress(item.address)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Search className="w-3 h-3" /> Scan
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(item.address)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition inline-flex items-center"
                        title="Remove from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WatchlistManager;
