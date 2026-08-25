import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScanHistory, getUserActivities, subscribeToRealtimeStream } from "../services/api";
import { formatBtc, truncateAddress, getRiskTheme } from "../utils/constants";
import {
  History as HistoryIcon,
  RefreshCw,
  Search,
  ExternalLink,
  ArrowRight,
  Activity,
  Layers,
  Clock,
  Shield,
  Radio,
} from "lucide-react";

function History() {
  const [activeTab, setActiveTab] = useState("scans"); // "scans" or "activities"
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [realtimeActive, setRealtimeActive] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, actRes] = await Promise.all([
        getScanHistory().catch(() => null),
        getUserActivities().catch(() => null),
      ]);

      if (histRes?.history) setHistory(histRes.history);
      if (actRes?.activities) setActivities(actRes.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to SSE real-time stream
    const unsubscribe = subscribeToRealtimeStream((event) => {
      if (event.type === "connected") {
        setRealtimeActive(true);
      } else if (event.type === "scan_completed") {
        setHistory((prev) => [event.data, ...prev]);
      } else if (event.type === "activity_logged") {
        setActivities((prev) => [event.data, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredHistory = history.filter(
    (w) =>
      !search ||
      w.address?.toLowerCase().includes(search.toLowerCase()) ||
      w.entityTag?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredActivities = activities.filter(
    (a) =>
      !search ||
      a.action?.toLowerCase().includes(search.toLowerCase()) ||
      a.resourceId?.toLowerCase().includes(search.toLowerCase()) ||
      a.userEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Header */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 relative group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-cyan-400" /> Persistent Audit Trail & History
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              MongoDB Backed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical log of all executed scans and user activities surviving server restarts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search address or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/10 transition"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("scans")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === "scans"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Wallet Scans ({filteredHistory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("activities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition ${
            activeTab === "activities"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>User Activities ({filteredActivities.length})</span>
        </button>
      </div>

      {/* Scans Tab */}
      {activeTab === "scans" && (
        <>
          {loading ? (
            <div className="py-12 text-center text-cyan-400 text-xs font-mono">
              Loading persistent scan history from MongoDB...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="cyber-card rounded-2xl p-12 text-center text-slate-400 text-xs font-mono border border-white/5">
              No scans performed yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {filteredHistory.map((wallet, idx) => {
                const theme = getRiskTheme(wallet.riskLevel || "Low");
                return (
                  <div
                    key={wallet._id || idx}
                    className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 space-y-3 relative group"
                  >
                    <span className="hud-bracket-tl" />
                    <span className="hud-bracket-br" />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Target Address
                        </span>
                        <span className="text-sm font-bold text-white break-all">
                          {truncateAddress(wallet.address, 10, 10)}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
                        {wallet.riskScore}/100 • {wallet.riskLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-center shadow-inner">
                      <div>
                        <span className="text-[10px] text-slate-500">Balance</span>
                        <div className="text-xs font-bold text-white">{formatBtc(wallet.balance)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Transfers</span>
                        <div className="text-xs font-bold text-cyan-400">{wallet.transactions || 0}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Inbound</span>
                        <div className="text-xs font-bold text-emerald-400">+{formatBtc(wallet.totalReceived)}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Scanned: {new Date(wallet.createdAt || Date.now()).toLocaleString()}</span>
                      <button
                        onClick={() => navigate(`/scan?address=${encodeURIComponent(wallet.address)}`)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                      >
                        <span>Inspect Target</span> <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Activities Tab */}
      {activeTab === "activities" && (
        <>
          {loading ? (
            <div className="py-12 text-center text-cyan-400 text-xs font-mono">
              Loading persistent user activities from MongoDB...
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="cyber-card rounded-2xl p-12 text-center text-slate-400 text-xs font-mono border border-white/5">
              No user activities recorded in MongoDB.
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              {filteredActivities.map((act) => (
                <div
                  key={act._id || act.id}
                  className="cyber-card p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {act.action}
                      </span>
                      <span className="text-white font-bold">{act.resourceType}</span>
                      {act.resourceId && (
                        <span className="text-slate-400 text-[11px]">({truncateAddress(act.resourceId, 6, 6)})</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">{JSON.stringify(act.details || {})}</p>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{new Date(act.createdAt || act.timestamp || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;