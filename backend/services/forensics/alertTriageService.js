/**
 * CryptoScope AI — Alert Triage & Severity Queue Service (Feature #18)
 * 
 * Computes dynamic composite severity rankings for watchlist alerts and incoming threats.
 * Solves analyst alert fatigue by presenting a prioritized, actionable triage workflow.
 */

const AlertTriage = require("../../models/alertTriageModel");
const InvestigationCase = require("../../models/investigationCaseModel");

class AlertTriageService {
    /**
     * Compute composite severity score (0 - 100)
     */
    calculateSeverityScore({ alertType, isSanctioned, propagationScore = 0, dustingHazard = "NONE", cddSpike = 0, feeRate = 0 }) {
        let score = 20; // Baseline

        if (isSanctioned || alertType === "SANCTION_PROXIMITY") score += 60;
        if (propagationScore > 0) score += Math.round(propagationScore * 0.4);
        if (dustingHazard === "HIGH") score += 25;
        else if (dustingHazard === "MODERATE") score += 15;
        if (cddSpike >= 500) score += 30;
        else if (cddSpike >= 50) score += 15;
        if (feeRate >= 150) score += 20;

        return Math.min(100, Math.max(10, score));
    }

    /**
     * Log a new triage alert
     */
    async logAlert(userId, alertData) {
        const severity = this.calculateSeverityScore({
            alertType: alertData.alertType,
            isSanctioned: alertData.isSanctioned,
            propagationScore: alertData.propagationScore,
            dustingHazard: alertData.dustingHazard,
            cddSpike: alertData.cddSpike,
            feeRate: alertData.feeRate,
        });

        let priority = "LOW";
        if (severity >= 80) priority = "CRITICAL";
        else if (severity >= 60) priority = "HIGH";
        else if (severity >= 40) priority = "MEDIUM";

        return AlertTriage.create({
            userId,
            address: alertData.address,
            alertType: alertData.alertType || "NEW_TRANSACTION",
            txid: alertData.txid || null,
            severityScore: severity,
            triagePriority: priority,
            triageStatus: "UNREAD",
            title: alertData.title || `Alert on watched wallet ${alertData.address.slice(0, 8)}...`,
            summary: alertData.summary || "On-chain activity detected requiring analyst review.",
            triggeredSignals: alertData.triggeredSignals || [],
            metadata: alertData.metadata || {},
        });
    }

    /**
     * Get prioritized triage queue
     */
    async getTriageQueue(userId, { status, priority, limit = 50 } = {}) {
        const query = { userId };
        if (status && status !== "ALL") query.triageStatus = status;
        if (priority && priority !== "ALL") query.triagePriority = priority;

        const alerts = await AlertTriage.find(query)
            .sort({ severityScore: -1, createdAt: -1 })
            .limit(limit)
            .populate("caseId", "title status priority");

        const unreadCount = await AlertTriage.countDocuments({ userId, triageStatus: "UNREAD" });
        const criticalCount = await AlertTriage.countDocuments({ userId, triagePriority: "CRITICAL", triageStatus: { $ne: "DISMISSED" } });

        return {
            queue: alerts,
            metrics: {
                totalInQueue: alerts.length,
                unreadCount,
                criticalCount,
            },
            queriedAt: new Date().toISOString(),
        };
    }

    /**
     * Update alert status
     */
    async updateAlertStatus(userId, alertId, status) {
        const alert = await AlertTriage.findOne({ _id: alertId, userId });
        if (!alert) throw new Error("Triage alert not found or unauthorized.");

        alert.triageStatus = status;
        await alert.save();
        return alert;
    }

    /**
     * Escalate alert into an Investigation Case in one click
     */
    async escalateAlertToCase(userId, alertId, { caseTitle, customNotes } = {}) {
        const alert = await AlertTriage.findOne({ _id: alertId, userId });
        if (!alert) throw new Error("Triage alert not found or unauthorized.");

        // Create new investigation case
        const title = caseTitle || `Investigation: Alert on ${alert.address.slice(0, 10)}...`;
        const newCase = await InvestigationCase.create({
            userId,
            title,
            description: `Escalated from Alert Triage Queue (${alert.alertType}, Severity: ${alert.severityScore}/100).\n${alert.summary}`,
            priority: alert.triagePriority === "CRITICAL" ? "CRITICAL" : "HIGH",
            caseTags: ["Escalated Alert", alert.alertType],
            addresses: [
                {
                    address: alert.address,
                    customLabel: "Escalated Alert Target",
                    analystNotes: customNotes || alert.summary,
                    addedAt: new Date(),
                },
            ],
            timelineNotes: [
                {
                    author: "Alert Triage Escalation",
                    content: `Alert [${alert.title}] escalated to formal investigation case with severity ${alert.severityScore}/100.`,
                    category: "FINDING",
                    createdAt: new Date(),
                },
            ],
        });

        alert.triageStatus = "ESCALATED_TO_CASE";
        alert.caseId = newCase._id;
        await alert.save();

        return {
            alert,
            createdCase: newCase,
        };
    }
}

module.exports = new AlertTriageService();
