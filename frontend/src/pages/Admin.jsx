import React, { useState, useEffect } from "react";
import { getAdminStats, getAdminEntities, getAdminScans } from "../services/api";
import { formatBtc, truncateAddress, getRiskTheme } from "../utils/constants";
import { Settings, Shield, Server, Users, Database, Activity, Search } from "lucide-react";

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [entities, setEntities] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [entitySearch, setEntitySearch] = useState("");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [statsRes, entitiesRes, scansRes] = await Promise.all([
          getAdminStats().catch(() => null),
          getAdminEntities().catch(() => null),
          getAdminScans().catch(() => null),
        ]);

        if (statsRes?.platformStats) setStats(statsRes.platformStats);
        if (entitiesRes?.entities) setEntities(entitiesRes.entities);
        if (scansRes?.scans) setScans(scansRes.scans);
      } catch (err) {
        console.error("Admin data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const filteredEntities = entities.filter((e) => {
    const matchCat = filterCategory === "ALL" || e.category.includes(filterCategory);
    const matchSearch =
      !entitySearch ||
      e.name.toLowerCase().includes(entitySearch.toLowerCase()) ||
      e.address.toLowerCase().includes(entitySearch.toLowerCase()) ||
      e.category.toLowerCase().includes(entitySearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Admin Header */}
      <div className="cyber-card rounded-2xl p-6 border border-purple-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-heading text-white">Platform Administration Console</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                Admin Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              System-wide metrics, cache memory telemetry, known entity catalog management, and audit inspection.
            </p>
          </div>
        </div>
      </div>

      {/* Global System Telemetry KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Total Registered Users</span>
          <div className="text-2xl font-bold text-white">{stats?.totalUsers ?? 0}</div>
          <span className="text-[10px] text-cyan-400">Database Accounts</span>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Total Scans Executed</span>
          <div className="text-2xl font-bold text-white">{stats?.totalScans ?? 0}</div>
          <span className="text-[10px] text-slate-400">Across All Accounts</span>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">In-Memory Cache Hit Rate</span>
          <div className="text-2xl font-bold text-emerald-400">
            {stats?.cacheDiagnostics?.hitRate || "0.0%"}
          </div>
          <span className="text-[10px] text-slate-400">
            {stats?.cacheDiagnostics?.hits || 0} Hits / {stats?.cacheDiagnostics?.misses || 0} Misses
          </span>
        </div>

        <div className="cyber-card rounded-xl p-4 border border-cyan-500/20 space-y-1">
          <span className="text-slate-400">Known Entity Registry</span>
          <div className="text-2xl font-bold text-purple-300">{entities.length}</div>
          <span className="text-[10px] text-purple-400">Exchanges, Mixers & Threats</span>
        </div>
      </div>

      {/* Known Entity Intelligence Directory */}
      <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="text-lg font-bold font-heading text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" /> Curated Entity Intelligence Catalog
            </h3>
            <p className="text-xs text-slate-400">
              Verified directory used for heuristic tagging, risk weighting, and sanctions detection.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entities..."
                value={entitySearch}
                onChange={(e) => setEntitySearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bitcoin Address</th>
                <th className="py-3 px-4">Risk Weight</th>
                <th className="py-3 px-4">Sanctions Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEntities.map((ent, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-white flex items-center gap-2">
                    <span className="text-base">{ent.icon}</span>
                    <span>{ent.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{ent.category}</td>
                  <td className="py-3 px-4 text-cyan-300 font-mono">{truncateAddress(ent.address, 8, 8)}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-200">{ent.riskWeight}/100</span>
                  </td>
                  <td className="py-3 px-4">
                    {ent.isSanctioned ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        OFAC SANCTIONED
                      </span>
                    ) : ent.isMixer ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        PRIVACY MIXER
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        CLEAN / VERIFIED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
