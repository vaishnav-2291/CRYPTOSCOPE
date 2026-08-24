import React from "react";
import { getSeverityBadge, getRiskTheme } from "../utils/constants";
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, CheckCircle2, FileText } from "lucide-react";

const SecurityReportCard = ({
  riskScore = 0,
  riskLevel = "Low",
  ruleTriggers = [],
  securityAssessment = "",
  methodology = "",
}) => {
  const theme = getRiskTheme(riskLevel);

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/25 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${theme.bg} border ${theme.border}`}>
            {theme.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
              Deterministic Security Assessment Report
            </h3>
            <p className="text-xs text-slate-400">
              Rule-based heuristic audit explaining exact triggers, raw metric thresholds, and risk scoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${theme.badge}`}>
            {riskLevel} Risk • {riskScore}/100 Pts
          </span>
        </div>
      </div>

      {/* Executive Summary Quote */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-sm leading-relaxed text-slate-200">
        <p>{securityAssessment || "Standard blockchain behavior profile evaluated across all dimensions."}</p>
      </div>

      {/* Triggered Rules Matrix */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active Heuristic Rule Triggers ({ruleTriggers.length})
          </h4>
          <span className="text-xs text-slate-500 font-mono">5-Dimension Analytical Matrix</span>
        </div>

        {ruleTriggers.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>No anomalous risk rules triggered. Wallet demonstrates standard clean transaction parameters.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {ruleTriggers.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="p-4 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/30 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-cyan-500/30">
                      {rule.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(rule.severity)}`}>
                      {rule.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {rule.dimension}
                    </span>
                    <h5 className="text-sm font-bold text-white ml-1">{rule.title}</h5>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{rule.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 text-slate-400">
                    <span className="text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      📊 {rule.metric}
                    </span>
                    <span className="text-amber-300/90 font-sans">
                      💡 <strong>Recommendation:</strong> {rule.recommendation}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                    +{rule.points} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transparent Methodology Disclaimer */}
      <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-start gap-3 text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-300 font-medium">Explainable Framework Transparency:</strong>{" "}
          CryptoScope AI uses a transparent, deterministic rule-based heuristic scoring engine across 5 dimensions: Transaction Velocity, Balance Concentration, Fund Churn Patterns, Temporal Consistency, and Sanction/Mixer Intelligence. No opaque machine learning approximations are used in compliance scoring.
        </div>
      </div>
    </div>
  );
};

export default SecurityReportCard;
