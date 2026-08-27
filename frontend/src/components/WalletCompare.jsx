import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { scanWallet } from "../services/api";
import { formatBtc, formatUsd, truncateAddress, getRiskTheme } from "../utils/constants";
import {
  GitCompare,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function getAddressType(address = "") {
  const addr = address.trim();
  if (addr.startsWith("bc1q") || addr.startsWith("tb1q")) return "Native SegWit (Bech32)";
  if (addr.startsWith("bc1p") || addr.startsWith("tb1p")) return "Taproot (Bech32m)";
  if (addr.startsWith("3") || addr.startsWith("2")) return "Nested SegWit (P2SH)";
  if (addr.startsWith("1") || addr.startsWith("m") || addr.startsWith("n")) return "Legacy (P2PKH)";
  return "Bitcoin Mainnet";
}

function WalletCompare() {
  const toast = useToast();
  const [walletA, setWalletA] = useState("");
  const [walletB, setWalletB] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const compareWallets = async (e) => {
    e?.preventDefault();
    if (!walletA.trim() || !walletB.trim()) {
      toast.info("Please enter both target wallet addresses to compare.");
      return;
    }

    try {
      setLoading(true);
      const [dataA, dataB] = await Promise.all([
        scanWallet(walletA.trim()),
        scanWallet(walletB.trim()),
      ]);

      setResult({
        walletA: dataA?.wallet || dataA,
        walletB: dataB?.wallet || dataB,
      });
      toast.success("Comparative heuristic analysis generated successfully");
    } catch (error) {
      console.error("Wallet comparison failed:", error);
      toast.error(error.response?.data?.message || "Failed to fetch live data for both wallets.");
    } finally {
      setLoading(false);
    }
  };

  const getBetterWallet = () => {
    if (!result) return null;
    const scoreA = result.walletA.riskScore ?? 0;
    const scoreB = result.walletB.riskScore ?? 0;
    if (scoreA < scoreB) {
      return {
        winner: "Wallet A",
        address: result.walletA.address,
        score: scoreA,
        diff: scoreB - scoreA,
      };
    } else if (scoreB < scoreA) {
      return {
        winner: "Wallet B",
        address: result.walletB.address,
        score: scoreB,
        diff: scoreA - scoreB,
      };
    }
    return { winner: "Tie", address: null, score: scoreA, diff: 0 };
  };

  const better = getBetterWallet();
  const themeA = result ? getRiskTheme(result.walletA.riskLevel || "Low") : null;
  const themeB = result ? getRiskTheme(result.walletB.riskLevel || "Low") : null;

  return (
    <div className="cyber-card rounded-3xl p-6 sm:p-8 border border-cyan-500/25 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
          <GitCompare className="w-3.5 h-3.5" /> Heuristic Side-by-Side Comparator
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold font-heading text-white">
          Dual-Target Forensics & Risk Comparison
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Compare two Bitcoin addresses side-by-side across live on-chain balances, OFAC designations, mixer proximity, and heuristic scoring.
        </p>
      </div>

      {/* Target Address Inputs */}
      <form onSubmit={compareWallets} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-cyan-500/20 space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Target Address A
          </label>
          <input
            type="text"
            placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
            value={walletA}
            onChange={(e) => setWalletA(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition"
            required
          />
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-purple-500/20 space-y-2">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Target Address B
          </label>
          <input
            type="text"
            placeholder="e.g. 34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"
            value={walletB}
            onChange={(e) => setWalletB(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-purple-400 focus:outline-none transition"
            required
          />
        </div>

        <div className="md:col-span-2 flex justify-center pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <GitCompare className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Analyzing Both Live Targets..." : "Run Side-by-Side Forensics"}
          </button>
        </div>
      </form>

      {/* Comparison Results */}
      {result && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive Lower Risk Recommendation Banner */}
          {better && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Lower Heuristic Risk Profile:{" "}
                    <span className="text-emerald-400 font-mono">{better.winner}</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    {better.winner === "Tie"
                      ? "Both target addresses possess identical heuristic composite risk scores."
                      : `${better.winner} scored ${better.diff} points lower in composite exposure indicators.`}
                  </p>
                </div>
              </div>
              {better.address && (
                <div className="text-xs font-mono text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/5">
                  {truncateAddress(better.address, 8, 8)}
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side Comparison Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {/* Wallet A Card */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Target A</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${themeA.badge}`}>
                  {result.walletA.riskLevel || "Low"} Risk
                </span>
              </div>
              <div className="text-sm font-bold text-white break-all">{result.walletA.address}</div>
              <div className="text-3xl font-bold font-mono text-cyan-400">
                {result.walletA.riskScore ?? 0}
                <span className="text-sm text-slate-500">/100 Pts</span>
              </div>
            </div>

            {/* Wallet B Card */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-purple-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Target B</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${themeB.badge}`}>
                  {result.walletB.riskLevel || "Low"} Risk
                </span>
              </div>
              <div className="text-sm font-bold text-white break-all">{result.walletB.address}</div>
              <div className="text-3xl font-bold font-mono text-purple-400">
                {result.walletB.riskScore ?? 0}
                <span className="text-sm text-slate-500">/100 Pts</span>
              </div>
            </div>
          </div>

          {/* Detailed Forensic Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3.5 px-4">Forensic Metric</th>
                  <th className="py-3.5 px-4 text-cyan-300">Target A ({truncateAddress(result.walletA.address, 6, 6)})</th>
                  <th className="py-3.5 px-4 text-purple-300">Target B ({truncateAddress(result.walletB.address, 6, 6)})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* 1. Address Format */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Address Format Type</td>
                  <td className="py-3 px-4 text-white">{getAddressType(result.walletA.address)}</td>
                  <td className="py-3 px-4 text-white">{getAddressType(result.walletB.address)}</td>
                </tr>

                {/* 2. Balance */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">On-Chain Balance</td>
                  <td className="py-3 px-4 text-cyan-300 font-bold">{formatBtc(result.walletA.balance || 0)}</td>
                  <td className="py-3 px-4 text-purple-300 font-bold">{formatBtc(result.walletB.balance || 0)}</td>
                </tr>

                {/* 3. Total Received */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Total Lifetime Received</td>
                  <td className="py-3 px-4 text-emerald-400">+{formatBtc(result.walletA.totalReceived || 0)}</td>
                  <td className="py-3 px-4 text-emerald-400">+{formatBtc(result.walletB.totalReceived || 0)}</td>
                </tr>

                {/* 4. Transactions */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Transaction Count</td>
                  <td className="py-3 px-4 text-white">{result.walletA.transactions || result.walletA.txCount || 0} txs</td>
                  <td className="py-3 px-4 text-white">{result.walletB.transactions || result.walletB.txCount || 0} txs</td>
                </tr>

                {/* 5. OFAC Sanctions */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">OFAC Sanctions Hit</td>
                  <td className="py-3 px-4">
                    {result.walletA.sanctionsMatch ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Direct OFAC Hit
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean (0 hits)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {result.walletB.sanctionsMatch ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Direct OFAC Hit
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean (0 hits)
                      </span>
                    )}
                  </td>
                </tr>

                {/* 6. Mixer Proximity */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Privacy Mixer Proximity</td>
                  <td className="py-3 px-4">
                    {result.walletA.mixerExposure ? (
                      <span className="text-rose-400 font-bold">Detected Exposure</span>
                    ) : (
                      <span className="text-slate-400">None detected</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {result.walletB.mixerExposure ? (
                      <span className="text-rose-400 font-bold">Detected Exposure</span>
                    ) : (
                      <span className="text-slate-400">None detected</span>
                    )}
                  </td>
                </tr>

                {/* 7. Velocity / Churn */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Velocity / Churn Rate</td>
                  <td className="py-3 px-4 text-slate-300">
                    {result.walletA.breakdown?.velocityScore !== undefined
                      ? `${result.walletA.breakdown.velocityScore} pts`
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {result.walletB.breakdown?.velocityScore !== undefined
                      ? `${result.walletB.breakdown.velocityScore} pts`
                      : "—"}
                  </td>
                </tr>

                {/* 8. Entity Tag */}
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-slate-400 font-sans font-medium">Entity Reference Tag</td>
                  <td className="py-3 px-4 text-purple-300 font-sans">
                    {result.walletA.entityTag?.name || "Unlabeled Target"}
                  </td>
                  <td className="py-3 px-4 text-purple-300 font-sans">
                    {result.walletB.entityTag?.name || "Unlabeled Target"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletCompare;