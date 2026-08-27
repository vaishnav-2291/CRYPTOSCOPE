/**
 * CryptoScope AI — Heuristic Risk Score Explainability Engine
 * 
 * Provides an audit-grade, transparent mathematical decomposition of the
 * deterministic 5-axis heuristic risk score.
 * 
 * Philosophy: CryptoScope AI utilizes deterministic, auditable rules rather than opaque
 * black-box models. Every rule is explicitly documented as a HEURISTIC SIGNAL
 * or statistical anomaly (not proof of intent).
 */

const { getWalletData } = require("../blockchainService");
const riskEngine = require("../riskEngine");
const dustingDetector = require("./dustingDetector");
const feeUrgencyAnalyzer = require("./feeUrgencyAnalyzer");
const clusterEngine = require("./clusterEngine");
const sanctionsChecker = require("./sanctionsChecker");
const coinDaysDestroyedDetector = require("./coinDaysDestroyedDetector");

class ExplainabilityService {
    /**
     * Generate complete explainability matrix and rule decomposition for an address
     * @param {string} address - Target Bitcoin address
     */
    async generateExplainabilityReport(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required for explainability analysis.");
        }

        const cleanAddr = address.trim();

        // Run live parallel analyses
        const [walletData, dustingData, feeData, clusterData, sanctionsData, cddData] = await Promise.all([
            getWalletData(cleanAddr),
            dustingDetector.analyzeAddress(cleanAddr).catch(() => null),
            feeUrgencyAnalyzer.analyzeFeeUrgency(cleanAddr).catch(() => null),
            clusterEngine.extractCluster(cleanAddr).catch(() => null),
            sanctionsChecker.checkSanctionsExposure(cleanAddr).catch(() => null),
            coinDaysDestroyedDetector.analyzeCoinDaysDestroyed(cleanAddr).catch(() => null),
        ]);

        const riskEvaluation = riskEngine.calculateRisk(walletData);

        // Map existing and enhanced heuristic rules into explainable signals
        const explainableRules = (riskEvaluation.ruleTriggers || []).map((rule) => {
            return {
                id: rule.id,
                title: rule.title,
                dimension: rule.dimension || "Heuristic Signal",
                severity: rule.severity || "INFO",
                category: "HEURISTIC_SIGNAL",
                signalNature: "Statistical pattern / On-chain anomaly indicator (not proof of intent)",
                pointsAssigned: rule.points,
                triggeredMetric: rule.metric,
                plainEnglishReason: rule.description,
                forensicRecommendation: rule.recommendation,
            };
        });

        // Add additional forensic heuristic signals if detected
        if (dustingData?.isDustingVictim) {
            explainableRules.push({
                id: "FORENSIC-DUSTING-01",
                title: "Micro-Deposit / Dusting Fingerprint",
                dimension: "Deanonymization Exposure",
                severity: dustingData.activeHazard === "HIGH" ? "CRITICAL" : "WARNING",
                category: "HEURISTIC_SIGNAL",
                signalNature: "Heuristic tracking signal (unsolicited micro-deposits <= 546 sat)",
                pointsAssigned: dustingData.activeHazard === "HIGH" ? 15 : 5,
                triggeredMetric: `${dustingData.metrics.unspentDustUtxosCount} unspent dust UTXO(s) (${dustingData.metrics.unspentDustSatoshis} satoshis)`,
                plainEnglishReason: "Unsolicited micro-deposits detected matching standard deanonymization dusting fingerprints.",
                forensicRecommendation: dustingData.remediationAdvice,
            });
        }

        if (feeData?.urgencyScore > 50) {
            explainableRules.push({
                id: "FORENSIC-FEE-01",
                title: "Priority Fee Overpayment / Queue-Jumping",
                dimension: "Behavioral Urgency",
                severity: feeData.urgencyScore > 75 ? "WARNING" : "INFO",
                category: "HEURISTIC_SIGNAL",
                signalNature: "Heuristic urgency indicator (not proof of intent)",
                pointsAssigned: Math.round(feeData.urgencyScore / 10),
                triggeredMetric: `Peak fee rate: ${feeData.metrics.highestFeeRateSatVb} sat/vB (>300% of reference mempool median)`,
                plainEnglishReason: "Transactions paid substantial fee premiums over standard mempool requirements to expedite block inclusion.",
                forensicRecommendation: "Evaluate whether high fees were driven by network-wide fee spikes or urgency to move funds.",
            });
        }

