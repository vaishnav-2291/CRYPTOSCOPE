import React from "react";
import { Flame, Clock, AlertTriangle, ShieldCheck, Activity, ArrowUpRight } from "lucide-react";

export const CoinDaysDestroyedCard = ({ data, loading, error }) => {
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
          <AlertTriangle className="w-4 h-4" /> Coin Days Destroyed Telemetry Offline
        </div>
        <p>{error || "Unable to compute Coin Days Destroyed metrics for this address."}</p>
      </div>
    );
  }

  const metrics = data.metrics || {};
  const dormancy = data.dormancyClassification || {};
  const events = data.cddEvents || [];

  const signalColors = {
    ANOMALOUS_ANCIENT_COIN_WAKEUP: "text-red-400 border-red-500/40 bg-red-500/10",
    HIGH_DORMANCY_REACTIVATION: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    MODERATE_DORMANCY_CYCLE: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    STANDARD_CIRCULATION: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Coin Days Destroyed (CDD)</h3>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  signalColors[dormancy.reactivationSignal] || "border-slate-800 text-slate-300"
                }`}
              >
                {dormancy.reactivationSignal?.replace(/_/g, " ") || "STANDARD"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dormant-Coin Movement Signal: UTXO Amount × Days Unspent
            </p>
          </div>
        </div>
      </div>

      {/* Assessment */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {dormancy.assessment}
      </p>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total CDD</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
            {metrics.totalCoinDaysDestroyed || 0} CDD
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Peak Single-Tx CDD</div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              metrics.maxSingleTxCdd > 100 ? "text-orange-400" : "text-white"
            }`}
          >
            {metrics.maxSingleTxCdd || 0} CDD
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Coin Age</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {metrics.averageCoinAgeDays || 0} Days
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Unspent Coin Days</div>
          <div className="text-sm font-bold font-mono text-purple-300 mt-0.5">
            {metrics.accumulatedUnspentCoinDays || 0} CD
          </div>
        </div>
      </div>

      {/* Recent CDD Events Timeline */}
      {events.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> Notable Dormant-Coin Spending Events
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {events.map((ev) => (
              <div
                key={ev.txid}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-cyan-400">{ev.txid.slice(0, 8)}...{ev.txid.slice(-6)}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(ev.spendingTimestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-300">{ev.spentBtc} BTC</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      ev.coinDaysDestroyed > 100
                        ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {ev.coinDaysDestroyed} CDD
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honest Disclaimer */}
      <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
        <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-300">Methodology: </span>
          {data.heuristicDisclaimer || "Heuristic indicator / statistical on-chain dormancy pattern — not proof of intent."}
        </div>
      </div>
    </div>
  );
};

export default CoinDaysDestroyedCard;
