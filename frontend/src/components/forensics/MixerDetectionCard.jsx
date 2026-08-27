import React from "react";
import { Shuffle, ShieldAlert, ShieldCheck, AlertTriangle, ExternalLink } from "lucide-react";

export const MixerDetectionCard = ({ data, loading, error }) => {
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
          <AlertTriangle className="w-4 h-4" /> Mixer Detection Offline
        </div>
        <p>{error || "Unable to analyze mixer fingerprints at this time."}</p>
      </div>
    );
  }

  const isParticipant = data.isMixerParticipant;
  const level = data.mixerExposureLevel || "NONE";
  const rounds = data.detectedMixRounds || [];

  return (
    <div className={`cyber-card rounded-2xl p-6 border ${
      level === "HIGH" ? "border-red-500/50 bg-red-950/20" :
      level === "MODERATE" ? "border-amber-500/50 bg-amber-950/20" :
      "border-emerald-500/30 bg-slate-900/80"
    } backdrop-blur-xl space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
            isParticipant ? "bg-purple-500/20 border-purple-500/50 text-purple-400" : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
          }`}>
            <Shuffle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">CoinJoin / Mixer Fingerprint Detector</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${
                level === "HIGH" ? "bg-red-500/20 text-red-300 border-red-500/40" :
                level === "MODERATE" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}>
                {level} MIXER EXPOSURE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Whirlpool & Wasabi structural equal-output entropy analysis
            </p>
          </div>
        </div>
      </div>

      {/* Forensic Summary */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.forensicSummary}
      </p>

      {/* Identified Mix Rounds */}
      {rounds.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Identified Collaborative Mixing Rounds ({rounds.length})
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {rounds.map((r, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 font-mono">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400 font-bold">{r.protocol}</span>
                    <span className="text-slate-400 text-[11px]">({r.poolDenominationBtc} BTC Pool)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    TX: {r.txid} • {r.matchingEqualOutputsCount} Equal Outputs
                  </div>
                </div>
                <a
                  href={`https://mempool.space/tx/${r.txid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                  title="View Transaction"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 text-center">
          No CoinJoin or Whirlpool pool transactions detected in recent history.
        </div>
      )}
    </div>
  );
};

export default MixerDetectionCard;
