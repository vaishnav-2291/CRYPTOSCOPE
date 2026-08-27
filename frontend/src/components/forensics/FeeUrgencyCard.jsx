import React from "react";
import { Zap, Gauge, AlertTriangle, ExternalLink, Activity, Info } from "lucide-react";

export const FeeUrgencyCard = ({ data, loading, error }) => {
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
          <AlertTriangle className="w-4 h-4" /> Mempool Telemetry Offline
        </div>
        <p>{error || "Live mempool congestion telemetry temporarily unreachable."}</p>
      </div>
    );
  }

  const congestion = data.liveMempoolCongestion || {};
  const metrics = data.metrics || {};
  const urgencyLevel = data.urgencyLevel || "NORMAL";
  const urgencyScore = data.urgencyScore || 0;

  const levelColors = {
    HIGH: "text-red-400 bg-red-500/20 border-red-500/40",
    ELEVATED: "text-amber-400 bg-amber-500/20 border-amber-500/40",
    NORMAL: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Network Congestion & Fee Urgency</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${levelColors[urgencyLevel] || "border-slate-800"}`}>
                {urgencyLevel} URGENCY ({urgencyScore}/100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live priority fee overpay correlation (queue-jumping & capital flight signals)
            </p>
          </div>
        </div>
      </div>

      {/* Forensic Finding Box */}
      <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.forensicFinding}
      </p>

      {/* Live Mempool Telemetry Strip */}
      <div className="mb-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
        <div className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 animate-pulse" /> Live Bitcoin Mempool Telemetry
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <div className="text-[10px] text-slate-400">Fast Priority</div>
            <div className="font-mono font-bold text-white mt-0.5">
              {congestion.fastestFeeSatVb || "—"} <span className="text-[10px] text-slate-400">sat/vB</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Economy Fee</div>
            <div className="font-mono font-bold text-slate-300 mt-0.5">
              {congestion.hourFeeSatVb || "—"} <span className="text-[10px] text-slate-400">sat/vB</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Mempool Backlog</div>
            <div className="font-mono font-bold text-cyan-400 mt-0.5">
              {congestion.mempoolTotalVsizeMb || "0"} <span className="text-[10px] text-slate-400">vMB</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400">Unconfirmed Txs</div>
            <div className="font-mono font-bold text-purple-400 mt-0.5">
              {congestion.unconfirmedTxsCount?.toLocaleString() || "0"}
            </div>
          </div>
        </div>
      </div>

      {/* Address Specific Fee Behavior */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Fee Paid</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {metrics.averageFeeRateSatVb || 0} <span className="text-[10px] text-slate-400">sat/vB</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Peak Fee Rate</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-0.5">
            {metrics.highestFeeRateSatVb || 0} <span className="text-[10px] text-slate-400">sat/vB</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Overpay Txs</div>
          <div className={`text-sm font-bold font-mono mt-0.5 ${metrics.anomalousOverpayTxsCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {metrics.anomalousOverpayTxsCount || 0}
          </div>
        </div>
      </div>

      {/* Heuristic Disclaimer */}
      <div className="p-2.5 rounded-lg bg-slate-950/30 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          Note: Fee overpayment is evaluated as a <strong>heuristic urgency indicator (not proof of intent)</strong>.
        </span>
      </div>
    </div>
  );
};

export default FeeUrgencyCard;
