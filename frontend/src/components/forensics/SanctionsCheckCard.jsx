import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle, Scale, ExternalLink, CheckCircle2, Lock } from "lucide-react";

export const SanctionsCheckCard = ({ data, loading, error }) => {
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
          <AlertTriangle className="w-4 h-4" /> Sanctions Registry Offline
        </div>
        <p>{error || "Unable to sync with live US Treasury OFAC registry at this time."}</p>
      </div>
    );
  }

  const isSanctioned = data.isDirectSanctioned;
  const level = data.exposureLevel || "CLEAN";
  const dbInfo = data.sanctionsDatabase || {};
  const indirectMatches = data.indirectClusterMatches || [];

  return (
    <div className={`cyber-card rounded-2xl p-6 border ${
      isSanctioned ? "border-red-500/50 bg-red-950/20" :
      indirectMatches.length > 0 ? "border-amber-500/50 bg-amber-950/20" :
      "border-emerald-500/30 bg-slate-900/80"
    } backdrop-blur-xl transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            isSanctioned ? "bg-red-500/20 border-red-500/50 text-red-400" :
            indirectMatches.length > 0 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
            "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
          }`}>
            {isSanctioned ? <Lock className="w-6 h-6 animate-pulse" /> : <Scale className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Public Sanctions Cross-Check</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                isSanctioned ? "bg-red-500/20 border-red-500/40 text-red-300" :
                indirectMatches.length > 0 ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              }`}>
                {level.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              US Treasury OFAC Specially Designated Nationals (SDN) XBT Registry
            </p>
          </div>
        </div>
      </div>

      {/* Assessment Box */}
      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed mb-4 ${
        isSanctioned ? "bg-red-950/40 border-red-500/40 text-red-200" :
        indirectMatches.length > 0 ? "bg-amber-950/40 border-amber-500/40 text-amber-200" :
        "bg-slate-950/50 border-slate-800 text-slate-300"
      }`}>
        {data.assessment}
      </div>

      {/* Indirect Cluster Matches if any */}
      {indirectMatches.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-amber-950/30 border border-amber-500/40">
          <div className="text-[11px] font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Co-Clustered Sanctioned Addresses ({indirectMatches.length})
          </div>
          <div className="space-y-1 font-mono text-[11px] text-amber-200/90">
            {indirectMatches.map((addr, i) => (
              <div key={i} className="truncate p-1 bg-amber-950/60 rounded border border-amber-500/20">
                {addr}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Data Source Info */}
      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span>Registry Source:</span>
          <span className="text-slate-300 font-medium">{dbInfo.source || "Official US Treasury OFAC"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Total Sanctioned BTC Addrs Indexed:</span>
          <span className="font-mono text-cyan-400">{dbInfo.totalSanctionedBtcAddressesInRegistry || 0}</span>
        </div>
        {dbInfo.lastDatasetUpdate && (
          <div className="flex items-center justify-between">
            <span>Snapshot Timestamp:</span>
            <span className="font-mono text-slate-300">{new Date(dbInfo.lastDatasetUpdate).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SanctionsCheckCard;
