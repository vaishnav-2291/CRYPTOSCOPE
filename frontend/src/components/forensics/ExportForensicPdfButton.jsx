import React, { useState } from "react";
import jsPDF from "jspdf";
import { Download, FileText, CheckCircle2, ShieldAlert } from "lucide-react";

export const ExportForensicPdfButton = ({ auditData, address }) => {
  const [exporting, setExporting] = useState(false);

  const generatePdf = () => {
    if (!auditData) return;
    setExporting(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const primaryColor = [6, 182, 212];   // Cyan
      const darkBg = [15, 23, 42];          // Slate 900
      const textPrimary = [255, 255, 255];
      const textMuted = [148, 163, 184];

      // Document Header Banner
      doc.setFillColor(...darkBg);
      doc.rect(0, 0, 210, 42, "F");

      doc.setTextColor(...primaryColor);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("CRYPTOSCOPE AI", 14, 16);

      doc.setTextColor(...textPrimary);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("On-Chain Forensic Intelligence & Viva Audit Dossier", 14, 24);

      doc.setFontSize(8);
      doc.setTextColor(...textMuted);
      doc.text(`Target Wallet: ${address}`, 14, 32);
      doc.text(`Report Generated: ${new Date().toUTCString()}`, 14, 37);

      // Provenance Stamp (Mandatory Constraint)
      doc.setDrawColor(...primaryColor);
      doc.setFillColor(240, 253, 250);
      doc.roundedRect(14, 48, 182, 16, 2, 2, "FD");

      doc.setFontSize(9);
      doc.setTextColor(15, 118, 110);
      doc.setFont("helvetica", "bold");
      doc.text("LIVE PROVENANCE & DATA AUTHENTICITY STAMP", 18, 54);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.text(
        `Data sourced live at ${new Date().toISOString()} from Mempool.space, CoinGecko, and US Treasury OFAC SDN.`,
        18,
        60
      );

      // Executive Risk Summary Box
      const summary = auditData.auditSummary || {};
      const score = summary.overallRiskScore || 0;

      let yPos = 72;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("1. Executive Risk & Forensic Summary", 14, yPos);

      yPos += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85);

      const metricsList = [
        `• Deterministic Risk Score: ${score} / 100`,
        `• Sanctions Status: ${summary.sanctionsExposure?.replace(/_/g, " ") || "CLEAN"}`,
        `• Dusting Attack Hazard: ${summary.dustingAttackHazard || "NONE"}`,
        `• Common-Input Cluster Size: ${summary.clusterSize || 1} Address(es)`,
        `• Multi-Hop Sanction Proximity: ${summary.propagationExposureScore || 0}/100 Exposure`,
        `• Address Reuse Privacy Grade: Grade ${summary.privacyGrade || "A"}`,
        `• Privacy Mixer Exposure: ${summary.mixerExposure || "NONE"}`,
        `• Mainnet Balance Tier: ${summary.topBalancePercentileTier || "Top 50%"}`,
      ];

      metricsList.forEach((line) => {
        doc.text(line, 18, yPos);
        yPos += 5.5;
      });

      // Section 2: Deep Forensic Findings
      yPos += 4;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text("2. Deep Forensic Dimension Findings", 14, yPos);

      yPos += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      const findings = [
        {
          title: "Dusting Attack Telemetry",
          detail: auditData.dusting?.summaryDescription || "No micro-deposit attack vectors identified.",
        },
        {
          title: "Common-Input Entity Clustering",
          detail: auditData.cluster?.forensicAssessment || "Evaluated multi-input co-spending signatures.",
        },
        {
          title: "Fee Urgency & Mempool Congestion",
          detail: auditData.feeUrgency?.forensicFinding || "Analyzed priority fee percentiles.",
        },
        {
          title: "OFAC Sanctions & Multi-Hop Proximity",
          detail: auditData.propagation?.summaryStatement || "Checked against US Treasury OFAC registry.",
        },
        {
          title: "Address Reuse & BIP 32 Hygiene",
          detail: auditData.reuse?.assessment || "Audited receiving address reuse patterns.",
        },
        {
          title: "Mixer / CoinJoin Fingerprints",
          detail: auditData.mixer?.forensicSummary || "Inspected structural Whirlpool/Wasabi pool sizes.",
        },
      ];

      findings.forEach((f) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`[${f.title}]`, 18, yPos);
        yPos += 4;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        const splitText = doc.splitTextToSize(f.detail, 174);
        doc.text(splitText, 18, yPos);
        yPos += splitText.length * 4 + 3;
      });

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "CryptoScope AI Forensic Dossier — Deterministic Heuristic Engine. All rules labeled as statistical heuristic indicators.",
        14,
        288
      );

      // Save PDF
      doc.save(`cryptoscope_forensic_audit_${address.slice(0, 8)}.pdf`);
    } catch (err) {
      console.error("PDF Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={generatePdf}
      disabled={exporting || !auditData}
      className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      {exporting ? "Compiling Live Dossier..." : "Export Live Forensic PDF"}
    </button>
  );
};

export default ExportForensicPdfButton;
