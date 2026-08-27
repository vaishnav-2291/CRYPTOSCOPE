import React, { useState } from "react";
import { HelpCircle, CheckCircle2, AlertCircle, ShieldAlert, Sparkles, Filter, ChevronRight, Layers, Sliders } from "lucide-react";

export const ExplainabilityPanel = ({ data, loading, error }) => {
  const [filterSeverity, setFilterSeverity] = useState("ALL");

  if (loading) {
    return (
      <div className="cyber-card rounded-2xl p-8 border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
        <div className="h-32 bg-slate-800/40 rounded-xl mb-4" />
        <div className="h-48 bg-slate-800/20 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="cyber-card rounded-2xl p-6 border border-slate-800 bg-slate-900/40 text-slate-400 text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
          <AlertCircle className="w-4 h-4" /> Explainability Breakdown Unavailable
        </div>
        <p>{error || "Unable to compute mathematical rule decomposition at this time."}</p>
      </div>
    );
  }

  const triggeredRules = data.triggeredRules || [];
  const mitigatingFactors = data.mitigatingFactors || [];
  const axisBreakdown = data.axisWeightBreakdown || {};

  const filteredRules = filterSeverity === "ALL"
    ? triggeredRules
    : triggeredRules.filter((r) => r.severity === filterSeverity);

  return (
    <div className="cyber-card rounded-2xl p-6 sm:p-8 border border-cyan-500/30 bg-slate-900/90 backdrop-blur-xl space-y-6">
      {/* Title & Philosophy Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-wide">Deterministic Score Explainability Matrix</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              AUDIT-GRADE XAI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Transparent mathematical decomposition across 5 heuristic risk dimensions.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Calculated Risk Score</div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-0.5">
            {data.riskScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
          </div>
        </div>
      </div>

      {/* Methodology Explainer */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Explainable Framework: </strong>
          {data.methodologyStatement}
        </div>
      </div>

      {/* 5-Axis Score Contribution Breakdown */}
      <div>
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Dimension Weight Contribution
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] text-slate-400">Velocity Risk</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              +{axisBreakdown.transactionVelocityRisk || 0} <span className="text-[10px] text-slate-400">pts</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] text-slate-400">Balance Exposure</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              +{axisBreakdown.balanceExposureRisk || 0} <span className="text-[10px] text-slate-400">pts</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] text-slate-400">Flow Patterns</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              +{axisBreakdown.flowPatternRisk || 0} <span className="text-[10px] text-slate-400">pts</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] text-slate-400">Activity Age</div>
            <div className="text-base font-bold font-mono text-cyan-400 mt-0.5">
              +{axisBreakdown.activityAgeRisk || 0} <span className="text-[10px] text-slate-400">pts</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <div className="text-[10px] text-slate-400">Entity Association</div>
            <div className="text-base font-bold font-mono text-purple-400 mt-0.5">
              +{axisBreakdown.entityAssociationRisk || 0} <span className="text-[10px] text-slate-400">pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Triggered Heuristic Rules List */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Active Heuristic Signals ({triggeredRules.length} Fired)
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-lg border border-slate-800 text-[10px]">
            {["ALL", "CRITICAL", "WARNING", "INFO"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterSeverity === sev ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {filteredRules.length > 0 ? (
          <div className="space-y-2.5">
            {filteredRules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-cyan-500/30 transition-all text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold">
                      {rule.id}
                    </span>
                    <span className="font-bold text-white text-sm">{rule.title}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                      rule.severity === "CRITICAL" ? "bg-red-500/20 text-red-300 border border-red-500/30" :
                      rule.severity === "WARNING" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                      "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    }`}>
                      {rule.severity}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400 text-sm">+{rule.pointsAssigned} pts</span>
                </div>

                <div className="text-slate-300 leading-relaxed">
                  {rule.plainEnglishReason}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-[11px]">
                  <div>
                    <span className="text-slate-400">Triggered Metric: </span>
                    <span className="font-mono text-cyan-300">{rule.triggeredMetric}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Signal Classification: </span>
                    <span className="text-slate-300 italic">{rule.signalNature}</span>
                  </div>
                </div>

                {rule.forensicRecommendation && (
                  <div className="p-2 rounded bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-start gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Recommendation: </strong>{rule.forensicRecommendation}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
            No rules matching the selected filter severity.
          </div>
        )}
      </div>

      {/* Mitigating Provenance Factors */}
      {mitigatingFactors.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Mitigating Provenance Indicators (Risk-Reducing Factors)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {mitigatingFactors.map((m, i) => (
              <div key={i} className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
                <div className="font-bold text-emerald-300">{m.title}</div>
                <div className="text-slate-300 text-[11px] mt-1">{m.evidence}</div>
                <div className="text-[10px] text-emerald-400/80 font-mono mt-1">Impact: {m.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplainabilityPanel;
