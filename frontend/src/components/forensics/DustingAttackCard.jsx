import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink, ChevronDown, ChevronUp, Sparkles, Layers } from "lucide-react";

export const DustingAttackCard = ({ data, loading, error }) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-800 rounded w-1/3" />
            <div className="h-3 bg-slate-800/60 rounded w-1/2" />
          </div>
        </div>
        <div className="h-20 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" /> Live Dusting Telemetry Offline
        </div>
        <p>{error || "Live on-chain mempool data temporarily unavailable for this address."}</p>
      </div>
    );
  }

  const isVictim = data.isDustingVictim;
  const hazard = data.activeHazard || "NONE";
  const metrics = data.metrics || {};
  const campaigns = data.campaigns || [];

  const hazardColors = {
    HIGH: "border-red-500/40 bg-red-950/20 text-red-400",
    MEDIUM: "border-amber-500/40 bg-amber-950/20 text-amber-400",
    LOW: "border-cyan-500/40 bg-cyan-950/20 text-cyan-400",
    NONE: "border-emerald-500/40 bg-emerald-950/20 text-emerald-400",
  };

  return (
    <div className={`cyber-card rounded-2xl p-6 border ${hazardColors[hazard] || "border-slate-800"} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            hazard === "HIGH" ? "bg-red-500/20 border-red-500/50 text-red-400" :
            hazard === "MEDIUM" ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
            "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
          }`}>
            {isVictim ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Live Dusting-Attack Detector</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                hazard === "HIGH" ? "bg-red-500/20 border-red-500/40 text-red-300" :
                hazard === "MEDIUM" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}>
                {hazard} HAZARD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Economic Dust Threshold: <span className="font-mono text-cyan-300">≤ 546 sats</span> (0.00000546 BTC)
            </p>
          </div>
        </div>
      </div>

      {/* Primary Status & Summary */}
      <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.summaryDescription}
      </p>

      {/* 4-Column Live Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Unspent Dust UTXOs</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {metrics.unspentDustUtxosCount || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Dust Value</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
            {metrics.unspentDustSatoshis || 0} <span className="text-[10px] text-slate-400">sat</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Historical Dust Txs</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {metrics.totalDustTxsDetected || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Dust Satoshis</div>
          <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
            {metrics.totalHistoricalDustSatoshis || 0}
          </div>
        </div>
      </div>

      {/* Forensic Remediation Advice */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200/90 mb-3 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300">Forensic Guidance: </span>
          {data.remediationAdvice}
        </div>
      </div>

      {/* Expandable Campaign Transactions */}
      {campaigns.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-cyan-300 py-2 border-t border-slate-800/80 transition-colors"
          >
            <span>Inspect {campaigns.length} Identified Dusting Transaction(s)</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {campaigns.map((c, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex-1 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">{c.satoshis} sats</span>
                      {c.isMassFanout && (
                        <span className="px-1.5 py-0.2 bg-red-500/20 border border-red-500/40 text-red-300 rounded text-[9px]">
                          Fanout ({c.massFanoutDustOutputsCount} outputs)
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                      TX: {c.txid}
                    </div>
                  </div>
                  <a
                    href={`https://mempool.space/tx/${c.txid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors"
                    title="View on Mempool.space"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Source */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Source: {data.dataSource}</span>
        <span>Audited: {new Date(data.analyzedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default DustingAttackCard;
