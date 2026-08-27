import React, { useState, useEffect } from "react";
import { scanWallet, addToWatchlist } from "../services/api";
import { formatBtc, formatUsd, truncateAddress, getRiskTheme } from "../utils/constants";
import RiskGauge from "./RiskGauge";
import RiskRadarChart from "./RiskRadarChart";
import TransactionGraph from "./TransactionGraph";
import TransactionTable from "./TransactionTable";
import SecurityReportCard from "./SecurityReportCard";
import HistoricalRiskTrend from "./HistoricalRiskTrend";
import ExportReportModal from "./ExportReportModal";
import {
  Search,
  Shield,
  Layers,
  FileText,
  TrendingUp,
  GitBranch,
  Eye,
  Share2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Users,
  Radio,
  Zap,
} from "lucide-react";

const WalletAnalyzer = ({ initialAddress = "" }) => {
  const toast = useToast();
  const [addressInput, setAddressInput] = useState(initialAddress || "");
  const [loading, setLoading] = useState(false);
  const [walletResult, setWalletResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [watchlistSuccess, setWatchlistSuccess] = useState(false);

  const handleScan = async (targetAddr) => {
    const addr = (targetAddr || addressInput).trim();
    if (!addr) {
      setError("Please enter a valid Bitcoin wallet address.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await scanWallet(addr);
      setWalletResult(res);
      setAddressInput(addr);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to analyze wallet address.");
      setWalletResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAddress) {
      setAddressInput(initialAddress);
      handleScan(initialAddress);
    }
  }, [initialAddress]);

  const handleCopyAddress = () => {
    if (!walletResult?.address) return;
    navigator.clipboard.writeText(walletResult.address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleAddToWatchlist = async () => {
    if (!walletResult?.address) return;
    try {
      await addToWatchlist(walletResult.address, walletResult.entityTag?.name || "Target Address");
      setWatchlistSuccess(true);
      toast.success("Wallet added to Risk Watchlist");
      setTimeout(() => setWatchlistSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Please sign in to add wallets to your watchlist.");
    }
  };

  const theme = getRiskTheme(walletResult?.riskLevel || "Low");
  const breakdown = walletResult?.breakdown || {};

  return (
    <div className="space-y-6">
      {/* Target Address Input Bar */}
      <div className="cyber-card rounded-2xl p-4 md:p-6 border border-cyan-500/25 relative group">
        <span className="hud-bracket-tl" />
        <span className="hud-bracket-tr" />
        <span className="hud-bracket-bl" />
        <span className="hud-bracket-br" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="relative flex-1 group/input">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 group-hover/input:scale-110 transition" />
            <input
              type="text"
              placeholder="Enter Bitcoin address (Legacy 1..., P2SH 3..., SegWit bc1q..., Taproot bc1p...)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-cyan-500/35 text-xs md:text-sm font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating UTXOs...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Scan Target</span>
                  <Zap className="w-3.5 h-3.5 fill-current" />
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Loading HUD Sequence */}
      {loading && (
        <div className="cyber-card rounded-2xl p-12 text-center border border-cyan-500/25 space-y-4 relative overflow-hidden">
          <div className="scan-line-effect" />
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse">
            <Radio className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold font-heading text-white">Running 5-Axis Heuristic Risk Engine</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto font-mono">
            Querying Bitcoin UTXO states, calculating velocity & pass-through ratios, clustering common-inputs, and evaluating entity sanctions...
          </p>
        </div>
      )}

      {/* Main Analysis Result */}
      {!loading && walletResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Target Identity & Action Header Bar */}
          <div className="cyber-card rounded-2xl p-5 border border-cyan-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative group">
            <span className="hud-bracket-tl" />
            <span className="hud-bracket-tr" />
            <span className="hud-bracket-bl" />
            <span className="hud-bracket-br" />

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
                  Bitcoin Mainnet
                </span>
                {walletResult.entityTag && (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <span>{walletResult.entityTag.icon}</span>
                    <span>{walletResult.entityTag.name}</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${theme.badge} shadow-sm`}>
                  {theme.icon} {walletResult.riskLevel} Risk ({walletResult.riskScore}/100)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <h2 className="text-sm md:text-base font-bold font-mono text-white break-all drop-shadow">
                  {walletResult.address}
                </h2>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition flex-shrink-0"
                  title="Copy Address"
                >
                  {copiedAddr ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`https://mempool.space/address/${walletResult.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition flex-shrink-0"
                  title="View on Mempool.space"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAddToWatchlist}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition flex items-center gap-1.5 shadow"
              >
                {watchlistSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Pinned!
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> Watchlist
                  </>
                )}
              </button>

              <button
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 text-xs font-extrabold transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/15"
              >
                <Share2 className="w-3.5 h-3.5" /> Export & Share Report
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/90 border border-white/10 overflow-x-auto shadow-inner">
            {[
              { id: "overview", label: "Overview & Risk", icon: Shield },
              { id: "graph", label: "Fund Flow Graph", icon: GitBranch, badge: "Interactive" },
              { id: "security", label: "Security Report", icon: FileText, badge: `${walletResult.ruleTriggers?.length || 0} Rules` },
              { id: "transactions", label: "Ledger History", icon: Layers, badge: walletResult.transactionCount },
              { id: "clustering", label: "Entity & Clusters", icon: Users },
              { id: "trend", label: "Risk Trajectory", icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive
                          ? "bg-slate-950/30 text-slate-950 font-bold"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & RISK */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Top Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20 space-y-1 relative group">
                  <span className="hud-bracket-tl" />
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Current Balance</span>
                  <div className="text-lg md:text-xl font-bold font-mono text-white">{formatBtc(walletResult.balance)}</div>
                  <div className="text-xs text-slate-500 font-mono">{formatUsd(walletResult.balanceUSD)}</div>
                </div>

                <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20 space-y-1 relative group">
                  <span className="hud-bracket-tl" />
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Received</span>
                  <div className="text-lg md:text-xl font-bold font-mono text-emerald-400">+{formatBtc(walletResult.totalReceived)}</div>
                  <div className="text-xs text-slate-500 font-mono">Inbound Volume</div>
                </div>

                <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20 space-y-1 relative group">
                  <span className="hud-bracket-tl" />
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Sent</span>
                  <div className="text-lg md:text-xl font-bold font-mono text-rose-400">-{formatBtc(walletResult.totalSent)}</div>
                  <div className="text-xs text-slate-500 font-mono">Outbound Volume</div>
                </div>

                <div className="cyber-card rounded-2xl p-4 border border-cyan-500/20 space-y-1 relative group">
                  <span className="hud-bracket-tl" />
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Confirmed Transfers</span>
                  <div className="text-lg md:text-xl font-bold font-mono text-cyan-400">{walletResult.transactionCount?.toLocaleString() || 0}</div>
                  <div className="text-xs text-slate-500 font-mono">{walletResult.unconfirmedTxCount || 0} In Mempool</div>
                </div>
              </div>

              {/* Gauge + Radar Chart Side-by-Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Gauge Card */}
                <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between relative group">
                  <span className="hud-bracket-tl" />
                  <span className="hud-bracket-tr" />
                  <span className="hud-bracket-bl" />
                  <span className="hud-bracket-br" />

                  <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                      <span className="text-cyan-400">🛡️</span> Deterministic Risk Score
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${theme.badge}`}>
                      {walletResult.riskLevel}
                    </span>
                  </div>

                  <RiskGauge score={walletResult.riskScore} level={walletResult.riskLevel} size={230} />

                  <p className="text-xs text-center text-slate-400 px-4">
                    Evaluated across 5 deterministic heuristic rule dimensions with full transparency.
                  </p>
                </div>

                {/* 5-Axis Radar Chart Card */}
                <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between relative group">
                  <span className="hud-bracket-tl" />
                  <span className="hud-bracket-tr" />
                  <span className="hud-bracket-bl" />
                  <span className="hud-bracket-br" />

                  <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="text-base font-bold font-heading text-white flex items-center gap-2">
                      <span className="text-cyan-400">📊</span> 5-Axis Risk Vector Breakdown
                    </h3>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      Normalized Exposure
                    </span>
                  </div>

                  <RiskRadarChart breakdown={breakdown} riskScore={walletResult.riskScore} />

                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center text-slate-400 pt-2 border-t border-white/5">
                    <div>TX: {breakdown.transactionRisk || 0}/25</div>
                    <div>Bal: {breakdown.balanceRisk || 0}/20</div>
                    <div>Pat: {breakdown.patternRisk || 0}/25</div>
                    <div>Act: {breakdown.activityRisk || 0}/15</div>
                    <div>Ent: {breakdown.entityRisk || 0}/35</div>
                  </div>
                </div>
              </div>

              {/* 5D Score Breakdown Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { title: "Transaction Velocity", pts: breakdown.transactionRisk || 0, max: 25, color: "text-cyan-400", bar: "bg-cyan-500", desc: "Volume & burst rate" },
                  { title: "Balance Exposure", pts: breakdown.balanceRisk || 0, max: 20, color: "text-amber-400", bar: "bg-amber-500", desc: "Whale holdings ratio" },
                  { title: "Transit Pattern", pts: breakdown.patternRisk || 0, max: 25, color: "text-purple-400", bar: "bg-purple-500", desc: "Pass-through 1:1 ratio" },
                  { title: "Activity & Age", pts: breakdown.activityRisk || 0, max: 15, color: "text-blue-400", bar: "bg-blue-500", desc: "Burst reactivation" },
                  { title: "Entity & Sanctions", pts: breakdown.entityRisk || 0, max: 35, color: "text-rose-400", bar: "bg-rose-500", desc: "Mixer, threat & OFAC flags" },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950/70 border border-white/5 space-y-1.5 shadow-inner">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{item.title}</span>
                      <span className={`font-mono font-bold ${item.color}`}>{item.pts}/{item.max}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.bar} rounded-full transition-all duration-1000`}
                        style={{ width: `${Math.min(100, (item.pts / item.max) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FUND FLOW GRAPH */}
          {activeTab === "graph" && (
            <TransactionGraph
              graphData={walletResult.graphData}
              targetAddress={walletResult.address}
              onSelectAddress={(addr) => handleScan(addr)}
            />
          )}

          {/* TAB 3: SECURITY REPORT */}
          {activeTab === "security" && (
            <SecurityReportCard
              riskScore={walletResult.riskScore}
              riskLevel={walletResult.riskLevel}
              ruleTriggers={walletResult.ruleTriggers}
              securityAssessment={walletResult.securityAssessment || walletResult.aiReport}
              methodology={walletResult.methodology}
              transactions={walletResult.transactions || []}
            />
          )}

          {/* TAB 4: TRANSACTION LEDGER */}
          {activeTab === "transactions" && (
            <TransactionTable
              initialTransactions={walletResult.transactions || []}
              address={walletResult.address}
              btcPriceUSD={walletResult.btcPriceUSD}
              hasMore={walletResult.hasMoreTxs}
              lastSeenTxId={walletResult.lastSeenTxId}
            />
          )}

          {/* TAB 5: ENTITY & CLUSTERING */}
          {activeTab === "clustering" && (
            <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-6 relative group">
              <span className="hud-bracket-tl" />
              <span className="hud-bracket-tr" />
              <span className="hud-bracket-bl" />
              <span className="hud-bracket-br" />

              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 text-xl shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  👥
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading text-white">Common-Input Clustering Intelligence</h3>
                  <p className="text-xs text-slate-400">
                    Heuristic analysis identifying sibling addresses co-signed in multi-input Bitcoin transactions.
                  </p>
                </div>
              </div>

              {/* Clustering Summary Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 shadow-inner">
                  <span className="text-slate-400">Estimated Entity Size</span>
                  <div className="text-xl font-bold text-cyan-400">
                    {walletResult.clustering?.clusterSize || 1} Addresses
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 shadow-inner">
                  <span className="text-slate-400">Heuristic Confidence</span>
                  <div className="text-xl font-bold text-white">
                    {walletResult.clustering?.confidence || "Moderate"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-1 shadow-inner">
                  <span className="text-slate-400">Entity Tag Association</span>
                  <div className="text-xl font-bold text-purple-300">
                    {walletResult.entityTag?.name || "Unclassified / Private"}
                  </div>
                </div>
              </div>

              {/* Clustered Addresses List */}
              {walletResult.clustering?.associatedAddresses?.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Co-Signed Sibling Addresses ({walletResult.clustering.associatedAddresses.length})
                  </h4>
                  <div className="space-y-1.5 font-mono text-xs">
                    {walletResult.clustering.associatedAddresses.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition"
                      >
                        <span className="text-slate-300">{item.address}</span>
                        {item.entityTag && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
                            {item.entityTag.name}
                          </span>
                        )}
                        <button
                          onClick={() => handleScan(item.address)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[10px] font-bold transition shadow"
                        >
                          Scan Cluster Target
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-mono">
                  No multi-input co-signing patterns detected in recent transactions for this UTXO address.
                </p>
              )}
            </div>
          )}

          {/* TAB 6: HISTORICAL RISK TREND */}
          {activeTab === "trend" && (
            <HistoricalRiskTrend
              address={walletResult.address}
              currentRiskScore={walletResult.riskScore}
            />
          )}
        </div>
      )}

      {/* Clean Initial / Empty State */}
      {!loading && !walletResult && !error && (
        <div className="cyber-card rounded-2xl p-12 text-center border border-cyan-500/20 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Search className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold font-heading text-white">Enter Address to Profile</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto font-sans">
              Provide any Bitcoin Legacy (1...), P2SH (3...), SegWit (bc1q...), or Taproot (bc1p...) address to execute live on-chain profiling and 5-axis deterministic risk assessment.
            </p>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        walletData={walletResult || {}}
        riskData={walletResult || {}}
        scanId={walletResult?.scanId}
      />
    </div>
  );
};

export default WalletAnalyzer;