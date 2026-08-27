/**
 * CryptoScope AI — Investigation Case Workspace Service (Feature #16)
 * 
 * Manages analyst cases grouping multiple target addresses with custom notes/hypotheses.
 * 
 * CRITICAL LIVE-DATA RULE:
 * When a case is opened or refreshed (getCaseLiveDossier), all on-chain forensic data
 * for every address in the case is RE-FETCHED LIVE in parallel — zero stale cached data.
 */

const InvestigationCase = require("../../models/investigationCaseModel");
const dustingDetector = require("./dustingDetector");
const clusterEngine = require("./clusterEngine");
const feeUrgencyAnalyzer = require("./feeUrgencyAnalyzer");
const sanctionsChecker = require("./sanctionsChecker");
const explainabilityService = require("./explainabilityService");
const riskPropagationEngine = require("./riskPropagationEngine");
const addressReuseDetector = require("./addressReuseDetector");
const mixerDetector = require("./mixerDetector");
const coinDaysDestroyedDetector = require("./coinDaysDestroyedDetector");
const peerPercentileRanker = require("./peerPercentileRanker");

class CaseService {
    /**
     * Create a new investigation case
     */
    async createCase(userId, { title, description, priority, caseTags, initialAddresses = [] }) {
        if (!title || typeof title !== "string") {
            throw new Error("Case title is required.");
        }

        const addresses = (initialAddresses || []).map((item) => {
            const addr = typeof item === "string" ? item : item.address;
            const label = typeof item === "object" && item.customLabel ? item.customLabel : "Target Wallet";
            const notes = typeof item === "object" && item.analystNotes ? item.analystNotes : "";
            return { address: addr.trim(), customLabel: label, analystNotes: notes, addedAt: new Date() };
        });

        const newCase = await InvestigationCase.create({
            userId,
            title: title.trim(),
            description: description || "",
            priority: priority || "MEDIUM",
            caseTags: Array.isArray(caseTags) && caseTags.length > 0 ? caseTags : ["On-Chain Audit"],
            addresses,
            timelineNotes: [
                {
                    author: "System / Lead Analyst",
                    content: `Case created with ${addresses.length} target address(es). Initial investigation initialized.`,
                    category: "FINDING",
                    createdAt: new Date(),
                },
            ],
        });

        return newCase;
    }

    /**
     * Get all cases for user
     */
    async getUserCases(userId) {
        return InvestigationCase.find({ userId }).sort({ updatedAt: -1 });
    }

    /**
     * Get single case by ID
     */
    async getCaseById(caseId, userId) {
        const targetCase = await InvestigationCase.findOne({ _id: caseId, userId });
        if (!targetCase) {
            throw new Error("Investigation case not found or unauthorized.");
        }
        return targetCase;
    }

    /**
     * Compile LIVE multi-wallet forensic dossier for the case
     * Re-fetches fresh on-chain data for all target addresses in parallel
     */
    async getCaseLiveDossier(caseId, userId) {
        const targetCase = await this.getCaseById(caseId, userId);

        const liveWalletAudits = await Promise.all(
            targetCase.addresses.map(async (target) => {
                const cleanAddr = target.address;

                try {
                    const [
                        dusting,
                        cluster,
                        feeUrgency,
                        sanctions,
                        explainability,
                        propagation,
                        reuse,
                        mixer,
                        cdd,
                        percentile,
                    ] = await Promise.all([
                        dustingDetector.analyzeAddress(cleanAddr).catch((e) => ({ error: e.message })),
                        clusterEngine.extractCluster(cleanAddr).catch((e) => ({ error: e.message })),
                        feeUrgencyAnalyzer.analyzeFeeUrgency(cleanAddr).catch((e) => ({ error: e.message })),
                        sanctionsChecker.checkSanctionsExposure(cleanAddr).catch((e) => ({ error: e.message })),
                        explainabilityService.generateExplainabilityReport(cleanAddr).catch((e) => ({ error: e.message })),
                        riskPropagationEngine.calculatePropagation(cleanAddr, 1).catch((e) => ({ error: e.message })),
                        addressReuseDetector.analyzeAddressReuse(cleanAddr).catch((e) => ({ error: e.message })),
                        mixerDetector.analyzeMixerExposure(cleanAddr).catch((e) => ({ error: e.message })),
                        coinDaysDestroyedDetector.analyzeCoinDaysDestroyed(cleanAddr).catch((e) => ({ error: e.message })),
                        peerPercentileRanker.rankAddressPeers(cleanAddr).catch((e) => ({ error: e.message })),
                    ]);

                    return {
                        address: cleanAddr,
                        customLabel: target.customLabel,
                        analystNotes: target.analystNotes,
                        addedAt: target.addedAt,
                        liveMetrics: {
                            riskScore: explainability.riskScore || 0,
                            riskLevel: explainability.riskLevel || "Low",
                            sanctionsStatus: sanctions.exposureLevel || "CLEAN",
                            isDirectSanctioned: Boolean(sanctions.isDirectSanctioned),
                            balanceBtc: percentile.balanceBtc || 0,
                            clusterCount: cluster.clusterSize || 1,
                            privacyGrade: reuse.privacyGrade || "A",
                            mixerExposure: mixer.mixerExposureLevel || "NONE",
                            cddPeak: cdd.metrics?.maxSingleTxCdd || 0,
                            dormancySignal: cdd.dormancyClassification?.reactivationSignal || "STANDARD_CIRCULATION",
                        },
                        details: {
                            dusting,
                            cluster,
                            sanctions,
                            explainability,
                            propagation,
                            cdd,
                        },
                    };
                } catch (err) {
                    return {
                        address: cleanAddr,
                        customLabel: target.customLabel,
                        analystNotes: target.analystNotes,
                        addedAt: target.addedAt,
                        error: err.message,
                    };
                }
            })
        );

        // Compute case-wide aggregate risk & exposure metrics
        let maxRiskScore = 0;
        let totalPortfolioBtc = 0;
        let totalSanctionedHits = 0;
        let totalMixerHits = 0;

        liveWalletAudits.forEach((w) => {
            if (w.liveMetrics) {
                if (w.liveMetrics.riskScore > maxRiskScore) maxRiskScore = w.liveMetrics.riskScore;
                totalPortfolioBtc += w.liveMetrics.balanceBtc || 0;
                if (w.liveMetrics.isDirectSanctioned) totalSanctionedHits++;
                if (w.liveMetrics.mixerExposure === "HIGH") totalMixerHits++;
            }
        });

        return {
            caseInfo: targetCase,
            aggregatedCaseMetrics: {
                totalAddressesTracked: targetCase.addresses.length,
                compositeCaseRiskScore: maxRiskScore,
                aggregateHoldingsBtc: +totalPortfolioBtc.toFixed(6),
                sanctionsDesignationsFound: totalSanctionedHits,
                mixerExposuresFound: totalMixerHits,
                caseSeverity:
                    totalSanctionedHits > 0
                        ? "CRITICAL_SANCTIONED"
                        : maxRiskScore >= 70
                        ? "HIGH_RISK"
                        : maxRiskScore >= 40
                        ? "ELEVATED_RISK"
                        : "LOW_RISK",
            },
            wallets: liveWalletAudits,
            dossierFetchedAt: new Date().toISOString(),
            dataSource: "Fresh Live Multi-Feed Fetch (Mempool.space + OFAC SDN + CoinGecko)",
        };
    }

    /**
     * Add target address to case
     */
    async addAddressToCase(caseId, userId, { address, customLabel, analystNotes }) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required.");
        }

        const targetCase = await this.getCaseById(caseId, userId);
        const cleanAddr = address.trim();

        // Check if address already exists
        const exists = targetCase.addresses.some((a) => a.address.toLowerCase() === cleanAddr.toLowerCase());
        if (exists) {
            throw new Error("Address is already associated with this case.");
        }

        targetCase.addresses.push({
            address: cleanAddr,
            customLabel: customLabel || "Target Wallet",
            analystNotes: analystNotes || "",
            addedAt: new Date(),
        });

        targetCase.timelineNotes.push({
            author: "Analyst",
            content: `Added target address ${cleanAddr.slice(0, 10)}... (${customLabel || "Wallet"}) to case dossier.`,
            category: "EVIDENCE",
            createdAt: new Date(),
        });

        await targetCase.save();
        return targetCase;
    }

    /**
     * Remove address from case
     */
    async removeAddressFromCase(caseId, userId, address) {
        const targetCase = await this.getCaseById(caseId, userId);
        const cleanAddr = address.trim().toLowerCase();

        targetCase.addresses = targetCase.addresses.filter((a) => a.address.toLowerCase() !== cleanAddr);

        targetCase.timelineNotes.push({
            author: "Analyst",
            content: `Removed address ${address.slice(0, 10)}... from case dossier.`,
            category: "COMPLIANCE_ACTION",
            createdAt: new Date(),
        });

        await targetCase.save();
        return targetCase;
    }

    /**
     * Add analyst note to case timeline
     */
    async addTimelineNote(caseId, userId, { content, category, author }) {
        if (!content || typeof content !== "string") {
            throw new Error("Note content is required.");
        }

        const targetCase = await this.getCaseById(caseId, userId);

        targetCase.timelineNotes.unshift({
            author: author || "Analyst",
            content: content.trim(),
            category: category || "FINDING",
            createdAt: new Date(),
        });

        await targetCase.save();
        return targetCase;
    }

    /**
     * Update case metadata
     */
    async updateCase(caseId, userId, updates) {
        const targetCase = await this.getCaseById(caseId, userId);

        if (updates.title) targetCase.title = updates.title.trim();
        if (updates.description !== undefined) targetCase.description = updates.description.trim();
        if (updates.status) targetCase.status = updates.status;
        if (updates.priority) targetCase.priority = updates.priority;
        if (Array.isArray(updates.caseTags)) targetCase.caseTags = updates.caseTags;

        await targetCase.save();
        return targetCase;
    }

    /**
     * Delete case
     */
    async deleteCase(caseId, userId) {
        const res = await InvestigationCase.deleteOne({ _id: caseId, userId });
        if (res.deletedCount === 0) {
            throw new Error("Case not found or unauthorized.");
        }
        return { success: true, message: "Investigation case deleted successfully." };
    }
}

module.exports = new CaseService();
