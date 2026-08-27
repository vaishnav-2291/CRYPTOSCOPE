import React from "react";
import { GitFork, ShieldAlert, ShieldCheck, AlertTriangle, ChevronRight, Layers } from "lucide-react";

export const RiskPropagationCard = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-24 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertTriangle className="w-4 h-4" /> Multi-Hop Risk Propagation Offline
        </div>
        <p>{error || "Unable to trace multi-hop exposure paths at this time."}</p>
      </div>
    );
  }

  const score = data.sanctionProximityScore || 0;
  const paths = data.exposurePaths || [];
  const level = data.riskLevel || "MINIMAL_EXPOSURE";

  const levelColors = {
    CRITICAL_EXPOSURE: "text-red-400 bg-red-500/20 border-red-500/40",
    ELEVATED_TRANSITIVE_EXPOSURE: "text-amber-400 bg-amber-500/20 border-amber-500/40",
    LOW_TRANSITIVE_EXPOSURE: "text-cyan-400 bg-cyan-500/20 border-cyan-500/40",
    MINIMAL_EXPOSURE: "text-emerald-400 bg-emerald-500/20 border-emerald-500/40",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <GitFork className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Multi-Hop Risk Propagation</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${levelColors[level] || "border-slate-800"}`}>
                {score}/100 PROXIMITY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Degrees of Separation: Exponential distance decay to sanctioned clusters (2–3 hops)
            </p>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.summaryStatement}
      </p>

      {/* Scanned Metrics */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hops Explored</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">{data.maxHopsExplored || 2} Hops</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Addresses Scanned</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">{data.totalUniqueAddressesScanned || 1}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Exposure Paths</div>
          <div className={`text-sm font-bold font-mono mt-0.5 ${paths.length > 0 ? "text-red-400" : "text-emerald-400"}`}>
            {paths.length}
          </div>
        </div>
      </div>

      {/* Exposure Paths if Any */}
      {paths.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Identified Proximity Paths
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {paths.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-red-300 font-bold">{p.distanceHops} Hops Away ({p.exposureType})</span>
                  <span className="text-red-400 font-semibold">+{p.riskContribution} pts risk</span>
                </div>
                <div className="text-[10px] text-slate-300 truncate">
                  Sanctioned Target: {p.sanctionedAddress}
                </div>
                <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                  <span>Path: {p.path?.join(" → ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskPropagationCard;
