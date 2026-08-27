import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { forensicsApi } from "../services/forensicsApi";

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
import ExportForensicPdfButton from "../components/forensics/ExportForensicPdfButton";

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
  ExternalLink,
} from "lucide-react";

const QUICK_TARGETS = [
  { label: "Binance Cold Storage", address: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo" },
  { label: "Satoshi Genesis", address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  { label: "OFAC Lazarus Flagged", address: "12t9YDPgwJNPPJa8NVwKEC3gahP4yghN6e" },
];

export const ForensicsPage = () => {
  const { address: paramAddress } = useParams();
  const navigate = useNavigate();

  const [inputAddress, setInputAddress] = useState(paramAddress || "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
  const [activeAddress, setActiveAddress] = useState(paramAddress || "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo");
  const [activeTab, setActiveTab] = useState("all");

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
          { id: "graph", label: "Fund-Flow Graph", icon: Network },
          { id: "propagation", label: "Multi-Hop Proximity", icon: GitFork },
          { id: "dusting", label: "Dusting Detector", icon: ShieldAlert },
          { id: "cluster", label: "Entity Clustering", icon: Network },
          { id: "reuse", label: "Address Reuse", icon: Eye },
          { id: "mixer", label: "Mixer Detection", icon: Shuffle },
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

      {/* Error Banner if any */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Grid of Forensic Modules */}
      <div className="space-y-6">
        {(activeTab === "all" || activeTab === "graph") && (
          <LiveFundFlowGraph
            data={graphData}
            loading={loading}
            error={error}
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

        {/* Row 5: Fee Urgency & Explainability Matrix */}
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
  );
};

export default ForensicsPage;
