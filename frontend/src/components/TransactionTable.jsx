import React, { useState } from "react";
import { formatBtc, formatUsd, truncateAddress } from "../utils/constants";
import { ExternalLink, Copy, Check, ChevronDown, ChevronUp, Download, ArrowDownLeft, ArrowUpRight, Filter, Search } from "lucide-react";
import { getWalletTransactions } from "../services/api";

const TransactionTable = ({
  initialTransactions = [],
  address = "",
  btcPriceUSD = 95000,
  hasMore = false,
  lastSeenTxId = null,
}) => {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [expandedTx, setExpandedTx] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [directionFilter, setDirectionFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(lastSeenTxId);
  const [canLoadMore, setCanLoadMore] = useState(hasMore);

  const handleCopy = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await getWalletTransactions(address, nextCursor);
      if (res?.transactions && res.transactions.length > 0) {
        setTransactions((prev) => [...prev, ...res.transactions]);
        setNextCursor(res.nextAfterTxid);
        setCanLoadMore(res.hasMore);
      } else {
        setCanLoadMore(false);
      }
    } catch (err) {
      console.error("Failed to load more transactions:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Export current view to CSV
  const handleExportCSV = () => {
    if (!transactions.length) return;
    const headers = "TxHash,Direction,AmountBTC,AmountUSD,FeeBTC,Status,Timestamp,BlockHeight\n";
    const rows = transactions
      .map(
        (t) =>
          `"${t.hash}","${t.direction}",${t.amount},${(t.amount * btcPriceUSD).toFixed(2)},${t.feeBTC || 0},"${t.status}","${t.timestamp}",${t.blockHeight || "Pending"}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `cryptoscope_${address.slice(0, 8)}_transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTxs = transactions.filter((tx) => {
    const matchesDir = directionFilter === "ALL" || tx.direction === directionFilter;
    const matchesSearch =
      !searchQuery ||
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.inputs?.some((i) => i.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      tx.outputs?.some((o) => o.address.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDir && matchesSearch;
  });

  return (
    <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <span className="text-cyan-400">📜</span> Transaction Ledger
          </h3>
          <p className="text-xs text-slate-400">
            Full UTXO ledger history with pagination, confirmation verification, and script inspection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Direction Filter */}
          <div className="flex items-center rounded-xl bg-slate-900/80 p-1 border border-white/10 text-xs">
            {["ALL", "INCOMING", "OUTGOING"].map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  directionFilter === dir
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {dir === "ALL" ? "All" : dir === "INCOMING" ? "Inbound" : "Outbound"}
              </button>
            ))}
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter hash or counterparty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-48 md:w-56"
            />
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-white/10 transition flex items-center gap-1.5 text-xs"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      {filteredTxs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          No transactions match the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Transaction Hash</th>
                <th className="py-3 px-4">Net Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredTxs.map((tx) => {
                const isExpanded = expandedTx === tx.hash;
                const isIn = tx.direction === "INCOMING";

                return (
                  <React.Fragment key={tx.hash}>
                    <tr className="hover:bg-slate-800/40 transition-colors">
                      {/* Direction Icon & Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isIn
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {isIn ? (
                            <>
                              <ArrowDownLeft className="w-3 h-3" /> Received
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3 h-3" /> Sent
                            </>
                          )}
                        </span>
                      </td>

                      {/* Hash with copy & mempool link */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">
                            {truncateAddress(tx.hash, 8, 8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.hash)}
                            className="text-slate-500 hover:text-cyan-400 transition"
                            title="Copy Hash"
                          >
                            {copiedHash === tx.hash ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://mempool.space/tx/${tx.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-cyan-400 transition"
                            title="View on Mempool.space"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      {/* Net Value */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className={`font-bold ${isIn ? "text-emerald-400" : "text-slate-200"}`}>
                            {isIn ? "+" : "-"}{formatBtc(tx.amount)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatUsd(tx.amount * btcPriceUSD)}
                          </span>
                        </div>
                      </td>

                      {/* Confirmation Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            tx.status === "Confirmed"
                              ? "bg-slate-800 text-slate-300 border border-slate-700"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse"
                          }`}
                        >
                          {tx.status} {tx.blockHeight ? `(#${tx.blockHeight})` : ""}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(tx.timestamp).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Expand Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedTx(isExpanded ? null : tx.hash)}
                          className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Inputs & Outputs Breakdown */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan={6} className="p-4 border-b border-cyan-500/20">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {/* Inputs Column */}
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
                              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                                Inputs ({tx.inputs?.length || 0})
                              </h5>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {(tx.inputs || []).map((inp, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 text-[11px]"
                                  >
                                    <span className="text-slate-300 truncate max-w-[200px]" title={inp.address}>
                                      {truncateAddress(inp.address, 6, 6)}
                                    </span>
                                    {inp.entityTag && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                        {inp.entityTag.name}
                                      </span>
                                    )}
                                    <span className="text-slate-400 font-bold">{formatBtc(inp.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Outputs Column */}
                            <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2">
                              <h5 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                                <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />
                                Outputs ({tx.outputs?.length || 0})
                              </h5>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                {(tx.outputs || []).map((out, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-1.5 rounded bg-slate-950/60 text-[11px]"
                                  >
                                    <span className="text-slate-300 truncate max-w-[200px]" title={out.address}>
                                      {truncateAddress(out.address, 6, 6)}
                                    </span>
                                    {out.entityTag && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                        {out.entityTag.name}
                                      </span>
                                    )}
                                    <span className="text-slate-400 font-bold">{formatBtc(out.value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Fee Info */}
                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-white/5">
                            <span>Network Fee: <strong className="text-cyan-400">{formatBtc(tx.feeBTC || 0)}</strong></span>
                            <span>Total Volume: <strong className="text-white">{formatBtc(tx.totalVolume || tx.amount)}</strong></span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination / Load More */}
      {canLoadMore && (
        <div className="pt-2 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-mono font-semibold text-xs border border-cyan-500/30 transition disabled:opacity-50"
          >
            {loadingMore ? "Fetching Next Block Pages..." : "Load Older Transactions ↓"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
