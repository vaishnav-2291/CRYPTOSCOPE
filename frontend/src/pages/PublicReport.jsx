import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicReport } from "../services/api";
import { formatBtc, formatUsd, truncateAddress, getRiskTheme } from "../utils/constants";
import RiskGauge from "../components/RiskGauge";
import RiskRadarChart from "../components/RiskRadarChart";
import SecurityReportCard from "../components/SecurityReportCard";
import TransactionTable from "../components/TransactionTable";
import TransactionGraph from "../components/TransactionGraph";
import { Shield, Share2, Download, Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "../context/ToastContext";

const PublicReport = () => {
  const { id } = useParams();
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await getPublicReport(id);
        if (res?.report) {
          setReport(res.report);
        } else {
          setError("Report not found or unavailable.");
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load public report.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!report) return;
    try {
      const doc = new jsPDF();
      doc.setFillColor(8, 12, 20);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(0, 242, 254);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CryptoScope AI", 14, 18);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.text("Public Blockchain Security Audit Report", 14, 25);
      doc.text(`Generated: ${new Date().toUTCString()}`, 14, 32);

      autoTable(doc, {
        startY: 50,
        head: [["Field", "Value"]],
        body: [
          ["Target Wallet Address", report.address],
          ["Blockchain Network", "Bitcoin (Mainnet)"],
          ["Current Balance", `${report.balance || 0} BTC`],
          ["Deterministic Risk Score", `${report.riskScore || 0}/100 (${report.riskLevel || 'Low'} Risk)`],
          ["Entity Match", report.entityTag?.name || "Unclassified"],
        ],
        theme: "striped",
        headStyles: { fillColor: [6, 182, 212] },
      });

      doc.save(`CryptoScope_PublicReport_${report.address.slice(0, 8)}.pdf`);
      toast.success("Public report exported successfully as PDF");
    } catch (err) {
      toast.error("PDF export failed: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-lg font-bold font-heading">Loading Public Security Report...</h3>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center p-6">
        <div className="cyber-card rounded-2xl p-8 max-w-md text-center border border-rose-500/30 space-y-4">
          <div className="text-3xl">⚠️</div>
          <h3 className="text-xl font-bold font-heading text-white">Report Not Found</h3>
          <p className="text-xs text-slate-400">{error || "Unable to locate this scan record."}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const theme = getRiskTheme(report.riskLevel);

  return (
    <div className="min-h-screen bg-[#080C14] text-white py-10 px-4 md:px-8 selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition text-xs font-mono">
            <ArrowLeft className="w-4 h-4" /> CryptoScope AI Platform
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-mono transition flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Link Copied!" : "Copy Report Link"}
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
        </div>

        {/* Public Banner */}
        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-cyan-300 font-mono">
          <span>🌐 Public Verified Security Audit • Read-Only Live View</span>
          <span className="text-slate-300">Report generated: {new Date(report.createdAt || Date.now()).toLocaleString()}</span>
        </div>

        {/* Target Header Card */}
        <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
              Bitcoin Mainnet
            </span>
            {report.entityTag && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {report.entityTag.name}
              </span>
            )}
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${theme.badge}`}>
              {report.riskLevel} Risk ({report.riskScore}/100)
            </span>
          </div>

          <h1 className="text-base md:text-xl font-bold font-mono text-white break-all">
            {report.address}
          </h1>
        </div>

        {/* Key Metrics & Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col items-center justify-between">
            <h3 className="text-base font-bold font-heading text-white">Risk Score Evaluation</h3>
            <RiskGauge score={report.riskScore} level={report.riskLevel} size={220} />
            <p className="text-xs text-slate-400 text-center">
              Evaluated across 5 deterministic heuristic rule dimensions.
            </p>
          </div>

          <div className="cyber-card rounded-2xl p-6 border border-cyan-500/20 flex flex-col justify-between">
            <h3 className="text-base font-bold font-heading text-white">5-Axis Exposure Radar</h3>
            <RiskRadarChart breakdown={report.scoreBreakdown || report.breakdown || {}} riskScore={report.riskScore} />
          </div>
        </div>

        {/* Security Assessment Component */}
        <SecurityReportCard
          riskScore={report.riskScore}
          riskLevel={report.riskLevel}
          ruleTriggers={report.ruleTriggers || []}
          securityAssessment={report.securityAssessment || report.aiReport}
          transactions={report.transactions || []}
        />

        {/* Fund Flow Graph */}
        {report.graphData && (
          <TransactionGraph graphData={report.graphData} targetAddress={report.address} />
        )}
      </div>
    </div>
  );
};

export default PublicReport;
