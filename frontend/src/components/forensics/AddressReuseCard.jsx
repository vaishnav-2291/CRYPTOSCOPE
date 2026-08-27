import React from "react";
import { Eye, EyeOff, AlertTriangle, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";

export const AddressReuseCard = ({ data, loading, error }) => {
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
          <AlertTriangle className="w-4 h-4" /> Address Reuse Telemetry Offline
        </div>
        <p>{error || "Unable to analyze address reuse patterns at this time."}</p>
      </div>
    );
  }

  const grade = data.privacyGrade || "A";
  const score = data.privacyScore || 100;
  const metrics = data.metrics || {};
  const severity = data.reuseSeverity || "NONE";

  const gradeColors = {
    A: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
    B: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
    C: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    D: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    F: "text-red-400 border-red-500/40 bg-red-500/10",
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            {grade === "A" ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Address Reuse Privacy Detector</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${gradeColors[grade] || "border-slate-800"}`}>
                GRADE {grade} ({score}/100)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              BIP 32 privacy hygiene: Address reuse enables trivial cluster tracking
            </p>
          </div>
        </div>
      </div>

      {/* Assessment */}
      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
        {data.assessment}
      </p>

      {/* Metrics Strip */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Funded Outputs</div>
          <div className={`text-sm font-bold font-mono mt-0.5 ${metrics.totalFundedOutputsCount > 1 ? "text-amber-400" : "text-emerald-400"}`}>
            {metrics.totalFundedOutputsCount || 0}
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Spent Outputs</div>
          <div className="text-sm font-bold font-mono text-white mt-0.5">{metrics.totalSpentOutputsCount || 0}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Txs</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">{metrics.totalTxCount || 0}</div>
        </div>
      </div>

      {/* Remediation Advice */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-cyan-200/90 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300">Privacy Guidance: </span>
          {data.bestPracticeRecommendation}
        </div>
      </div>
    </div>
  );
};

export default AddressReuseCard;
