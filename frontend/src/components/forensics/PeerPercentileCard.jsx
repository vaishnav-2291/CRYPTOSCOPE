import React from "react";
import { BarChart3, Users, Award, AlertCircle } from "lucide-react";

export const PeerPercentileCard = ({ data, loading, error }) => {
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
          <AlertCircle className="w-4 h-4" /> Peer Ranking Offline
        </div>
        <p>{error || "Unable to compute live peer percentiles at this time."}</p>
      </div>
    );
  }

  const percentiles = data.peerPercentiles || {};
  const sample = data.networkComparisonSample || {};

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Live Peer Percentile Ranking</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {percentiles.topBalanceTier || "Top Tier"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked dynamically against a live sample of the last {sample.blocksSampledCount || 10} Bitcoin blocks
            </p>
          </div>
        </div>
      </div>

      {/* Ranking Narrative */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.rankingNarrative}
      </p>

      {/* 2-Column Gauge Breakdown */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Balance Ranking</span>
            <span className="font-mono font-bold text-cyan-400">{percentiles.topBalanceTier}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentiles.balancePercentile || 50}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 text-right">
            Balance: {data.balanceBtc?.toFixed(4)} BTC
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Volume Ranking</span>
            <span className="font-mono font-bold text-purple-400">{percentiles.topVolumeTier}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${percentiles.volumePercentile || 50}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-slate-400 text-right">
            Avg Tx: {data.avgTxSizeBtc?.toFixed(4)} BTC
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeerPercentileCard;
