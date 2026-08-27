import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Radio,
  RefreshCw,
  Zap,
} from "lucide-react";
import { forensicsApi } from "../../services/forensicsApi";

export const LiveFundFlowGraph = ({ data, loading, error, onSelectAddress, targetAddress }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [liveNodes, setLiveNodes] = useState([]);
  const [liveEdges, setLiveEdges] = useState([]);
  const [newlyAddedNodeIds, setNewlyAddedNodeIds] = useState(new Set());
  const [lastPollTime, setLastPollTime] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Sync initial data from props
  useEffect(() => {
    if (data?.nodes) {
      setLiveNodes(data.nodes);
      setLiveEdges(data.edges || []);
      setNewlyAddedNodeIds(new Set());
    }
  }, [data]);

  const effectiveAddress =
    targetAddress ||
    data?.targetAddress ||
    (data?.nodes || []).find((n) => n.isTarget)?.fullAddress ||
    (data?.nodes || [])[0]?.fullAddress;

  // Live polling effect every 15s when isLiveStreaming is active
  useEffect(() => {
    let interval = null;

    if (isLiveStreaming && effectiveAddress) {
      const pollLiveFlows = async () => {
        try {
          setIsPolling(true);
          const freshData = await forensicsApi.getFundFlowGraph(effectiveAddress, 2, 30);
          setLastPollTime(new Date().toLocaleTimeString());

          if (freshData?.nodes && Array.isArray(freshData.nodes)) {
            setLiveNodes((prevNodes) => {
              const existingIds = new Set(prevNodes.map((n) => n.id));
              const newNodes = freshData.nodes.filter((n) => !existingIds.has(n.id));

              if (newNodes.length > 0) {
                const newIds = new Set(newNodes.map((n) => n.id));
                setNewlyAddedNodeIds(newIds);
                // Clear the pulse highlight after 5 seconds
                setTimeout(() => {
                  setNewlyAddedNodeIds(new Set());
                }, 5000);
                return [...prevNodes, ...newNodes];
              }
              return prevNodes;
            });

            if (freshData.edges && Array.isArray(freshData.edges)) {
              setLiveEdges((prevEdges) => {
                const edgeKeys = new Set(prevEdges.map((e) => `${e.source}->${e.target}`));
                const newEdges = freshData.edges.filter((e) => !edgeKeys.has(`${e.source}->${e.target}`));
                return [...prevEdges, ...newEdges];
              });
            }
          }
        } catch (err) {
          console.error("Live fund flow polling error:", err);
        } finally {
          setIsPolling(false);
        }
      };

      // Run initial check and then set 15-second interval
      pollLiveFlows();
      interval = setInterval(pollLiveFlows, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLiveStreaming, effectiveAddress]);

  if (loading) {
    return (
      <div className="cyber-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-spin">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white tracking-wide">Tracing Recursive On-Chain Fund Flows...</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          Querying live Mempool.space UTXO graph across 1–2 transaction hops.
        </p>
      </div>
    );
  }

  if (error || !data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="cyber-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[380px] border border-slate-800 bg-slate-900/40">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white">No Fund Flow Graph Available</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          {error || "This wallet has no confirmed on-chain transactions or counterparties to map."}
        </p>
      </div>
    );
  }

  const nodes = liveNodes.length > 0 ? liveNodes : data.nodes || [];
  const edges = liveEdges.length > 0 ? liveEdges : data.edges || [];
  const summary = data.summary || {};

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-wide">Recursive Fund-Flow Visualizer</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {data.maxHops || 2} HOPS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapped <span className="font-mono text-cyan-400">{nodes.length}</span> nodes &{" "}
            <span className="font-mono text-cyan-400">{edges.length}</span> directed live flow edges.
          </p>
        </div>

        {/* Action Controls & Live Stream Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Live Stream Toggle */}
          <button
            onClick={() => setIsLiveStreaming((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 shadow-sm ${
              isLiveStreaming
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-emerald-500/20"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Poll live mempool every 15s for incoming on-chain fund flows"
          >
            <Radio className={`w-3.5 h-3.5 ${isLiveStreaming ? "animate-pulse text-emerald-400" : ""}`} />
            <span>Live Stream</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveStreaming ? "bg-emerald-400 animate-ping" : "bg-slate-600"
              }`}
            />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Stream Telemetry Banner (When Enabled) */}
      {isLiveStreaming && (
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px] font-mono text-emerald-300 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live mempool stream active • Polling every 15s</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            {isPolling && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
            <span>Last check: {lastPollTime || "Initial polling..."}</span>
          </div>
        </div>
      )}

      {/* Interactive Visual Graph Canvas */}
      <div className="relative w-full h-[380px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center p-4">
        {/* Ambient Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div
          className="relative w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Render Graph Nodes */}
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl p-2">
            {nodes.slice(0, 24).map((node) => {
              const isTarget = node.isTarget;
              const isTx = node.type === "transaction";
              const isMixer = node.type === "mixer";
              const isSanctioned = node.type === "sanctioned";
              const isNewlyAdded = newlyAddedNodeIds.has(node.id);

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`relative group px-3.5 py-2.5 rounded-xl border text-left transition-all duration-300 flex flex-col justify-between ${
                    isNewlyAdded
                      ? "ring-2 ring-emerald-400 animate-pulse shadow-[0_0_25px_rgba(16,185,129,0.7)] scale-110"
                      : selectedNode?.id === node.id
                      ? "ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                      : "hover:scale-105"
                  } ${
                    isTarget
                      ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      : isSanctioned
                      ? "bg-red-950/60 border-red-500 text-red-300"
                      : isMixer
                      ? "bg-purple-950/60 border-purple-500 text-purple-300"
                      : isTx
                      ? "bg-slate-900/80 border-slate-700 text-slate-300"
                      : "bg-slate-950/60 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isNewlyAdded
                          ? "bg-emerald-400 animate-ping"
                          : isTarget
                          ? "bg-cyan-400 animate-ping"
                          : isSanctioned
                          ? "bg-red-500"
                          : isMixer
                          ? "bg-purple-500"
                          : "bg-slate-500"
                      }`}
                    />
                    <span className="text-xs font-bold font-mono truncate max-w-[130px]">
                      {node.label || node.id}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    {isTx ? (
                      <span>Vol: {node.volumeBtc?.toFixed(4)} BTC</span>
                    ) : node.inflowBtc ? (
                      <span className="text-emerald-400">+{node.inflowBtc?.toFixed(4)} BTC</span>
                    ) : node.outflowBtc ? (
                      <span className="text-amber-400">-{node.outflowBtc?.toFixed(4)} BTC</span>
                    ) : (
                      <span>Hop {node.hop ?? 0}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Node Detail Popover Drawer */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md p-3.5 rounded-xl bg-slate-900/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl z-20 text-xs">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">{selectedNode.label}</span>
                {selectedNode.isTarget && (
                  <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 rounded text-[9px]">TARGET WALLET</span>
                )}
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
              {selectedNode.fullAddress && (
                <div className="truncate">
                  <span className="text-slate-400">Address: </span>
                  {selectedNode.fullAddress}
                </div>
              )}
              {selectedNode.txid && (
                <div className="truncate">
                  <span className="text-slate-400">TXID: </span>
                  {selectedNode.txid}
                </div>
              )}
              {selectedNode.entityTag && (
                <div>
                  <span className="text-slate-400">Identified Entity: </span>
                  <span className="text-cyan-400 font-semibold">{selectedNode.entityTag.name}</span>
                </div>
              )}
            </div>

            {selectedNode.fullAddress && onSelectAddress && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => onSelectAddress(selectedNode.fullAddress)}
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-center transition-colors"
                >
                  Analyze This Counterparty →
                </button>
                <a
                  href={`https://mempool.space/address/${selectedNode.fullAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-4">
          <span>Counterparties: <strong className="text-white">{summary.counterpartiesDiscovered || 0}</strong></span>
          <span>Sanctioned Hops: <strong className={summary.sanctionedNodesCount > 0 ? "text-red-400" : "text-emerald-400"}>{summary.sanctionedNodesCount || 0}</strong></span>
          <span>Mixer Hops: <strong className={summary.mixerNodesCount > 0 ? "text-purple-400" : "text-emerald-400"}>{summary.mixerNodesCount || 0}</strong></span>
        </div>
        <span className="text-cyan-400/80">{data.source}</span>
      </div>
    </div>
  );
};

export default LiveFundFlowGraph;
