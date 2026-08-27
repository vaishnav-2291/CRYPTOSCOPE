import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  FolderOpen,
  ShieldAlert,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Download,
  Eye,
  Tag,
  Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { forensicsApi } from "../services/forensicsApi";
import { useToast } from "../context/ToastContext";

export const CaseWorkspacePage = () => {
  const toast = useToast();
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [activeDossier, setActiveDossier] = useState(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Case Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newInitialAddress, setNewInitialAddress] = useState("");

  // Add Address Form inside Active Case
  const [addAddressInput, setAddAddressInput] = useState("");
  const [addAddressLabel, setAddAddressLabel] = useState("");
  const [addAddressNotes, setAddAddressNotes] = useState("");

  // Timeline Note Form
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("FINDING");

  const fetchCases = async () => {
    try {
      setLoadingCases(true);
      const res = await forensicsApi.getUserCases();
      setCases(res.cases || []);
      if (res.cases?.length > 0 && !activeCaseId) {
        setActiveCaseId(res.cases[0]._id);
      }
    } catch (err) {
      console.error("Fetch cases error:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  const fetchCaseDossier = async (id) => {
    if (!id) return;
    try {
      setLoadingDossier(true);
      const res = await forensicsApi.getCaseLiveDossier(id);
      setActiveDossier(res.dossier || null);
    } catch (err) {
      console.error("Fetch case dossier error:", err);
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (activeCaseId) {
      fetchCaseDossier(activeCaseId);
    }
  }, [activeCaseId]);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const initialAddresses = newInitialAddress.trim()
        ? [{ address: newInitialAddress.trim(), customLabel: "Primary Target" }]
        : [];

      const res = await forensicsApi.createCase({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        initialAddresses,
      });

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewInitialAddress("");
      await fetchCases();
      if (res.case?._id) setActiveCaseId(res.case._id);
    } catch (err) {
      console.error("Create case error:", err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addAddressInput.trim() || !activeCaseId) return;

    try {
      await forensicsApi.addAddressToCase(activeCaseId, {
        address: addAddressInput.trim(),
        customLabel: addAddressLabel.trim() || "Target Wallet",
        analystNotes: addAddressNotes.trim(),
      });
      setAddAddressInput("");
      setAddAddressLabel("");
      setAddAddressNotes("");
      fetchCaseDossier(activeCaseId);
    } catch (err) {
      console.error("Add address error:", err);
    }
  };

  const handleRemoveAddress = async (address) => {
    if (!activeCaseId) return;
    try {
      await forensicsApi.removeAddressFromCase(activeCaseId, address);
      fetchCaseDossier(activeCaseId);
    } catch (err) {
      console.error("Remove address error:", err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim() || !activeCaseId) return;

    try {
      await forensicsApi.addTimelineNote(activeCaseId, {
        content: noteContent.trim(),
        category: noteCategory,
      });
      setNoteContent("");
      fetchCaseDossier(activeCaseId);
    } catch (err) {
      console.error("Add note error:", err);
    }
  };

  const handleExportCasePdf = () => {
    if (!activeDossier) return;

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const c = activeDossier.caseInfo || {};
      const agg = activeDossier.aggregatedCaseMetrics || {};

      // Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(6, 182, 212);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CRYPTOSCOPE AI — CASE AUDIT DOSSIER", 14, 16);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Case: ${c.title || "Investigation"} (${c.priority} Priority)`, 14, 25);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toUTCString()}`, 14, 33);

      let yPos = 50;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("1. Aggregated Multi-Wallet Intelligence", 14, yPos);

      yPos += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`• Total Target Addresses: ${agg.totalAddressesTracked || 0}`, 18, yPos);
      yPos += 5;
      doc.text(`• Composite Risk Score: ${agg.compositeCaseRiskScore || 0} / 100`, 18, yPos);
      yPos += 5;
      doc.text(`• Aggregate Portfolio Balance: ${agg.aggregateHoldingsBtc || 0} BTC`, 18, yPos);
      yPos += 5;
      doc.text(`• Direct OFAC Sanctioned Hits: ${agg.sanctionsDesignationsFound || 0}`, 18, yPos);
      yPos += 5;
      doc.text(`• Privacy Mixer Associations: ${agg.mixerExposuresFound || 0}`, 18, yPos);

      yPos += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("2. Target Wallet Breakdown (Live Telemetry)", 14, yPos);

      yPos += 6;
      (activeDossier.wallets || []).forEach((w, idx) => {
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`[Wallet #${idx + 1}] ${w.address} (${w.customLabel || "Target"})`, 18, yPos);
        yPos += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(
          `Risk: ${w.liveMetrics?.riskScore || 0}/100 | Sanctions: ${w.liveMetrics?.sanctionsStatus} | Balance: ${w.liveMetrics?.balanceBtc || 0} BTC | CDD Peak: ${w.liveMetrics?.cddPeak || 0} CDD`,
          18,
          yPos
        );
        yPos += 4.5;
        if (w.analystNotes) {
          doc.text(`Analyst Note: ${w.analystNotes}`, 18, yPos);
          yPos += 4.5;
        }
        yPos += 2;
      });

      doc.save(`case_dossier_${(c.title || "audit").replace(/\s+/g, "_").toLowerCase()}.pdf`);
      toast.success("Case Dossier PDF downloaded successfully");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Failed to export dossier PDF: " + err.message);
    }
  };

  const handleShareInvestigation = () => {
    if (!activeDossier?.wallets || activeDossier.wallets.length === 0) {
      toast.info("Add at least one target wallet to share this live investigation report.");
      return;
    }
    const targetAddr = activeDossier.wallets[0].address;
    const shareUrl = `${window.location.origin}/report/${targetAddr}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success(`Shareable report link copied! (Report generated: ${new Date().toLocaleTimeString()})`);
  };

  const priorityColors = {
    CRITICAL: "text-red-400 border-red-500/40 bg-red-500/10",
    HIGH: "text-orange-400 border-orange-500/40 bg-orange-500/10",
    MEDIUM: "text-amber-400 border-amber-500/40 bg-amber-500/10",
    LOW: "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">Investigation Case Workspace</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Group multi-wallet targets into structured compliance cases with live on-chain re-hydration
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Investigation Case
          </button>
        </div>
      </div>

      {/* Main Workspace Layout (Left: Cases List, Right: Active Case Dossier) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cases Sidebar List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Analyst Cases ({cases.length})</span>
            <button onClick={fetchCases} className="text-cyan-400 hover:underline flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="space-y-2">
            {cases.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                No active investigation cases. Click "New Investigation Case" to create one.
              </div>
            ) : (
              cases.map((c) => (
                <button
                  key={c._id}
                  onClick={() => setActiveCaseId(c._id)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    activeCaseId === c._id
                      ? "bg-cyan-950/20 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm truncate">{c.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityColors[c.priority] || "border-slate-800"}`}>
                      {c.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description || "No description provided."}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60 font-mono">
                    <span>{c.addresses?.length || 0} Target Wallets</span>
                    <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Active Case Live Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {!activeDossier ? (
            <div className="cyber-card rounded-2xl p-12 border border-slate-800 bg-slate-900/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Investigation Case Selected</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Group multi-wallet targets into structured compliance cases with live on-chain re-hydration, aggregated holdings, and timeline tracking.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Investigation Case
                </button>
                <a
                  href="/scan"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition border border-slate-700 inline-flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> Start Wallet Scan
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Case Header Card */}
              <div className="cyber-card rounded-2xl p-6 border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white tracking-wide">{activeDossier.caseInfo?.title}</h2>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityColors[activeDossier.caseInfo?.priority]}`}>
                        {activeDossier.caseInfo?.priority} PRIORITY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{activeDossier.caseInfo?.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleShareInvestigation}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                      title="Generate live public report share link"
                    >
                      <Share2 className="w-3.5 h-3.5 text-cyan-400" /> Share Investigation
                    </button>
                    <button
                      onClick={() => fetchCaseDossier(activeCaseId)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingDossier ? "animate-spin" : ""}`} /> Re-Fetch Live
                    </button>
                    <button
                      onClick={handleExportCasePdf}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Export Case PDF
                    </button>
                  </div>
                </div>

                {/* Aggregated Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Composite Risk</div>
                    <div className="text-sm font-bold font-mono text-purple-400 mt-0.5">
                      {activeDossier.aggregatedCaseMetrics?.compositeCaseRiskScore || 0} / 100
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Aggregate Balance</div>
                    <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
                      {activeDossier.aggregatedCaseMetrics?.aggregateHoldingsBtc || 0} BTC
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Sanctions Hits</div>
                    <div className="text-sm font-bold font-mono text-red-400 mt-0.5">
                      {activeDossier.aggregatedCaseMetrics?.sanctionsDesignationsFound || 0}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Live Freshness</div>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      100% Live Sync 🟢
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Wallets List */}
              <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Associated Target Wallets ({activeDossier.wallets?.length || 0})
                  </h3>
                </div>

                {/* Add Target Address Form */}
                <form onSubmit={handleAddAddress} className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Bitcoin Address (1..., 3..., bc1...)"
                    value={addAddressInput}
                    onChange={(e) => setAddAddressInput(e.target.value)}
                    className="sm:col-span-5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Custom Label (e.g. Deposit Hot Wallet)"
                    value={addAddressLabel}
                    onChange={(e) => setAddAddressLabel(e.target.value)}
                    className="sm:col-span-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Analyst Notes"
                    value={addAddressNotes}
                    onChange={(e) => setAddAddressNotes(e.target.value)}
                    className="sm:col-span-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="sm:col-span-1 p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center justify-center"
                    title="Add target address to case"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Wallets Cards */}
                <div className="space-y-2.5">
                  {(activeDossier.wallets || []).map((w) => (
                    <div
                      key={w.address}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="font-bold text-cyan-300">{w.address}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-400">
                            {w.customLabel}
                          </span>
                        </div>
                        {w.analystNotes && (
                          <p className="text-[11px] text-slate-400 italic">"{w.analystNotes}"</p>
                        )}
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span>Risk: <b className="text-purple-300">{w.liveMetrics?.riskScore || 0}/100</b></span>
                          <span>Balance: <b className="text-white">{w.liveMetrics?.balanceBtc || 0} BTC</b></span>
                          <span>Sanctions: <b className={w.liveMetrics?.isDirectSanctioned ? "text-red-400" : "text-emerald-400"}>{w.liveMetrics?.sanctionsStatus}</b></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          to={`/forensics/${w.address}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-500/20 text-cyan-300 border border-slate-800 text-[11px] font-semibold flex items-center gap-1 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Full Audit
                        </Link>
                        <button
                          onClick={() => handleRemoveAddress(w.address)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-500 hover:text-red-400 border border-slate-800 transition-all"
                          title="Remove address from case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Case Notes & Hypotheses Timeline */}
              <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Analyst Findings & Hypotheses Timeline
                </h3>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 text-xs">
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value)}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FINDING">Finding</option>
                    <option value="HYPOTHESIS">Hypothesis</option>
                    <option value="EVIDENCE">Evidence</option>
                    <option value="COMPLIANCE_ACTION">Compliance Action</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Document analyst finding or compliance hypothesis..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> Add Note
                  </button>
                </form>

                {/* Timeline Feed */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(activeDossier.caseInfo?.timelineNotes || []).map((note) => (
                    <div
                      key={note._id || note.content}
                      className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="text-cyan-400 font-bold">[{note.category}] {note.author}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/40 bg-slate-900 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-white">Create New Investigation Case</h3>
            <form onSubmit={handleCreateCase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Case Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lazarus Mixer Cluster Investigation 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Case Hypothesis / Description</label>
                <textarea
                  rows="3"
                  placeholder="Describe the initial investigative reasoning..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Target Address</label>
                  <input
                    type="text"
                    placeholder="Bitcoin address (optional)"
                    value={newInitialAddress}
                    onChange={(e) => setNewInitialAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseWorkspacePage;
