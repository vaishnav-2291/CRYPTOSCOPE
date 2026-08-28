import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { forensicsApi } from "../services/forensicsApi";
import { getRiskTheme, getRiskLevel } from "../utils/constants";

// Round 1 Components
import DustingAttackCard from "../components/forensics/DustingAttackCard";
import LiveFundFlowGraph from "../components/forensics/LiveFundFlowGraph";
import AddressClusterCard from "../components/forensics/AddressClusterCard";
import FeeUrgencyCard from "../components/forensics/FeeUrgencyCard";
import SanctionsCheckCard from "../components/forensics/SanctionsCheckCard";
import ExplainabilityPanel from "../components/forensics/ExplainabilityPanel";

// Round 2 Components
import RiskPropagationCard from "../components/forensics/RiskPropagationCard";
import AddressReuseCard from "../components/forensics/AddressReuseCard";
import MixerDetectionCard from "../components/forensics/MixerDetectionCard";
import WhalePriceImpactCard from "../components/forensics/WhalePriceImpactCard";
import PeerPercentileCard from "../components/forensics/PeerPercentileCard";
import CoinDaysDestroyedCard from "../components/forensics/CoinDaysDestroyedCard";
import ExportForensicPdfButton from "../components/forensics/ExportForensicPdfButton";

// Round 3 Components (Analyst-Grade Upgrades)
import ThreatRadarFeed from "../components/forensics/ThreatRadarFeed";
import RiskRuleConfigPanel from "../components/forensics/RiskRuleConfigPanel";
import AlertTriageQueueCard from "../components/forensics/AlertTriageQueueCard";

import {
  ShieldAlert,
  Search,
  RefreshCw,
  Layers,
  Network,
  Zap,
  Scale,
  Sliders,
  Sparkles,
  GitFork,
  Eye,
  Shuffle,
  DollarSign,
  Award,
  Flame,
  Radio,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
} from "lucide-react";

const QUICK_TARGETS = [
  { label: "Binance Cold Storage", address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo" },
  { label: "Satoshi Genesis", address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  { label: "FBI Lazarus Flagged", address: "bc1qqydp9muxtnxyet3ryfqc467wjtm23f0r7eh5aa" },
];

export const ForensicsPage = () => {
  const { address: paramAddress } = useParams();
  const navigate = useNavigate();

  const [inputAddress, setInputAddress] = useState(paramAddress || "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
  const [activeAddress, setActiveAddress] = useState(paramAddress || "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
  const [activeTab, setActiveTab] = useState("all");
  const [showAllDetails, setShowAllDetails] = useState(false);

  const [auditData, setAuditData] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchForensicData = async (target) => {
    if (!target) return;
    setLoading(true);
    setError(null);

    try {
      const [fullAudit, graph] = await Promise.all([
        forensicsApi.getFullForensicAudit(target),
        forensicsApi.getFundFlowGraph(target, 2, 15).catch(() => null),
      ]);

      setAuditData(fullAudit);
      setGraphData(graph);
    } catch (err) {
      console.error("Forensic fetch error:", err);
      setError(err.response?.data?.message || err.message || "Failed to load live on-chain forensic data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeAddress) {
      fetchForensicData(activeAddress);
    }
  }, [activeAddress]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputAddress.trim() && inputAddress.trim() !== activeAddress) {
      setActiveAddress(inputAddress.trim());
      navigate(`/forensics/${inputAddress.trim()}`);
    }
  };

  const handleSelectQuick = (addr) => {
    setInputAddress(addr);
    setActiveAddress(addr);
    navigate(`/forensics/${addr}`);
  };

  const summary = auditData?.auditSummary || {};

  // Derive top 2-3 flagged live findings dynamically
  const getTopFindings = () => {
    if (!auditData) return [];
    const findings = [];
    const s = auditData.auditSummary || {};

    if (s.sanctionsExposure === "DIRECT_SANCTION_MATCH") {
      findings.push({
        severity: "CRITICAL",
        badge: "SANCTIONS HIT",
        color: "border-red-500/40 bg-red-500/10 text-red-300",
        icon: Scale,
        title: "Direct OFAC Sanctioned Entity Match",
        desc: "Cryptographic address match identified on official US Treasury OFAC Specially Designated Nationals (SDN) registry.",
      });
    } else if (s.propagationExposureScore > 25) {
      findings.push({
        severity: s.propagationExposureScore > 60 ? "HIGH" : "MEDIUM",
        badge: "PROXIMITY EXPOSURE",
        color: s.propagationExposureScore > 60 ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300",
        icon: GitFork,
        title: `Multi-Hop Proximity Exposure (${s.propagationExposureScore}/100)`,
        desc: `Identified direct fund pathways linking target wallet within ${auditData.propagation?.maxHopsAnalyzed || 2} on-chain hops to flagged entities.`,
      });
    }

    if (s.dustingAttackHazard === "HIGH" || s.dustingAttackHazard === "MEDIUM") {
      findings.push({
        severity: s.dustingAttackHazard === "HIGH" ? "HIGH" : "MEDIUM",
        badge: "DUSTING DETECTED",
        color: s.dustingAttackHazard === "HIGH" ? "border-orange-500/40 bg-orange-500/10 text-orange-300" : "border-amber-500/40 bg-amber-500/10 text-amber-300",
        icon: ShieldAlert,
        title: `${s.dustingAttackHazard} Dusting Attack Activity`,
        desc: `Target received unsolicited micro-deposits (${auditData.dusting?.metrics?.totalDustReceivedSat || 0} sats) associated with wallet de-anonymization fan-outs.`,
      });
    }

    if (auditData.mixer?.mixerExposureLevel === "HIGH" || auditData.mixer?.mixerExposureLevel === "MEDIUM") {
      findings.push({
        severity: auditData.mixer.mixerExposureLevel === "HIGH" ? "HIGH" : "MEDIUM",
        badge: "MIXER PATTERNS",
        color: "border-purple-500/40 bg-purple-500/10 text-purple-300",
        icon: Shuffle,
        title: `Privacy Mixer Heuristic Match (${auditData.mixer.mixerExposureLevel})`,
        desc: `Identified fixed-denomination inputs/outputs matching CoinJoin/Wasabi/Whirlpool mixing protocols.`,
      });
    }

    if (auditData.cdd?.dormancyClassification?.reactivationSignal === "DORMANT_WHALE_REACTIVATION") {
      findings.push({
        severity: "HIGH",
        badge: "DORMANT AWAKENING",
        color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        icon: Flame,
        title: "Ancient UTXO Awakening / High CDD Movement",
        desc: `Single transaction destroyed ${auditData.cdd?.metrics?.maxSingleTxCdd || 0} Coin Days, indicating long-dormant whale reactivation.`,
      });
    }

    if (s.privacyGrade && (s.privacyGrade === "D" || s.privacyGrade === "F")) {
      findings.push({
        severity: "MEDIUM",
        badge: "PRIVACY DEGRADED",
        color: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        icon: Eye,
        title: `Address Reuse Hygiene: Grade ${s.privacyGrade}`,
        desc: "Frequent address reuse across multiple transactions compromises ECDSA public-key privacy.",
      });
    }

    if (s.clusterSize > 1 && findings.length < 3) {
      findings.push({
        severity: "INFO",
        badge: "CLUSTER LINKED",
        color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
        icon: Network,
        title: `Common-Input Cluster: ${s.clusterSize} Linked Wallets`,
        desc: `Deterministic multi-input heuristic links target to ${s.clusterSize} co-spending cluster addresses.`,
      });
    }

    if (findings.length === 0) {
      findings.push({
        severity: "CLEAN",
        badge: "CLEAN ON-CHAIN FOOTPRINT",
        color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        icon: CheckCircle2,
        title: "Clean Baseline Profile",
        desc: "Zero direct sanctions matches, dusting anomalies, or mixer links detected on live on-chain telemetry.",
      });
    }

    return findings.slice(0, 3);
  };

  const topFindings = getTopFindings();
  const riskScore = summary.overallRiskScore || 0;
  const riskLevel = summary.overallRiskLevel || getRiskLevel(riskScore);
  const theme = getRiskTheme(riskLevel);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="cyber-card rounded-2xl p-6 sm:p-8 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold tracking-wider">
                DEEP-DIVE ON-CHAIN INTELLIGENCE (v2.0)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40">
                12 FORENSIC DIMENSIONS
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-cyan-400" /> Blockchain Forensic Intelligence Terminal
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Deterministic on-chain forensics: Dusting detection, recursive flow graphs, common-input clustering,
              multi-hop risk propagation, address reuse hygiene, mixer fingerprints, and OFAC sanctions verification.
            </p>
          </div>

          {/* Quick Targets & PDF Export */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start md:self-auto">
            <ExportForensicPdfButton auditData={auditData} address={activeAddress} />
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_TARGETS.map((t) => (
                <button
                  key={t.address}
                  onClick={() => handleSelectQuick(t.address)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border ${
                    activeAddress === t.address
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                      : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-cyan-500/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputAddress}
              onChange={(e) => setInputAddress(e.target.value)}
              placeholder="Paste any Bitcoin mainnet address (P2PKH, P2SH, SegWit, Taproot)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 placeholder:text-slate-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Run Live Forensics"}
          </button>
        </form>
      </div>

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* FIX 1: Progressive Disclosure Quick Summary */}
      {auditData && !loading && (
        <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/90 backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Executive Forensic Summary
                  <span className="text-xs font-mono text-slate-400 font-normal">({activeAddress.slice(0, 8)}...{activeAddress.slice(-6)})</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Key risk indicators distilled from real-time blockchain telemetry
                </p>
              </div>
            </div>

            {/* Risk Gauge Header */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${theme.badge}`}>
                <span className="text-[10px] uppercase tracking-wider text-slate-300">Composite Risk:</span>
                <span className="text-sm font-extrabold">{riskScore} / 100</span>
                <span className="text-[10px] uppercase">({riskLevel.toUpperCase()})</span>
              </div>
            </div>
          </div>

          {/* Top 2-3 Flagged Live Findings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topFindings.map((finding, idx) => {
              const Icon = finding.icon || Info;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${finding.color} transition-all space-y-1.5`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800">
                      {finding.badge}
                    </span>
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <h3 className="text-xs font-bold text-white leading-snug">{finding.title}</h3>
                  <p className="text-[11px] text-slate-300/90 leading-relaxed">{finding.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Expand / Collapse Disclosure Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
            <div className="text-xs text-slate-400">
              {showAllDetails
                ? "Showing all 12 deep-dive forensic dimension cards and raw on-chain telemetry."
                : "Detailed recursive flow graphs, entity clusters, CDD dormancy, and risk rule simulators are collapsed."}
            </div>

            <button
              onClick={() => setShowAllDetails(!showAllDetails)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                showAllDetails
                  ? "bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700"
                  : "bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              }`}
            >
              {showAllDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" /> Collapse Detailed Forensic Checks
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" /> + View all 12 detailed forensic checks & raw telemetry
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expanded Detailed Section */}
      {showAllDetails && (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Pills */}
          {auditData && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Dusting Hazard</div>
                <div className={`font-mono font-bold text-sm mt-0.5 ${
                  summary.dustingAttackHazard === "HIGH" ? "text-red-400" :
                  summary.dustingAttackHazard === "MEDIUM" ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {summary.dustingAttackHazard || "NONE"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Cluster Size</div>
                <div className="font-mono font-bold text-cyan-400 text-sm mt-0.5">
                  {summary.clusterSize || 1} Addr(s)
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Sanctions Match</div>
                <div className={`font-mono font-bold text-sm mt-0.5 ${
                  summary.sanctionsExposure === "DIRECT_SANCTION_MATCH" ? "text-red-400" : "text-emerald-400"
                }`}>
                  {summary.sanctionsExposure?.replace(/_/g, " ") || "CLEAN"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Multi-Hop Proximity</div>
                <div className={`font-mono font-bold text-sm mt-0.5 ${summary.propagationExposureScore > 30 ? "text-amber-400" : "text-emerald-400"}`}>
                  {summary.propagationExposureScore || 0}/100 Exposure
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Privacy Grade</div>
                <div className="font-mono font-bold text-cyan-400 text-sm mt-0.5">
                  Grade {summary.privacyGrade || "A"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="text-slate-400 text-[10px] uppercase">Overall Risk Score</div>
                <div className="font-mono font-bold text-purple-400 text-sm mt-0.5">
                  {summary.overallRiskScore || 0} / 100
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
            {[
              { id: "all", label: "Full Forensic Dossier", icon: Layers },
              { id: "radar", label: "Live Threat Radar", icon: Radio },
              { id: "triage", label: "Alert Triage Queue", icon: AlertOctagon },
              { id: "rules", label: "Risk Rule Config", icon: Sliders },
              { id: "graph", label: "Fund-Flow Graph", icon: Network },
              { id: "propagation", label: "Multi-Hop Proximity", icon: GitFork },
              { id: "dusting", label: "Dusting Detector", icon: ShieldAlert },
              { id: "cluster", label: "Entity Clustering", icon: Network },
              { id: "reuse", label: "Address Reuse", icon: Eye },
              { id: "mixer", label: "Mixer Detection", icon: Shuffle },
              { id: "cdd", label: "Coin Days Destroyed", icon: Flame },
              { id: "whale", label: "Whale Price Impact", icon: DollarSign },
              { id: "percentile", label: "Peer Percentile", icon: Award },
              { id: "fee", label: "Fee Urgency", icon: Zap },
              { id: "sanctions", label: "Sanctions Cross-Check", icon: Scale },
              { id: "explain", label: "Score Explainability", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Grid of Forensic Modules */}
          <div className="space-y-6">
            {/* Round 3: Threat Radar Feed */}
            {(activeTab === "all" || activeTab === "radar") && (
              <ThreatRadarFeed
                onSelectAddress={(addr) => {
                  setInputAddress(addr);
                  setActiveAddress(addr);
                  navigate(`/forensics/${addr}`);
                }}
              />
            )}

            {/* Round 3: Alert Triage & Severity Queue */}
            {(activeTab === "all" || activeTab === "triage") && (
              <AlertTriageQueueCard
                onEscalateToCase={(newCase) => {
                  navigate(`/cases`);
                }}
              />
            )}

            {/* Round 3: Configurable Risk Rule Engine */}
            {(activeTab === "all" || activeTab === "rules") && (
              <RiskRuleConfigPanel
                currentRiskScore={auditData?.auditSummary?.overallRiskScore}
                onConfigChanged={() => {
                  fetchForensicData(activeAddress);
                }}
              />
            )}

            {(activeTab === "all" || activeTab === "graph") && (
              <LiveFundFlowGraph
                data={graphData}
                loading={loading}
                error={error}
                targetAddress={activeAddress}
                onSelectAddress={(addr) => {
                  setInputAddress(addr);
                  setActiveAddress(addr);
                  navigate(`/forensics/${addr}`);
                }}
              />
            )}

            {/* Row 1: Multi-Hop Proximity & Sanctions */}
            {(activeTab === "all" || activeTab === "propagation" || activeTab === "sanctions") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(activeTab === "all" || activeTab === "propagation") && (
                  <RiskPropagationCard
                    data={auditData?.propagation}
                    loading={loading}
                    error={error}
                  />
                )}
                {(activeTab === "all" || activeTab === "sanctions") && (
                  <SanctionsCheckCard
                    data={auditData?.sanctions}
                    loading={loading}
                    error={error}
                  />
                )}
              </div>
            )}

            {/* Row 2: Dusting & Clustering */}
            {(activeTab === "all" || activeTab === "dusting" || activeTab === "cluster") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(activeTab === "all" || activeTab === "dusting") && (
                  <DustingAttackCard
                    data={auditData?.dusting}
                    loading={loading}
                    error={error}
                  />
                )}
                {(activeTab === "all" || activeTab === "cluster") && (
                  <AddressClusterCard
                    data={auditData?.cluster}
                    loading={loading}
                    error={error}
                    onSelectAddress={(addr) => {
                      setInputAddress(addr);
                      setActiveAddress(addr);
                      navigate(`/forensics/${addr}`);
                    }}
                  />
                )}
              </div>
            )}

            {/* Row 3: Address Reuse & Mixer Fingerprints */}
            {(activeTab === "all" || activeTab === "reuse" || activeTab === "mixer") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(activeTab === "all" || activeTab === "reuse") && (
                  <AddressReuseCard
                    data={auditData?.reuse}
                    loading={loading}
                    error={error}
                  />
                )}
                {(activeTab === "all" || activeTab === "mixer") && (
                  <MixerDetectionCard
                    data={auditData?.mixer}
                    loading={loading}
                    error={error}
                  />
                )}
              </div>
            )}

            {/* Row 4: Whale Moves & Peer Percentiles */}
            {(activeTab === "all" || activeTab === "whale" || activeTab === "percentile") && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(activeTab === "all" || activeTab === "whale") && (
                  <WhalePriceImpactCard
                    data={auditData?.whale}
                    loading={loading}
                    error={error}
                  />
                )}
                {(activeTab === "all" || activeTab === "percentile") && (
                  <PeerPercentileCard
                    data={auditData?.percentile}
                    loading={loading}
                    error={error}
                  />
                )}
              </div>
            )}

            {/* Row 5: Coin Days Destroyed / Dormant-Coin Dynamics */}
            {(activeTab === "all" || activeTab === "cdd") && (
              <CoinDaysDestroyedCard
                data={auditData?.cdd}
                loading={loading}
                error={error}
              />
            )}

            {/* Row 6: Fee Urgency & Explainability Matrix */}
            {(activeTab === "all" || activeTab === "fee") && (
              <FeeUrgencyCard
                data={auditData?.feeUrgency}
                loading={loading}
                error={error}
              />
            )}

            {(activeTab === "all" || activeTab === "explain") && (
              <ExplainabilityPanel
                data={auditData?.explainability}
                loading={loading}
                error={error}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForensicsPage;
