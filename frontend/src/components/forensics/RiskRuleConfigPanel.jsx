import React, { useState, useEffect } from "react";
import { Sliders, Shield, Save, RotateCcw, CheckCircle2, AlertTriangle, Sparkles, Scale, Info } from "lucide-react";
import { forensicsApi } from "../../services/forensicsApi";

export const RiskRuleConfigPanel = ({ currentRiskScore, onConfigChanged }) => {
  const [config, setConfig] = useState({
    presetName: "BASEL_AML",
    dustThresholdSat: 546,
    feeOverpayMultiplier: 2.0,
    maxPropagationHops: 2,
    cddAlertThreshold: 50,
    whaleThresholdBtc: 1.0,
    mixerStrictness: "STANDARD",
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await forensicsApi.getRiskRuleConfig();
      if (res.config) setConfig(res.config);
    } catch (err) {
      console.warn("Using baseline risk configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await forensicsApi.updateRiskRuleConfig(config);
      if (res.config) setConfig(res.config);
      setSaveSuccess(true);
      if (onConfigChanged) onConfigChanged(res.config);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save config error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (preset) => {
    const presets = {
      STRICT_COMPLIANCE: {
        presetName: "STRICT_COMPLIANCE",
        dustThresholdSat: 1000,
        feeOverpayMultiplier: 1.5,
        maxPropagationHops: 3,
        cddAlertThreshold: 20,
        whaleThresholdBtc: 0.5,
        mixerStrictness: "STRICT",
      },
      BASEL_AML: {
        presetName: "BASEL_AML",
        dustThresholdSat: 546,
        feeOverpayMultiplier: 2.0,
        maxPropagationHops: 2,
        cddAlertThreshold: 50,
        whaleThresholdBtc: 1.0,
        mixerStrictness: "STANDARD",
      },
      LOW_FALSE_POSITIVE: {
        presetName: "LOW_FALSE_POSITIVE",
        dustThresholdSat: 300,
        feeOverpayMultiplier: 3.5,
        maxPropagationHops: 1,
        cddAlertThreshold: 200,
        whaleThresholdBtc: 5.0,
        mixerStrictness: "RELAXED",
      },
    };

    if (presets[preset]) {
      setConfig((prev) => ({ ...prev, ...presets[preset] }));
    }
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Configurable Risk Rule Engine</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {config.presetName?.replace(/_/g, " ") || "CUSTOM"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune organizational risk thresholds evaluated against live on-chain telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Config Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Apply Thresholds"}
          </button>
        </div>
      </div>

      {/* Preset Quick Switcher */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compliance Risk Appetite Presets</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              id: "STRICT_COMPLIANCE",
              name: "Strict AML / High Sensitivity",
              desc: "Lower thresholds, 3-hop propagation, strict mixer alerts",
            },
            {
              id: "BASEL_AML",
              name: "Standard Basel AML (Default)",
              desc: "Standard 546 sat dust, 2-hop propagation, balanced triage",
            },
            {
              id: "LOW_FALSE_POSITIVE",
              name: "Permissive / Low Noise",
              desc: "High volume thresholds, 1-hop sanctions check only",
            },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetSelect(p.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.presetName === p.id
                  ? "bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                  : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="text-xs font-bold text-white">{p.name}</div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Threshold Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Dusting Threshold */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Dust Attack Micro-Deposit Limit</span>
            <span className="font-mono text-cyan-400 font-bold">{config.dustThresholdSat} sats</span>
          </div>
          <input
            type="range"
            min="200"
            max="2000"
            step="50"
            value={config.dustThresholdSat}
            onChange={(e) => setConfig({ ...config, dustThresholdSat: Number(e.target.value), presetName: "CUSTOM" })}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <p className="text-[10px] text-slate-500">Standard economic dust threshold is 546 satoshis.</p>
        </div>

        {/* Fee Overpay Multiplier */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Fee Urgency Overpay Trigger</span>
            <span className="font-mono text-cyan-400 font-bold">{config.feeOverpayMultiplier}x Median</span>
          </div>
          <input
            type="range"
            min="1.2"
            max="5.0"
            step="0.1"
            value={config.feeOverpayMultiplier}
            onChange={(e) => setConfig({ ...config, feeOverpayMultiplier: Number(e.target.value), presetName: "CUSTOM" })}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <p className="text-[10px] text-slate-500">Flags wallets paying this multiplier over live mempool median.</p>
        </div>

        {/* Max Propagation Hops */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Sanctions Multi-Hop Depth</span>
            <span className="font-mono text-cyan-400 font-bold">{config.maxPropagationHops} Hops</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="1"
            value={config.maxPropagationHops}
            onChange={(e) => setConfig({ ...config, maxPropagationHops: Number(e.target.value), presetName: "CUSTOM" })}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <p className="text-[10px] text-slate-500">Traverses 1 to 3 live on-chain hops from target wallet.</p>
        </div>

        {/* CDD Dormancy Trigger */}
        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-300 font-semibold">CDD Dormancy Movement Trigger</span>
            <span className="font-mono text-cyan-400 font-bold">{config.cddAlertThreshold} CDD</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={config.cddAlertThreshold}
            onChange={(e) => setConfig({ ...config, cddAlertThreshold: Number(e.target.value), presetName: "CUSTOM" })}
            className="w-full accent-cyan-400 bg-slate-800"
          />
          <p className="text-[10px] text-slate-500">Triggers when single tx destroys specified coin days.</p>
        </div>
      </div>

      {/* Integrity Statement */}
      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs text-purple-200/90 flex items-start gap-2">
        <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-purple-300">Live Data Compliance Rule: </span>
          Custom thresholds tune the mathematical triggering criteria for alerts. All underlying transaction histories, UTXOs, and OFAC cross-checks continue to be fetched fresh in real time.
        </div>
      </div>
    </div>
  );
};

export default RiskRuleConfigPanel;
