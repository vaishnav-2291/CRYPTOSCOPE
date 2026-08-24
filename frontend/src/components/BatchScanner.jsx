import React, { useState } from "react";
import { batchScanWallets } from "../services/api";
import { SAMPLE_WALLETS, formatBtc, formatUsd, truncateAddress, getRiskTheme } from "../utils/constants";
import { Layers, Play, Download, Sparkles, CheckCircle2, AlertCircle, Search, ExternalLink } from "lucide-react";

const BatchScanner = ({ onSelectAddress }) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  // Extract cleaned addresses from text
  const parseAddresses = (text) => {
    return text
      .split(/[\n,\s]+/)
      .map((a) => a.trim())
      .filter((a) => a.length >= 26 && a.length <= 90);
  };

  const currentAddresses = parseAddresses(inputText);

  const handleFillSample = () => {
    const samples = SAMPLE_WALLETS.slice(0, 5).map((w) => w.address).join("\n");
    setInputText(samples);
  };

  const handleExecuteBatchScan = async () => {
    const addrs = parseAddresses(inputText);
    if (addrs.length === 0) {
      setError("Please provide at least one valid Bitcoin address.");
      return;
    }
    if (addrs.length > 20) {
      setError("Batch limit is 20 addresses per scan. Please reduce list size.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(25);

      const res = await batchScanWallets(addrs);
      setProgress(100);

      if (res?.results) {
        setResults(res);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Batch scan failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportBatchCSV = () => {
    if (!results?.results?.length) return;
    const headers = "Address,BalanceBTC,BalanceUSD,Transactions,RiskScore,RiskLevel,EntityTag,TopRiskFactor\n";
    const rows = results.results
      .map(
        (r) =>
          `"${r.address}",${r.balance || 0},${r.balanceUSD || 0},${r.transactions || 0},${r.riskScore || 0},"${r.riskLevel}","${r.entityTag?.name || 'N/A'}","${(r.topRiskFactor || '').replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cryptoscope_batch_scan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/25 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold font-heading text-white">Multi-Address Batch Scanner</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Perform parallel risk scoring across up to 20 Bitcoin addresses simultaneously with consolidated audit results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleFillSample}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-medium border border-cyan-500/30 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Sample 5-Wallet Batch
          </button>
        </div>
      </div>

      {/* Input Textarea Area */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            rows={5}
            placeholder="Paste Bitcoin addresses (one per line, comma, or space separated)...&#10;1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa&#10;34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 leading-relaxed"
          />

          <div className="absolute bottom-3 right-3 text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2 py-1 rounded border border-white/10">
            {currentAddresses.length}/20 Addresses
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            {currentAddresses.length > 0
              ? `Ready to scan ${currentAddresses.length} target(s) concurrently`
              : "Enter or paste Bitcoin addresses to begin"}
          </span>

          <button
            onClick={handleExecuteBatchScan}
            disabled={loading || currentAddresses.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Scanning Batch ({progress}%)...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Execute Batch Scan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Table */}
      {results && results.results && (
        <div className="space-y-4 pt-4 border-t border-white/10 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold font-heading text-white">
                Batch Scan Results ({results.scannedCount} Processed)
              </h4>
            </div>

            <button
              onClick={handleExportBatchCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono border border-white/10 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Export Batch CSV
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">TX Count</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Entity Intel</th>
                  <th className="py-3 px-4">Key Factor</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.results.map((row, idx) => {
                  const theme = getRiskTheme(row.riskLevel);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-white font-medium">
                        {truncateAddress(row.address, 6, 6)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="text-slate-200">{formatBtc(row.balance)}</span>
                          <span className="text-[10px] text-slate-500">{formatUsd(row.balanceUSD)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{row.transactions?.toLocaleString() || 0}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
                          {row.riskScore}/100 • {row.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {row.entityTag ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                            {row.entityTag.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Unclassified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate" title={row.topRiskFactor}>
                        {row.topRiskFactor}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {onSelectAddress && (
                          <button
                            onClick={() => onSelectAddress(row.address)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-bold text-[11px] transition inline-flex items-center gap-1"
                          >
                            <Search className="w-3 h-3" /> Inspect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchScanner;
