import React, { useState } from "react";
import { Network, Link2, ExternalLink, ChevronDown, ChevronUp, AlertCircle, Sparkles } from "lucide-react";

export const AddressClusterCard = ({ data, loading, error, onSelectAddress }) => {
  const [showAll, setShowAll] = useState(false);

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
        <div className="h-24 bg-slate-800/40 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertCircle className="w-4 h-4" /> Cluster Engine Telemetry Offline
        </div>
        <p>{error || "Unable to compute live common-input clusters at this time."}</p>
      </div>
    );
  }

  const siblings = data.clusteredAddresses || [];
  const metrics = data.metrics || {};
  const displayedSiblings = showAll ? siblings : siblings.slice(0, 5);

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Common-Input Entity Clustering</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                {data.clusterSize || 1} ADDR CLUSTER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Heuristic: Multi-input co-spending co-ownership inference (Meiklejohn et al.)
            </p>
          </div>
        </div>
      </div>

      {/* Forensic Finding Summary */}
      <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.forensicAssessment}
      </p>

      {/* Quick Metrics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Multi-Input Txs</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">
            {metrics.multiInputTxsAnalyzed || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Co-Signer Sibling Addrs</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
            {siblings.length}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Co-Spent Volume</div>
          <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
            {data.totalCoSpentBtc?.toFixed(4) || "0.0000"} <span className="text-[10px] text-slate-400">BTC</span>
          </div>
        </div>
      </div>

      {/* Sibling Addresses List */}
      {siblings.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Linked Co-Signer Addresses</span>
            <span className="text-cyan-400 font-mono">{siblings.length} Found</span>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {displayedSiblings.map((s, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-300 font-semibold truncate max-w-[220px]">
                      {s.address}
                    </span>
                    {s.entityTag && (
                      <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[9px]">
                        {s.entityTag.name}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>{s.coSpentTxsCount} co-spent tx(s)</span>
                    <span>Vol: {s.totalCoSpentBtc?.toFixed(4)} BTC</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onSelectAddress && (
                    <button
                      onClick={() => onSelectAddress(s.address)}
                      className="px-2 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded text-[11px] font-medium transition-colors"
                    >
                      Audit
                    </button>
                  )}
                  <a
                    href={`https://mempool.space/address/${s.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="View on Explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {siblings.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 py-1 font-semibold flex items-center justify-center gap-1"
            >
              {showAll ? (
                <>Show Top 5 Sibling Addresses <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>View All {siblings.length} Clustered Addresses <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/30 border border-slate-800 text-xs text-slate-400 text-center">
          No multi-input co-spending sibling addresses identified in recent blocks.
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Method: {metrics.heuristicMethod}</span>
        <span>Filtered CoinJoins: {metrics.coinJoinTxsFiltered || 0}</span>
      </div>
    </div>
  );
};

export default AddressClusterCard;
