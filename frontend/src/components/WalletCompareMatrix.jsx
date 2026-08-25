import React, { useState } from "react";
import { scanWallet } from "../services/api";
import { formatBtc, formatUsd, truncateAddress, getRiskTheme } from "../utils/constants";
import { Radar } from "react-chartjs-2";
import { GitCompare, Plus, Trash2, Search, AlertCircle } from "lucide-react";

const WALLET_COLORS = [
  { border: "#00F2FE", bg: "rgba(0, 242, 254, 0.2)" },
  { border: "#F59E0B", bg: "rgba(245, 158, 11, 0.2)" },
  { border: "#EF4444", bg: "rgba(239, 68, 68, 0.2)" },
  { border: "#10B981", bg: "rgba(16, 185, 129, 0.2)" },
];

const WalletCompareMatrix = () => {
  const [addresses, setAddresses] = useState([]);
  const [newAddr, setNewAddr] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletsData, setWalletsData] = useState([]);
  const [error, setError] = useState(null);

  const handleAddAddress = () => {
    if (!newAddr.trim()) return;
    if (addresses.length >= 4) {
      setError("Maximum 4 wallets can be compared side-by-side.");
      return;
    }
    if (addresses.includes(newAddr.trim())) {
      setError("This address is already in the comparison list.");
      return;
    }
    setAddresses([...addresses, newAddr.trim()]);
    setNewAddr("");
    setError(null);
  };

  const handleRemove = (idx) => {
    setAddresses(addresses.filter((_, i) => i !== idx));
    setWalletsData(walletsData.filter((_, i) => i !== idx));
  };

  const handleRunComparison = async () => {
    if (addresses.length < 2) {
      setError("Please add at least 2 addresses to compare.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const results = await Promise.all(
        addresses.map(async (addr) => {
          try {
            return await scanWallet(addr);
          } catch (err) {
            return { address: addr, error: err.message };
          }
        })
      );
      setWalletsData(results);
    } catch (err) {
      setError("Comparison execution failed.");
    } finally {
      setLoading(false);
    }
  };

  // Build Multi-Dataset Radar Chart
  const radarDatasets = walletsData
    .filter((w) => !w.error)
    .map((w, idx) => {
      const color = WALLET_COLORS[idx % WALLET_COLORS.length];
      const bd = w.breakdown || {};
      return {
        label: `${truncateAddress(w.address, 4, 4)} (${w.riskLevel})`,
        data: [
          Math.round(((bd.transactionRisk || 0) / 25) * 100),
          Math.round(((bd.balanceRisk || 0) / 20) * 100),
          Math.round(((bd.patternRisk || 0) / 25) * 100),
          Math.round(((bd.activityRisk || 0) / 15) * 100),
          Math.round(((bd.entityRisk || 0) / 35) * 100),
        ],
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointBackgroundColor: color.border,
      };
    });

  const radarData = {
    labels: [
      "Transaction Velocity",
      "Balance Exposure",
      "Transit Pattern",
      "Activity Consistency",
      "Entity & Sanctions",
    ],
    datasets: radarDatasets,
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        grid: { color: "rgba(255, 255, 255, 0.08)" },
        pointLabels: { color: "#94A3B8", font: { size: 10, family: "Inter" } },
        ticks: { display: false, min: 0, max: 100 },
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#F1F5F9", font: { size: 11, family: "JetBrains Mono" } },
      },
    },
  };

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/25 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold font-heading text-white">Multi-Wallet Risk Comparison Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare 2 to 4 Bitcoin wallets side-by-side with overlaid 5-axis radar charts and comparative risk matrices.
          </p>
        </div>
      </div>

      {/* Target Address Selector Chips */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {addresses.map((addr, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs font-mono text-white"
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: WALLET_COLORS[idx % WALLET_COLORS.length].border }}
              />
              <span>{truncateAddress(addr, 6, 6)}</span>
              <button
                onClick={() => handleRemove(idx)}
                className="text-slate-500 hover:text-rose-400 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {addresses.length < 4 && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Add Bitcoin Address..."
                value={newAddr}
                onChange={(e) => setNewAddr(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
              <button
                onClick={handleAddAddress}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 transition"
                title="Add Wallet"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-rose-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {error}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleRunComparison}
            disabled={loading || addresses.length < 2}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {loading ? "Analyzing Wallets in Parallel..." : "Compare Selected Wallets"}
          </button>
        </div>
      </div>

      {/* Comparison Results */}
      {walletsData.length > 0 && (
        <div className="space-y-6 pt-4 border-t border-white/10 animate-in fade-in">
          {/* Overlaid Radar Chart */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-4 text-center">
              Overlaid 5-Axis Risk Profile Comparison
            </h4>
            <div className="h-72 w-full">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>

          {/* Side-by-Side Metric Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">Metric / Dimension</th>
                  {walletsData.map((w, idx) => (
                    <th key={idx} className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-white">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: WALLET_COLORS[idx % WALLET_COLORS.length].border }}
                        />
                        <span>{truncateAddress(w.address, 6, 6)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-3 px-4 font-sans font-semibold text-slate-300">Deterministic Risk Score</td>
                  {walletsData.map((w, idx) => {
                    const theme = getRiskTheme(w.riskLevel);
                    return (
                      <td key={idx} className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase border ${theme.badge}`}>
                          {w.riskScore}/100 • {w.riskLevel}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Current Balance</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4 text-white font-bold">
                      {formatBtc(w.balance)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Total Inflow / Outflow</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4 text-slate-300">
                      +{w.totalReceived || 0} / -{w.totalSent || 0} BTC
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Transaction Velocity</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4 text-slate-300">
                      {w.transactionCount?.toLocaleString() || 0} TXs ({w.breakdown?.transactionRisk || 0}/25 pts)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Transit / Churn Pattern</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4 text-slate-300">
                      {w.breakdown?.patternRisk || 0}/25 pts
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Entity & Sanctions Exposure</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4">
                      {w.entityTag ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {w.entityTag.name}
                        </span>
                      ) : (
                        <span className="text-slate-500">Unclassified</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-400">Triggered Rules</td>
                  {walletsData.map((w, idx) => (
                    <td key={idx} className="py-3 px-4 text-rose-300 font-bold">
                      {w.ruleTriggers?.length || 0} Active Rules
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCompareMatrix;
