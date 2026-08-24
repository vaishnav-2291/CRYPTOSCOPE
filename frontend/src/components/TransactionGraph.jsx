import React, { useState } from "react";
import { formatBtc, truncateAddress } from "../utils/constants";
import { ExternalLink, Search, ZoomIn, ZoomOut, RefreshCw, ShieldAlert, Layers } from "lucide-react";

const TransactionGraph = ({ graphData = null, targetAddress = "", onSelectAddress }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="cyber-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
          <Layers className="w-8 h-8 opacity-60" />
        </div>
        <h3 className="text-lg font-semibold text-white">No Fund Flow Data Available</h3>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          This address has no confirmed transactions or counterparties to map fund flows.
        </p>
      </div>
    );
  }

  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  // Categorize nodes into Left (Sources), Center (Target), Right (Destinations)
  const targetNode = nodes.find((n) => n.id.toLowerCase() === targetAddress.toLowerCase()) || nodes[0];
  const sourceNodes = nodes.filter((n) => n.id !== targetNode.id && (n.type === "source" || n.type === "mixer" || edges.some((e) => e.source === n.id)));
  const destNodes = nodes.filter((n) => n.id !== targetNode.id && !sourceNodes.includes(n));

  // Compute SVG Layout coordinates
  const svgWidth = 840;
  const svgHeight = Math.max(480, Math.max(sourceNodes.length, destNodes.length, 1) * 90);

  const targetCoords = { x: svgWidth / 2, y: svgHeight / 2 };

  const getNodeCoords = (node, index, total, isLeft) => {
    if (node.id === targetNode.id) return targetCoords;
    const spacing = svgHeight / (total + 1);
    const y = spacing * (index + 1);
    const x = isLeft ? 120 : svgWidth - 120;
    return { x, y };
  };

  const coordsMap = new Map();
  coordsMap.set(targetNode.id, targetCoords);

  sourceNodes.forEach((node, idx) => {
    coordsMap.set(node.id, getNodeCoords(node, idx, sourceNodes.length, true));
  });

  destNodes.forEach((node, idx) => {
    coordsMap.set(node.id, getNodeCoords(node, idx, destNodes.length, false));
  });

  const getNodeColor = (node) => {
    if (node.id === targetNode.id) return "#00F2FE";
    if (node.entity?.isSanctioned) return "#EF4444";
    if (node.entity?.isMixer || node.type === "mixer") return "#F43F5E";
    if (node.entity) return "#38BDF8";
    if (sourceNodes.some((s) => s.id === node.id)) return "#10B981";
    return "#A855F7";
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <span className="text-cyan-400">🕸️</span> Fund Flow Network Graph
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              {nodes.length} Nodes • {edges.length} Transfers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing counterparty fund flows, entity classifications, and transaction routing hops.
          </p>
        </div>

        {/* Controls & Legend */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setSelectedNode(null); }}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mb-4 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Target Wallet</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Inbound Source</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Outbound Destination</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Mixer / Tumbler</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Verified Entity</span>
      </div>

      {/* Main SVG Flow Graph */}
      <div className="w-full overflow-x-auto rounded-xl bg-slate-950/60 border border-slate-800/80 p-2 flex justify-center">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s ease" }}>
          <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
            <defs>
              <linearGradient id="edgeGradInbound" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="edgeGradOutbound" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
              </linearGradient>
              <filter id="glowTarget" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Edges with Animated Flow Indicators */}
            {edges.map((edge, idx) => {
              const src = coordsMap.get(edge.source);
              const tgt = coordsMap.get(edge.target);
              if (!src || !tgt) return null;

              const isOut = edge.direction === "outbound" || edge.source === targetNode.id;
              const pathD = `M ${src.x} ${src.y} C ${(src.x + tgt.x) / 2} ${src.y}, ${(src.x + tgt.x) / 2} ${tgt.y}, ${tgt.x} ${tgt.y}`;

              return (
                <g key={`edge_${idx}`} className="cursor-pointer group">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isOut ? "url(#edgeGradOutbound)" : "url(#edgeGradInbound)"}
                    strokeWidth={Math.min(5, Math.max(1.5, (edge.amount || 0.1) * 2))}
                    strokeDasharray="4 4"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  {/* Amount label on edge midpoint */}
                  {edge.amount > 0 && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="JetBrains Mono"
                      textAnchor="middle"
                      className="bg-slate-900 px-1 py-0.5 rounded opacity-80"
                    >
                      {formatBtc(edge.amount)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const coords = coordsMap.get(node.id);
              if (!coords) return null;
              const isTarget = node.id === targetNode.id;
              const isSelected = selectedNode?.id === node.id;
              const nodeColor = getNodeColor(node);
              const radius = isTarget ? 32 : 22;

              return (
                <g
                  key={node.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Outer pulse ring for target or selected */}
                  {(isTarget || isSelected) && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      className="animate-ping opacity-30"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={radius}
                    fill="#0D1527"
                    stroke={isSelected ? "#FFF" : nodeColor}
                    strokeWidth={isTarget || isSelected ? 3 : 2}
                    filter={isTarget ? "url(#glowTarget)" : undefined}
                    className="transition-all duration-200 group-hover:scale-110"
                  />

                  {/* Icon or Monogram */}
                  <text
                    y="4"
                    fill="#FFF"
                    fontSize={isTarget ? "14" : "11"}
                    fontWeight="bold"
                    fontFamily="Space Grotesk"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {node.entity?.icon || (isTarget ? "🎯" : sourceNodes.some((s) => s.id === node.id) ? "📥" : "📤")}
                  </text>

                  {/* Node Label Below */}
                  <text
                    y={radius + 14}
                    fill={isTarget ? "#00F2FE" : "#E2E8F0"}
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    textAnchor="middle"
                    className="font-medium drop-shadow"
                  >
                    {node.entity?.name ? node.entity.name.slice(0, 18) : node.shortLabel || truncateAddress(node.id, 4, 4)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Node Inspector Modal / Drawer */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-xl">
              {selectedNode.entity?.icon || "🔍"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-white font-bold font-mono text-sm">{selectedNode.id}</h4>
                {selectedNode.entity && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedNode.entity.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                {selectedNode.entity?.description || `Network counterparty involved in recent fund routing with target address.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {onSelectAddress && selectedNode.id !== targetAddress && (
              <button
                onClick={() => onSelectAddress(selectedNode.id)}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Search className="w-3.5 h-3.5" /> Scan This Address
              </button>
            )}
            <a
              href={`https://mempool.space/address/${selectedNode.id}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
              title="View on Mempool.space"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionGraph;
