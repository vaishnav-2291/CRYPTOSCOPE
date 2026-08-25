import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSecurityAlerts, subscribeToRealtimeStream } from "../services/api";
import { formatBtc, formatUsd, truncateAddress } from "../utils/constants";
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  ExternalLink,
  Shield,
  Zap,
  Play,
  CheckCircle2,
  Lock,
  Cpu,
  Layers,
  Search,
  Sliders,
  RefreshCw,
} from "lucide-react";

const SOCDashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [realtimeActive, setRealtimeActive] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await getSecurityAlerts();
      if (res?.alerts) {
        setIncidents(res.alerts);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Subscribe to live SSE Stream for real-time alerts
    const unsubscribe = subscribeToRealtimeStream((event) => {
      if (event.type === "connected") {
        setRealtimeActive(true);
      } else if (event.type === "alert_triggered") {
        setIncidents((prev) => [event.data, ...prev]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity === "ALL") return true;
    return inc.severity === filterSeverity;
  });

  const getSeverityStyle = (severity) => {
    if (severity === "CRITICAL")
      return "bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
    if (severity === "HIGH")
      return "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    if (severity === "MEDIUM")
      return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
    return "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  return (
    <div className="space-y-8 animate-in fade-in select-none">
      {/* Top Command Banner */}
      <div className="cyber-card cyber-card-glow rounded-3xl p-6 md:p-8 border border-cyan-500/30 relative overflow-hidden group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        {/* Ambient Laser Sweeper */}
        <div className="scan-line-effect" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <span className={`w-2 h-2 rounded-full ${realtimeActive ? "bg-emerald-400 animate-ping" : "bg-cyan-400"}`} />
              <span>SECURITY OPERATIONS CENTER (SOC) CONSOLE • {realtimeActive ? "SSE STREAM LIVE" : "ONLINE"}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold font-heading text-white tracking-tight leading-tight">
              24/7 On-Chain <span className="text-gradient-cyan">SOC Threat Monitor</span>
            </h1>

            <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-sans leading-relaxed">
              Continuous UTXO intrusion monitoring, deterministic rule-trigger stream, automated incident triage, and real-time MongoDB incident persistence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAlerts}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition flex items-center gap-2 text-xs font-mono cursor-pointer"
              title="Refresh Incidents"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time SOC Telemetry Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>TOTAL INCIDENTS</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-cyan-300 my-2">{incidents.length}</div>
          <span className="text-[11px] text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Persisted In MongoDB
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-emerald-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>REAL-TIME SSE</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 my-2">{realtimeActive ? "ONLINE" : "READY"}</div>
          <span className="text-[11px] text-emerald-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Push Event Broadcaster
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-rose-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CRITICAL / HIGH</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-rose-400 my-2">
            {incidents.filter((i) => i.severity === "CRITICAL" || i.severity === "HIGH").length}
          </div>
          <span className="text-[11px] text-rose-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Requiring SOC Review
          </span>
        </div>

        <div className="cyber-card rounded-2xl p-5 border border-purple-500/20 space-y-1 relative group">
          <span className="hud-bracket-tl" />
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MEAN TIME TO DETECT</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-purple-300 my-2">420ms</div>
          <span className="text-[11px] text-purple-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Deterministic Pipeline
          </span>
        </div>
      </div>

      {/* Incident Severity Filter Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition ${
                filterSeverity === sev
                  ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25"
                  : "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5"
              }`}
            >
              {sev === "ALL" ? "ALL INCIDENTS" : `${sev} ALERTS`}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing <span className="text-cyan-400 font-bold">{filteredIncidents.length}</span> Persisted Events
        </span>
      </div>

      {/* Live SIEM-Style Incident Feed Table */}
      <div className="cyber-card rounded-3xl p-6 border border-cyan-500/20 space-y-4 relative group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" /> Live Blockchain Intrusion & Incident Stream
          </h3>
          <span className="text-xs font-mono text-slate-400">MongoDB Collection: SecurityAlerts</span>
        </div>

        {filteredIncidents.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-mono text-xs space-y-2">
            <ShieldAlert className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <div className="text-white font-bold text-sm">No security incidents detected</div>
            <p className="text-slate-500 text-[11px] max-w-md mx-auto">
              Real-time intrusion alerts are automatically generated and persisted whenever high-risk, mixer, or OFAC-sanctioned wallets are identified during scans.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIncidents.map((incident) => (
              <div
                key={incident._id || incident.incidentId}
                onClick={() => setSelectedIncident(incident)}
                className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/40 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 group/row shadow-inner"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs font-mono flex-shrink-0 border ${getSeverityStyle(
                      incident.severity
                    )}`}
                  >
                    {incident.severity[0]}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="text-white font-bold">{incident.incidentId || incident.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{new Date(incident.createdAt || Date.now()).toLocaleTimeString()}</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${getSeverityStyle(incident.severity)}`}>
                        {incident.severity}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] bg-slate-800 text-cyan-300 font-bold border border-cyan-500/20">
                        {incident.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover/row:text-cyan-300 transition">
                      {incident.threatCategory}
                    </h4>

                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      {incident.details}
                    </p>

                    <div className="flex items-center gap-2 text-xs font-mono pt-1 text-slate-400">
                      <span className="text-slate-500">Target Address:</span>
                      <span className="text-cyan-300">{truncateAddress(incident.address, 8, 8)}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-500">Value:</span>
                      <span className="text-amber-400 font-bold">{incident.amount}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end lg:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/scan?address=${encodeURIComponent(incident.address)}`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-xs transition border border-cyan-500/40 flex items-center gap-1.5 shadow"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Investigate</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Forensic Inspection Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="cyber-card rounded-3xl p-6 md:p-8 max-w-xl w-full border border-cyan-500/40 space-y-6 relative animate-in fade-in shadow-2xl">
            <span className="hud-bracket-tl" />
            <span className="hud-bracket-tr" />
            <span className="hud-bracket-bl" />
            <span className="hud-bracket-br" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm font-mono border ${getSeverityStyle(
                    selectedIncident.severity
                  )}`}
                >
                  {selectedIncident.severity[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold font-heading text-white">{selectedIncident.incidentId || selectedIncident.id}</h3>
                  <p className="text-xs font-mono text-slate-400">{new Date(selectedIncident.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-slate-500 block">Threat Classification</span>
                <span className="text-white font-bold text-sm">{selectedIncident.threatCategory}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-slate-500 block">Heuristic Rule Triggered</span>
                <span className="text-cyan-400 font-bold">{selectedIncident.ruleTrigger}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-slate-500 block">Target UTXO Address</span>
                <span className="text-amber-300 break-all">{selectedIncident.address}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-slate-500 block">Forensic Description</span>
                <p className="text-slate-300 font-sans text-xs">{selectedIncident.details}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const addr = selectedIncident.address;
                  setSelectedIncident(null);
                  navigate(`/scan?address=${encodeURIComponent(addr)}`);
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/25"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Launch Deep-Dive Investigation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOCDashboard;