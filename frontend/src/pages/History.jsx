import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScanHistory } from "../services/api";
import { formatBtc, truncateAddress, getRiskTheme } from "../utils/constants";
import { History as HistoryIcon, RefreshCw, Search, ExternalLink, ArrowRight } from "lucide-react";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getScanHistory();
      if (res?.history) {
        setHistory(res.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = history.filter((w) =>
    !search ||
    w.address.toLowerCase().includes(search.toLowerCase()) ||
    w.entityTag?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-cyan-400" /> Wallet Scan History & Audit Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical log of all executed scans with risk scores, UTXO totals, and stored security parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search address or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-white/10 transition"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* History Grid */}
      {loading ? (
        <div className="py-12 text-center text-cyan-400 text-xs font-mono">
          Loading scan audit history...
        </div>
      ) : filtered.length === 0 ? (
        <div className="cyber-card rounded-2xl p-12 text-center text-slate-400 text-xs font-mono border border-white/5">
          No scan history records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {filtered.map((wallet, idx) => {
            const theme = getRiskTheme(wallet.riskLevel);
            return (
              <div
                key={wallet._id || idx}
                className="cyber-card cyber-card-hover rounded-2xl p-5 border border-cyan-500/20 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Target Address
                    </span>
                    <span className="text-sm font-bold text-white break-all">
                      {truncateAddress(wallet.address, 10, 10)}
                    </span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
                    {wallet.riskScore}/100 • {wallet.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500">Balance</span>
                    <div className="text-xs font-bold text-white">{formatBtc(wallet.balance)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Transfers</span>
                    <div className="text-xs font-bold text-cyan-400">{wallet.transactions || 0}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Inbound</span>
                    <div className="text-xs font-bold text-emerald-400">+{wallet.totalReceived || 0} BTC</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Scanned: {new Date(wallet.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => navigate(`/scan?address=${encodeURIComponent(wallet.address)}`)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
                  >
                    <span>Inspect Target</span> <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default History;