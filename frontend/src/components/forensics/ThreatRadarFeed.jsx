import React, { useState, useEffect } from "react";
import { Radio, ShieldAlert, Zap, Flame, DollarSign, Scale, ExternalLink, RefreshCw, Filter, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { forensicsApi } from "../../services/forensicsApi";

export const ThreatRadarFeed = ({ onSelectAddress }) => {
  const [radarData, setRadarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("ALL");

  const fetchRadarFeed = async () => {
    try {
      setLoading(true);
      const data = await forensicsApi.getThreatRadarFeed(40);
      setRadarData(data);
      setError(null);
    } catch (err) {
      console.warn("Threat radar fetch notice:", err.message);
      setError("Threat Radar stream connecting to Mempool.space WebSocket...");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadarFeed();
    const interval = setInterval(fetchRadarFeed, 8000); // Polling refresh
    return () => clearInterval(interval);
  }, []);

  const threats = (radarData?.threats || []).filter((t) => {
    if (selectedFilter === "ALL") return true;
    return t.category === selectedFilter;
  });

  const categoryIcons = {
    DUSTING: <ShieldAlert className="w-4 h-4 text-amber-400" />,
    MIXER: <Zap className="w-4 h-4 text-purple-400" />,
    FEE_SPIKE: <Zap className="w-4 h-4 text-cyan-400" />,
    SANCTIONS: <Scale className="w-4 h-4 text-red-400" />,
    WHALE: <DollarSign className="w-4 h-4 text-emerald-400" />,
  };

  const severityBadges = {
    CRITICAL: "bg-red-500/20 text-red-300 border-red-500/40",
    HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    INFO: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-5">
      {/* Radar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 overflow-hidden">
            <Radio className="w-6 h-6 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/10 to-transparent animate-spin duration-1000" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Live Network-Wide Threat Radar</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" /> LIVE UNCONFIRMED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Continuous network-wide monitoring across mempool unconfirmed transaction queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchRadarFeed}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Network Threat KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Txs Scanned</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
            {(radarData?.stats?.totalScannedCount || 0).toLocaleString()}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fee Spikes (&gt;120 sat)</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {radarData?.stats?.feeSpikeCount || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Whale Transfers (&gt;10 BTC)</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {radarData?.stats?.whaleCount || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Stream Protocol</div>
          <div className="text-xs font-mono text-purple-300 mt-0.5 truncate">
            {radarData?.wsConnected ? "WebSocket 🟢" : "Mempool Poller 🟡"}
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {["ALL", "FEE_SPIKE", "WHALE", "DUSTING", "MIXER", "SANCTIONS"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedFilter(cat)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              selectedFilter === cat
                ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "bg-slate-950/50 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Threat Events Feed */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {threats.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/30 border border-slate-800/80 text-center text-slate-400 text-xs">
            <Activity className="w-6 h-6 text-cyan-400/60 mx-auto mb-2 animate-pulse" />
            <p className="font-semibold text-slate-300">Live Mempool Radar Active</p>
            <p className="text-[11px] text-slate-500 mt-1">Scanning unconfirmed transactions for anomalies...</p>
          </div>
        ) : (
          threats.map((event) => (
            <div
              key={event.id || event.txid}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1.5 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  {categoryIcons[event.category] || <Activity className="w-4 h-4 text-cyan-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-white tracking-wide">{event.category}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] border ${severityBadges[event.severity] || "border-slate-800 text-slate-300"}`}>
                      {event.severity}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(event.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{event.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                <span className="font-mono font-bold text-cyan-300 text-xs">{event.indicatorValue}</span>
                {event.txid && (
                  <a
                    href={`https://mempool.space/tx/${event.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-all"
                    title="Inspect raw transaction on Mempool.space"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Stream Provenance Footer */}
      <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span>Source: wss://mempool.space/api/v1/ws (Live Public Stream)</span>
        <span>Rate-limit protected ring buffer (60 max events)</span>
      </div>
    </div>
  );
};

export default ThreatRadarFeed;
