import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBtc, formatUsd, truncateAddress } from "../utils/constants";
import { Download, Share2, Copy, Check, FileText, X, Globe, Shield } from "lucide-react";
import { useToast } from "../context/ToastContext";

const ExportReportModal = ({
  isOpen,
  onClose,
  walletData = {},
  riskData = {},
  scanId = "",
}) => {
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const address = walletData.address || "";
  const shareableUrl = `${window.location.origin}/report/${scanId || address}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF();

      // Cyber Fintech Dark Theme Header Block
      doc.setFillColor(8, 12, 20);
      doc.rect(0, 0, 210, 40, "F");

      doc.setTextColor(0, 242, 254);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("CryptoScope AI", 14, 18);

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Blockchain Wallet Risk Analysis & Security Intelligence Report", 14, 25);
      doc.text(`Generated: ${new Date().toUTCString()}`, 14, 32);

      // Status Pill
      const score = riskData.riskScore || 0;
      const level = riskData.riskLevel || "Low";

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Target Overview", 14, 50);

      // Overview Info Box
      autoTable(doc, {
        startY: 54,
        head: [["Attribute", "Value"]],
        body: [
          ["Target Wallet Address", address],
          ["Blockchain Network", "Bitcoin (Mainnet)"],
          ["Current Balance", `${walletData.balance || 0} BTC (${formatUsd(walletData.balanceUSD || 0)})`],
          ["Total Received / Sent", `${walletData.totalReceived || 0} BTC / ${walletData.totalSent || 0} BTC`],
          ["Total Confirmed TXs", `${walletData.transactionCount || 0} transactions`],
          ["Deterministic Risk Score", `${score}/100 (${level} Risk)`],
          ["Entity Classification", walletData.entityTag?.name || "Unclassified Address"],
        ],
        theme: "striped",
        headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255] },
        styles: { fontSize: 9 },
      });

      // 5-Axis Score Breakdown Table
      const bd = riskData.breakdown || {};
      const breakdownY = doc.lastAutoTable.finalY + 10;
      doc.text("5-Axis Risk Engine Breakdown", 14, breakdownY);

      autoTable(doc, {
        startY: breakdownY + 4,
        head: [["Risk Dimension", "Score Allocated", "Max Weight", "Assessment"]],
        body: [
          ["Transaction Velocity Risk", `${bd.transactionRisk || 0} pts`, "25 pts", bd.transactionRisk > 15 ? "Elevated" : "Normal"],
          ["Balance Exposure Risk", `${bd.balanceRisk || 0} pts`, "20 pts", bd.balanceRisk > 10 ? "Whale Balance" : "Standard"],
          ["Transit Pattern Risk", `${bd.patternRisk || 0} pts`, "25 pts", bd.patternRisk > 15 ? "High Churn" : "Clean"],
          ["Activity & Age Consistency", `${bd.activityRisk || 0} pts`, "15 pts", bd.activityRisk > 8 ? "Dormant/Burst" : "Normal"],
          ["Entity & Sanctions Exposure", `${bd.entityRisk || 0} pts`, "35 pts", bd.entityRisk > 10 ? "Sanction/Mixer Associated" : "Clean"],
        ],
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], textColor: [0, 242, 254] },
        styles: { fontSize: 8.5 },
      });

      // Triggered Rules Table
      const rules = riskData.ruleTriggers || [];
      if (rules.length > 0) {
        const rulesY = doc.lastAutoTable.finalY + 10;
        doc.text("Active Heuristic Rule Triggers", 14, rulesY);

        autoTable(doc, {
          startY: rulesY + 4,
          head: [["Rule Code", "Severity", "Description", "Metric", "Points"]],
          body: rules.map((r) => [
            r.id,
            r.severity,
            r.title,
            r.metric,
            `+${r.points} pts`,
          ]),
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
          styles: { fontSize: 8 },
        });
      }

      // Disclaimer Footer
      const footerY = doc.internal.pageSize.height - 20;
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Disclaimer: CryptoScope AI evaluations are deterministic rule-based heuristic assessments for research and compliance audits.",
        14,
        footerY
      );

      doc.save(`CryptoScope_Report_${address.slice(0, 8)}.pdf`);
      toast.success("Security Report exported successfully as PDF");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to export PDF: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="cyber-card rounded-2xl w-full max-w-lg p-6 border border-cyan-500/30 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-heading text-white">Export & Share Security Report</h3>
            <p className="text-xs text-slate-400">Generate executive PDF, CSV ledger, or public shareable link.</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* PDF Report Option */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Executive PDF Audit Report</h4>
                <p className="text-xs text-slate-400">Includes 5-axis radar metrics, rule triggers, and score audit.</p>
              </div>
            </div>

            <button
              onClick={handleGeneratePDF}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>

          {/* Shareable Public Web Link */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Shareable Public Scan Link</h4>
                <p className="text-xs text-slate-400">Anyone with this link can view this scan without logging in.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 font-mono text-xs border border-white/10 transition flex items-center gap-1.5 flex-shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal;
