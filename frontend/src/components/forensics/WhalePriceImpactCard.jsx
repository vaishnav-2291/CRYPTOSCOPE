import React from "react";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Activity, ExternalLink } from "lucide-react";

export const WhalePriceImpactCard = ({ data, loading, error }) => {
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
          <AlertCircle className="w-4 h-4" /> Whale Price Correlation Offline
        </div>
        <p>{error || "Unable to sync historical market chart correlations at this time."}</p>
      </div>
    );
  }

  const correlations = data.correlations || [];

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Whale Move vs. Price Impact</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MEMPOOL + COINGECKO
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating large transfers (≥ 1.0 BTC) with historical spot market price swings
            </p>
          </div>
        </div>
      </div>

      {/* Summary Narrative */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.summaryFinding}
      </p>

      {/* Correlations List */}
      {correlations.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Correlated Whale Moves ({correlations.length})
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar text-xs">
            {correlations.map((c, i) => {
              const isPositive = c.priceDeltaPct >= 0;
              return (
                <div key={i} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{c.volumeBtc?.toFixed(2)} BTC</span>
                      <span className="text-slate-400 text-[10px]">({new Date(c.txTimestamp).toLocaleDateString()})</span>
                    </div>
                    <div className={`flex items-center gap-1 font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                      {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      <span>{isPositive ? "+" : ""}{c.priceDeltaPct}% 4h Swing</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-900">
                    <span>Spot Window: ${c.btcPriceAtWindowStartUsd?.toLocaleString()} → ${c.btcPriceAtWindowEndUsd?.toLocaleString()}</span>
                    <a
                      href={`https://mempool.space/tx/${c.txid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-0.5"
                    >
                      TX <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="text-[10px] text-slate-300 font-sans italic pt-0.5">
                    {c.marketObservation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 text-center">
          No transactions exceeding 1.0 BTC found in recent history.
        </div>
      )}
    </div>
  );
};

export default WhalePriceImpactCard;