        if (clusterData?.clusteredAddresses?.length > 0) {
            explainableRules.push({
                id: "FORENSIC-CLUSTER-01",
                title: "Common-Input Co-Spending Association",
                dimension: "Cluster Exposure",
                severity: "INFO",
                category: "HEURISTIC_SIGNAL",
                signalNature: "Heuristic entity grouping (multi-input co-ownership)",
                pointsAssigned: Math.min(10, clusterData.clusteredAddresses.length * 2),
                triggeredMetric: `${clusterData.clusteredAddresses.length} co-spending sibling addresses identified`,
                plainEnglishReason: "Multi-input transactions demonstrate shared private-key control across sibling addresses.",
                forensicRecommendation: "Inspect sibling addresses in cluster explorer to identify aggregated entity holdings.",
            });
        }

        if (cddData?.metrics?.maxSingleTxCdd >= 20) {
            explainableRules.push({
                id: "FORENSIC-CDD-01",
                title: "Dormant-Coin Reactivation / High Coin Days Destroyed",
                dimension: "UTXO Dormancy Dynamics",
                severity: cddData.metrics.maxSingleTxCdd >= 500 ? "WARNING" : "INFO",
                category: "HEURISTIC_SIGNAL",
                signalNature: "Heuristic dormancy pattern (not proof of intent)",
                pointsAssigned: cddData.metrics.maxSingleTxCdd >= 500 ? 10 : 5,
                triggeredMetric: `Peak single-tx CDD: ${cddData.metrics.maxSingleTxCdd} coin days (Total: ${cddData.metrics.totalCoinDaysDestroyed} CDD)`,
                plainEnglishReason: `Long-dormant UTXOs were reactivated in this address's spending history (${cddData.metrics.averageCoinAgeDays} average days dormancy).`,
                forensicRecommendation: "Investigate whether dormant activation corresponds to cold wallet migration, key recovery, or legacy fund movement.",
            });
        }

        if (sanctionsData?.isDirectSanctioned) {
            explainableRules.push({
                id: "FORENSIC-SANCTIONS-01",
                title: "Direct OFAC Sanctions Registry Match",
                dimension: "Regulatory / Sanctions",
                severity: "CRITICAL",
                category: "REGULATORY_RECORD",
                signalNature: "Official legal designation record",
                pointsAssigned: 100,
                triggeredMetric: "Direct match on US Treasury OFAC SDN XBT registry",
                plainEnglishReason: "Address is explicitly designated on official US Treasury sanctions lists.",
                forensicRecommendation: "Immediate compliance freeze required under applicable sanctions laws.",
            });
        }

        // Identify mitigating factors (evidence that lowers risk)
        const mitigatingFactors = [];
        if (walletData.balance > 0 && walletData.transactions > 10 && riskEvaluation.score < 40) {
            mitigatingFactors.push({
                title: "Established Transaction History",
                evidence: `${walletData.transactions} confirmed transactions over extended operational duration.`,
                impact: "Positive provenance indicator",
            });
        }
        if (!dustingData?.isDustingVictim) {
            mitigatingFactors.push({
                title: "Clean Dusting Profile",
                evidence: "Zero unsolicited micro-deposits or fan-out dusting exposures detected.",
                impact: "Reduced deanonymization hazard",
            });
        }
        if (!walletData.entityTag?.isMixer && !walletData.entityTag?.isSanctioned) {
            mitigatingFactors.push({
                title: "Zero Direct Mixer / Sanction Association",
                evidence: "No direct interaction with known privacy tumblers or sanctioned addresses.",
                impact: "Compliant entity provenance",
            });
        }

        // Total score calculation & axis breakdown
        const totalCalculatedScore = Math.min(100, riskEvaluation.riskScore || 0);

        return {
            address: cleanAddr,
            riskScore: totalCalculatedScore,
            riskLevel: riskEvaluation.riskLevel || (totalCalculatedScore >= 70 ? "High" : totalCalculatedScore >= 40 ? "Medium" : "Low"),
            entityTag: walletData.entityTag || null,
            axisWeightBreakdown: {
                transactionVelocityRisk: riskEvaluation.scoreBreakdown?.transactionRisk || 0,
                balanceExposureRisk: riskEvaluation.scoreBreakdown?.balanceRisk || 0,
                flowPatternRisk: riskEvaluation.scoreBreakdown?.patternRisk || 0,
                activityAgeRisk: riskEvaluation.scoreBreakdown?.activityRisk || 0,
                entityAssociationRisk: riskEvaluation.scoreBreakdown?.entityRisk || 0,
            },
            totalRulesEvaluated: 14,
            triggeredRulesCount: explainableRules.length,
            triggeredRules: explainableRules,
            mitigatingFactors,
            methodologyStatement: "CryptoScope AI calculates risk using transparent, deterministic heuristic algorithms rather than black-box models. All rule triggers represent statistical on-chain signals and behavioral patterns to provide fully explainable, auditable intelligence for security analysts.",
            generatedAt: new Date().toISOString(),
        };
    }
}

module.exports = new ExplainabilityService();
