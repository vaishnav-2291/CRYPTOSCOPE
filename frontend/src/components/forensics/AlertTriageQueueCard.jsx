import React, { useState, useEffect } from "react";
import { AlertOctagon, CheckCircle, ShieldAlert, ArrowUpRight, FolderPlus, RefreshCw, Filter, Check, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { forensicsApi } from "../../services/forensicsApi";

export const AlertTriageQueueCard = ({ onEscalateToCase }) => {
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState({ totalInQueue: 0, unreadCount: 0, criticalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("UNREAD");

  const fetchTriageQueue = async () => {
    try {
      setLoading(true);
      const res = await forensicsApi.getTriageQueue({ status: statusFilter });
      setAlerts(res.queue || []);
      if (res.metrics) setMetrics(res.metrics);
    } catch (err) {
      console.warn("Triage queue notice:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTriageQueue();
  }, [statusFilter]);

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      await forensicsApi.updateTriageStatus(alertId, newStatus);
      fetchTriageQueue();
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  const handleEscalate = async (alert) => {
    try {
      const res = await forensicsApi.escalateTriageAlert(alert._id, {
        caseTitle: `Investigation: ${alert.alertType} on ${alert.address.slice(0, 10)}...`,
        customNotes: alert.summary,
      });
      fetchTriageQueue();
      if (onEscalateToCase) onEscalateToCase(res.createdCase);
    } catch (err) {
      console.error("Escalate error:", err);
    }
  };

  const priorityColors = {
    CRITICAL: "text-red-400 border-red-500/40 bg-red-500/10",
    HIGH: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    MEDIUM: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    LOW: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Alert Triage / Severity Queue</h3>
              {metrics.criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
                  {metrics.criticalCount} CRITICAL
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked alert priority queue calculated from live multi-vector heuristic signals
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTriageQueue}
            className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {["UNREAD", "INVESTIGATING", "ESCALATED_TO_CASE", "DISMISSED", "ALL"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              statusFilter === st
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                : "bg-slate-950/40 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Alert Queue Table / Cards */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/30 border border-slate-800/80 text-center text-slate-400 text-xs">
            <CheckCircle className="w-6 h-6 text-emerald-400/60 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Triage Queue Clear</p>
            <p className="text-[11px] text-slate-500 mt-1">No active unhandled alerts matching "{statusFilter}".</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert._id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-mono">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityColors[alert.triagePriority] || "border-slate-800"}`}>
                    {alert.triagePriority} ({alert.severityScore}/100)
                  </span>
                  <span className="text-cyan-300 font-bold">{alert.address.slice(0, 10)}...{alert.address.slice(-6)}</span>
                  <span className="text-[10px] text-slate-500">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="text-white font-semibold text-xs">{alert.title}</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{alert.summary}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                <Link
                  to={`/forensics/${alert.address}`}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 text-[11px] font-semibold flex items-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect
                </Link>

                {alert.triageStatus !== "ESCALATED_TO_CASE" && (
                  <button
                    onClick={() => handleEscalate(alert)}
                    className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Escalate to Case
                  </button>
                )}

                {alert.triageStatus === "UNREAD" && (
                  <button
                    onClick={() => handleUpdateStatus(alert._id, "INVESTIGATING")}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" /> Mark Reviewing
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertTriageQueueCard;
