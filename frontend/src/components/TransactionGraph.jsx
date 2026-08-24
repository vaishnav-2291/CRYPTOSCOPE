import React, { useState } from "react";
import { formatBtc, truncateAddress } from "../utils/constants";
import { ExternalLink, Search, ZoomIn, ZoomOut, RefreshCw, ShieldAlert, Layers, Sparkles, Activity } from "lucide-react";

const TransactionGraph = ({ graphData = null, targetAddress = "", onSelectAddress }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="cyber-card rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[360px]">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
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

  const targetNode = nodes.find((n) => n.id.toLowerCase() === targetAddress.toLowerCase()) || nodes[0];
  const sourceNodes = nodes.filter(
    (n) => n.id !== targetNode.id && (n.type === "source" || n.type === "mixer" || edges.some((e) => e.source === n.id))
  );
  const destNodes = nodes.filter((n) => n.id !== targetNode.id && !sourceNodes.includes(n));

  const svgWidth = 860;
  const svgHeight = Math.max(480, Math.max(sourceNodes.length, destNodes.length, 1) * 95);

  const targetCoords = { x: svgWidth / 2, y: svgHeight / 2 };

  const getNodeCoords = (node, index, total, isLeft) => {
    if (node.id === targetNode.id) return targetCoords;
    const spacing = svgHeight / (total + 1);
    const y = spacing * (index + 1);
    const x = isLeft ? 130 : svgWidth - 130;
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
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 overflow-hidden relative group">
      {/* Sci-Fi HUD Corner Brackets */}
      <span className="hud-bracket-tl" />
      <span className="hud-bracket-tr" />
      <span className="hud-bracket-bl" />
      <span className="hud-bracket-br" />

      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" /> Interactive Fund Flow Network Graph
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              {nodes.length} Network Nodes • {edges.length} Directed Transfers
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualizing live counterparty routing, entity tags, and animated UTXO flow direction.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition shadow"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition shadow"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setSelectedNode(null); }}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition shadow"
            title="Reset View"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mb-4 bg-slate-950/60 p-3 rounded-xl border border-white/5 shadow-inner">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F2FE]" /> Target Wallet</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" /> Inbound Source</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7]" /> Outbound Destination</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#EF4444]" /> Mixer / Tumbler</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" /> Verified Entity</span>
      </div>

      {/* Main SVG Flow Graph Canvas */}
      <div className="w-full overflow-x-auto rounded-2xl bg-slate-950/80 border border-slate-800/90 p-4 flex justify-center shadow-inner relative">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.25s ease" }}>
          <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
            <defs>
              <linearGradient id="edgeGradInbound" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00F2FE" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="edgeGradOutbound" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00F2FE" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.6" />
              </linearGradient>

              {/* Glowing Filters */}
              <filter id="glowTarget" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowNode" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Bezier Edges */}
            {edges.map((edge, idx) => {
              const src = coordsMap.get(edge.source);
              const tgt = coordsMap.get(edge.target);
              if (!src || !tgt) return null;

              const isOut = edge.direction === "outbound" || edge.source === targetNode.id;
              const pathId = `flow_path_${idx}`;
              const pathD = `M ${src.x} ${src.y} C ${(src.x + tgt.x) / 2} ${src.y}, ${(src.x + tgt.x) / 2} ${tgt.y}, ${tgt.x} ${tgt.y}`;

              return (
                <g key={`edge_${idx}`} className="cursor-pointer group/edge">
                  <path
                    id={pathId}
                    d={pathD}
                    fill="none"
                    stroke={isOut ? "url(#edgeGradOutbound)" : "url(#edgeGradInbound)"}
                    strokeWidth={Math.min(5, Math.max(1.8, (edge.amount || 0.1) * 2))}
                    strokeDasharray="5 5"
                    className="opacity-70 group-hover/edge:opacity-100 transition-opacity"
                  />

                  {/* Animated Traveling Particle Packet along transfer line */}
                  <circle r="3" fill={isOut ? "#C084FC" : "#00F2FE"} filter="url(#glowNode)">
                    <animateMotion dur={`${2.5 + (idx % 3) * 0.8}s`} repeatCount="indefinite" path={pathD} />
                  </circle>

                  {/* Amount label on midpoint */}
                  {edge.amount > 0 && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 8}
                      fill="#CBD5E1"
                      fontSize="9.5"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] opacity-85"
                    >
                      {formatBtc(edge.amount)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Interactive Nodes */}
            {nodes.map((node) => {
              const coords = coordsMap.get(node.id);
              if (!coords) return null;
              const isTarget = node.id === targetNode.id;
              const isSelected = selectedNode?.id === node.id;
              const nodeColor = getNodeColor(node);
              const radius = isTarget ? 34 : 24;

              return (
                <g
                  key={node.id}
                  transform={`translate(${coords.x}, ${coords.y})`}
                  className="cursor-pointer group/node"
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Pulsing Beacon Ring for Target, Mixer or Exploit nodes */}
                  {(isTarget || node.entity?.isMixer || node.entity?.isSanctioned) && (
                    <circle
                      r={radius + 12}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      className="animate-beacon opacity-40"
                    />
                  )}

                  {/* Node Hexagon / Outer Glass Disc */}
                  <circle
                    r={radius}
                    fill="#080C14"
                    stroke={isSelected ? "#FFF" : nodeColor}
                    strokeWidth={isTarget || isSelected ? 3.5 : 2}
                    filter={isTarget ? "url(#glowTarget)" : "url(#glowNode)"}
                    className="transition-all duration-300 group-hover/node:scale-115"
                  />

                  {/* Node Inner Ring */}
                  <circle
                    r={radius - 5}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    className="opacity-40"
                  />

                  {/* Icon or Monogram */}
                  <text
                    y="5"
                    fill="#FFF"
                    fontSize={isTarget ? "15" : "12"}
                    fontWeight="bold"
                    fontFamily="Space Grotesk"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {node.entity?.icon || (isTarget ? "🎯" : sourceNodes.some((s) => s.id === node.id) ? "📥" : "📤")}
                  </text>

                  {/* Label Text */}
                  <text
                    y={radius + 16}
                    fill={isTarget ? "#00F2FE" : "#F8FAFC"}
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  >
                    {node.entity?.name ? node.entity.name.slice(0, 18) : node.shortLabel || truncateAddress(node.id, 4, 4)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected Node HUD Inspector Drawer */}
      {selectedNode && (
        <div className="mt-4 p-5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 shadow-2xl relative">
          <span className="hud-bracket-tl" />
          <span className="hud-bracket-tr" />
          <span className="hud-bracket-bl" />
          <span className="hud-bracket-br" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              {selectedNode.entity?.icon || "🔍"}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-white font-bold font-mono text-sm md:text-base break-all">{selectedNode.id}</h4>
                {selectedNode.entity && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm">
                    {selectedNode.entity.name}
                  </span>
                )}
                {selectedNode.entity?.isSanctioned && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/50">
                    OFAC SANCTIONED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {selectedNode.entity?.description || `Identified counterparty involved in recent UTXO fund transfers with the target address.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0">
            {onSelectAddress && selectedNode.id !== targetAddress && (
              <button
                onClick={() => onSelectAddress(selectedNode.id)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/25"
              >
                <Search className="w-3.5 h-3.5" /> Scan Target
              </button>
            )}
            <a
              href={`https://mempool.space/address/${selectedNode.id}`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition"
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
