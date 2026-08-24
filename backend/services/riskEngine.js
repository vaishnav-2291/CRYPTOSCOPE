/**
 * CryptoScope AI — Deterministic Explainable Risk Engine (v2.0)
 * 
 * NOTE: This is a 100% deterministic, rule-based heuristic scoring engine
 * evaluating 5 structured analytical dimensions across Bitcoin UTXO data.
 * All decisions and score breakdowns are transparent and explainable.
 */

/**
 * Calculate multi-dimensional risk score and generate explainable rule breakdown
 * @param {Object} data - Wallet data from blockchain provider
 * @returns {Object} Risk evaluation result
 */
function calculateRisk(data) {
    if (!data) {
        throw new Error("Wallet data payload is required for risk calculation.");
    }

    const address = data.address || "";
    const balance = Number(data.balance) || 0;
    const total_received = Number(data.total_received ?? data.totalReceived) || 0;
    const total_sent = Number(data.total_sent ?? data.totalSent) || 0;
    const n_tx = Number(data.n_tx ?? data.transactions?.length) || 0;
    const entityTag = data.entityTag || null;
    const clustering = data.clustering || null;
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];

    const breakdown = {
        transactionRisk: 0, // Max 25
        balanceRisk: 0,     // Max 20
        patternRisk: 0,     // Max 25
        activityRisk: 0,    // Max 15
        entityRisk: 0,      // Max 35
    };

    const ruleTriggers = [];

    // =========================================================================
    // 1. TRANSACTION RISK DIMENSION (Max 25 pts)
    // =========================================================================
    if (n_tx > 10000) {
        breakdown.transactionRisk += 25;
        ruleTriggers.push({
            id: "RULE-TX-01",
            dimension: "Transaction Risk",
            severity: "HIGH",
            title: "Extreme Transaction Velocity",
            description: `Address has recorded ${n_tx.toLocaleString()} transactions, characteristic of high-throughput automated services, exchanges, or bot operators.`,
            metric: `Total TXs: ${n_tx.toLocaleString()} (Threshold: >10,000)`,
            points: 25,
            recommendation: "Verify against known commercial exchange and aggregator address clusters.",
        });
    } else if (n_tx > 2500) {
        breakdown.transactionRisk += 18;
        ruleTriggers.push({
            id: "RULE-TX-02",
            dimension: "Transaction Risk",
            severity: "MEDIUM",
            title: "High Transaction Volume",
            description: `High transaction count of ${n_tx.toLocaleString()} indicates significant ongoing blockchain throughput.`,
            metric: `Total TXs: ${n_tx.toLocaleString()} (Threshold: >2,500)`,
            points: 18,
            recommendation: "Monitor for sudden spikes in hourly transfer frequency.",
        });
    } else if (n_tx > 500) {
        breakdown.transactionRisk += 12;
        ruleTriggers.push({
            id: "RULE-TX-03",
            dimension: "Transaction Risk",
            severity: "LOW",
            title: "Moderate Transaction History",
            description: `Address has ${n_tx.toLocaleString()} confirmed transactions, indicating active regular wallet operations.`,
            metric: `Total TXs: ${n_tx.toLocaleString()}`,
            points: 12,
            recommendation: "Standard periodic audit recommended.",
        });
    } else if (n_tx > 50) {
        breakdown.transactionRisk += 6;
    } else {
        breakdown.transactionRisk += 2;
    }

    // Check for high-fee transfers in recent transactions
    const highFeeTxs = transactions.filter((tx) => tx.feeBTC > 0.005);
    if (highFeeTxs.length >= 2) {
        breakdown.transactionRisk = Math.min(25, breakdown.transactionRisk + 5);
        ruleTriggers.push({
            id: "RULE-TX-04",
            dimension: "Transaction Risk",
            severity: "MEDIUM",
            title: "Priority / High-Fee Transfer Pattern",
            description: `${highFeeTxs.length} recent transactions used expedited high network fees (>0.005 BTC), suggesting urgent capital reallocation.`,
            metric: `High Fee Txs: ${highFeeTxs.length}`,
            points: 5,
            recommendation: "Inspect transaction timing and urgency triggers.",
        });
    }

    breakdown.transactionRisk = Math.min(25, breakdown.transactionRisk);

    // =========================================================================
    // 2. BALANCE RISK DIMENSION (Max 20 pts)
    // =========================================================================
    if (balance > 1000) {
        breakdown.balanceRisk += 20;
        ruleTriggers.push({
            id: "RULE-BAL-01",
            dimension: "Balance Risk",
            severity: "HIGH",
            title: "Mega-Whale Reserve Balance",
            description: `Wallet currently holds ${balance.toFixed(2)} BTC (>1,000 BTC). High-value target representing significant systemic exposure.`,
            metric: `Balance: ${balance.toFixed(4)} BTC`,
            points: 20,
            recommendation: "Flag for institutional multi-signature custody audit.",
        });
    } else if (balance > 100) {
        breakdown.balanceRisk += 15;
        ruleTriggers.push({
            id: "RULE-BAL-02",
            dimension: "Balance Risk",
            severity: "MEDIUM",
            title: "High-Value Whale Balance",
            description: `Wallet balance of ${balance.toFixed(2)} BTC represents major capital concentration.`,
            metric: `Balance: ${balance.toFixed(4)} BTC`,
            points: 15,
            recommendation: "Track outbound liquidity movements exceeding 10 BTC.",
        });
    } else if (balance > 10) {
        breakdown.balanceRisk += 8;
        ruleTriggers.push({
            id: "RULE-BAL-03",
            dimension: "Balance Risk",
            severity: "LOW",
            title: "Substantial Balance",
            description: `Wallet holds ${balance.toFixed(4)} BTC.`,
            metric: `Balance: ${balance.toFixed(4)} BTC`,
            points: 8,
            recommendation: "Standard risk threshold applied.",
        });
    } else {
        breakdown.balanceRisk += 2;
    }

    // Complete Drain / Liquidation Detection
    if (total_received > 5 && balance < 0.0001 && total_sent > 0.95 * total_received) {
        breakdown.balanceRisk = Math.min(20, breakdown.balanceRisk + 6);
        ruleTriggers.push({
            id: "RULE-BAL-04",
            dimension: "Balance Risk",
            severity: "MEDIUM",
            title: "Complete Fund Liquidation / Sweep",
            description: `Address received ${total_received.toFixed(2)} BTC historically but has been swept to near-zero (${balance.toFixed(6)} BTC remaining).`,
            metric: `Drain Ratio: ${((total_sent / total_received) * 100).toFixed(1)}% swept`,
            points: 6,
            recommendation: "Check if sweep destination is an exchange deposit or mixer.",
        });
    }

    breakdown.balanceRisk = Math.min(20, breakdown.balanceRisk);

    // =========================================================================
    // 3. PATTERN RISK DIMENSION (Max 25 pts)
    // =========================================================================
    // Pass-through transit wallet pattern (funds received are immediately forwarded out)
    if (total_received > 2 && total_sent > 0 && Math.abs(total_received - total_sent) < total_received * 0.08) {
        breakdown.patternRisk += 20;
        ruleTriggers.push({
            id: "RULE-PAT-01",
            dimension: "Pattern Risk",
            severity: "HIGH",
            title: "High Churn Transit / Pass-Through Pattern",
            description: "Wallet exhibits a near 1:1 in/out ratio (92%+ turnover). Common indicator of intermediary laundering hops, payment aggregators, or mixer relays.",
            metric: `Total Received: ${total_received.toFixed(4)} BTC vs Sent: ${total_sent.toFixed(4)} BTC`,
            points: 20,
            recommendation: "Trace downstream destination hops for peeling chains.",
        });
    } else if (total_received > total_sent * 3 && total_received > 5) {
        breakdown.patternRisk += 14;
        ruleTriggers.push({
            id: "RULE-PAT-02",
            dimension: "Pattern Risk",
            severity: "MEDIUM",
            title: "Funnel / Cold Accumulation Pattern",
            description: "Total received funds outpace sent funds significantly, indicating steady asset accumulation or collection hub behavior.",
            metric: `Received/Sent Ratio: ${total_sent > 0 ? (total_received / total_sent).toFixed(1) + "x" : "Pure Inflow"}`,
            points: 14,
            recommendation: "Evaluate inflow source diversity.",
        });
    } else {
        breakdown.patternRisk += 4;
    }

    // Directional velocity check across recent transactions
    const outgoingTxs = transactions.filter((t) => t.direction === "OUTGOING").length;
    const incomingTxs = transactions.filter((t) => t.direction === "INCOMING").length;

    if (transactions.length >= 10 && (outgoingTxs >= transactions.length * 0.9 || incomingTxs >= transactions.length * 0.9)) {
        breakdown.patternRisk = Math.min(25, breakdown.patternRisk + 5);
        ruleTriggers.push({
            id: "RULE-PAT-03",
            dimension: "Pattern Risk",
            severity: "LOW",
            title: "Unidirectional Flow Imbalance",
            description: `Recent transactions are overwhelmingly ${outgoingTxs > incomingTxs ? "outbound dispatches" : "inbound consolidations"}.`,
            metric: `Direction Split: ${incomingTxs} In / ${outgoingTxs} Out`,
            points: 5,
            recommendation: "Inspect counterparty diversity.",
        });
    }

    breakdown.patternRisk = Math.min(25, breakdown.patternRisk);

    // =========================================================================
    // 4. ACTIVITY & TEMPORAL RISK DIMENSION (Max 15 pts)
    // =========================================================================
    if (n_tx < 3 && total_received > 1) {
        breakdown.activityRisk += 12;
        ruleTriggers.push({
            id: "RULE-ACT-01",
            dimension: "Activity Risk",
            severity: "MEDIUM",
            title: "Low History High-Value Activity",
            description: `Address has only ${n_tx} total transaction(s) but has transferred ${total_received.toFixed(2)} BTC. Fresh address with high initial capital.`,
            metric: `TX Count: ${n_tx}, Volume: ${total_received.toFixed(4)} BTC`,
            points: 12,
            recommendation: "Perform enhanced provenance checks on funding UTXOs.",
        });
    } else if (n_tx < 10) {
        breakdown.activityRisk += 5;
    } else {
        breakdown.activityRisk += 2;
    }

    // Multi-Input Clustering Complexity
    if (clustering && clustering.clusterSize > 3) {
        breakdown.activityRisk = Math.min(15, breakdown.activityRisk + 4);
        ruleTriggers.push({
            id: "RULE-ACT-02",
            dimension: "Activity Risk",
            severity: "INFO",
            title: "Common-Input Co-Spending Cluster Detected",
            description: `Heuristic clustering linked this wallet with ${clustering.clusterSize - 1} co-signed sibling address(es) via multi-input transactions.`,
            metric: `Cluster Entity Size: ${clustering.clusterSize} addresses`,
            points: 4,
            recommendation: "Include clustered addresses in scope of entity risk profile.",
        });
    }

    breakdown.activityRisk = Math.min(15, breakdown.activityRisk);

    // =========================================================================
    // 5. ENTITY & SANCTIONS RISK DIMENSION (Max 35 pts)
    // =========================================================================
    if (entityTag) {
        if (entityTag.isSanctioned) {
            breakdown.entityRisk += 35;
            ruleTriggers.push({
                id: "RULE-ENT-01",
                dimension: "Entity & Sanctions Risk",
                severity: "CRITICAL",
                title: `Sanctioned Entity Match: ${entityTag.name}`,
                description: `Address is directly identified as ${entityTag.name} (${entityTag.category}). ${entityTag.description}`,
                metric: `Sanctions Tag: ${entityTag.category}`,
                points: 35,
                recommendation: "CRITICAL: Immediate freeze and regulatory compliance notification required.",
            });
        } else if (entityTag.isMixer) {
            breakdown.entityRisk += 25;
            ruleTriggers.push({
                id: "RULE-ENT-02",
                dimension: "Entity & Sanctions Risk",
                severity: "CRITICAL",
                title: `Privacy Mixer / Tumbler Tag: ${entityTag.name}`,
                description: `Direct match with privacy protocol / CoinJoin coordinator ${entityTag.name}. Mixers obfuscate origin and break deterministic provenance.`,
                metric: `Entity: ${entityTag.name}`,
                points: 25,
                recommendation: "High-risk AML flag. Perform second-order taint analysis.",
            });
        } else if (entityTag.riskWeight > 50) {
            breakdown.entityRisk += 18;
            ruleTriggers.push({
                id: "RULE-ENT-03",
                dimension: "Entity & Sanctions Risk",
                severity: "HIGH",
                title: `Elevated Entity Association: ${entityTag.name}`,
                description: entityTag.description,
                metric: `Category: ${entityTag.category}`,
                points: 18,
                recommendation: "Verify counterparty compliance documentation.",
            });
        } else {
            breakdown.entityRisk += 2;
            ruleTriggers.push({
                id: "RULE-ENT-04",
                dimension: "Entity & Sanctions Risk",
                severity: "INFO",
                title: `Verified Entity: ${entityTag.name}`,
                description: `Identified as legitimate institutional entity: ${entityTag.name} (${entityTag.category}).`,
                metric: `Category: ${entityTag.category}`,
                points: 2,
                recommendation: "Recognized infrastructure address.",
            });
        }
    } else {
        // Check if any transaction inputs/outputs interact with known mixer
        const hasMixerInteraction = transactions.some((tx) =>
            tx.inputs.some((i) => i.entityTag?.isMixer) || tx.outputs.some((o) => o.entityTag?.isMixer)
        );

        if (hasMixerInteraction) {
            breakdown.entityRisk += 20;
            ruleTriggers.push({
                id: "RULE-ENT-05",
                dimension: "Entity & Sanctions Risk",
                severity: "HIGH",
                title: "Direct Mixer Counterparty Exposure",
                description: "Recent transaction history reveals direct inbound or outbound transfer with a known CoinJoin/mixer pool.",
                metric: "Mixer Proximity: 1 Hop",
                points: 20,
                recommendation: "Flag for source-of-funds verification.",
            });
        } else {
            breakdown.entityRisk += 1;
        }
    }

    breakdown.entityRisk = Math.min(35, breakdown.entityRisk);

    // =========================================================================
    // TOTAL SCORE CALCULATION & LEVEL CLASSIFICATION
    // =========================================================================
    let rawScore =
        breakdown.transactionRisk +
        breakdown.balanceRisk +
        breakdown.patternRisk +
        breakdown.activityRisk +
        breakdown.entityRisk;

    // Cap between 0 and 100
    const riskScore = Math.max(0, Math.min(100, rawScore));

    let riskLevel = "Low";
    if (riskScore >= 70 || (entityTag && entityTag.isSanctioned)) {
        riskLevel = "High";
    } else if (riskScore >= 40) {
        riskLevel = "Medium";
    }

    // =========================================================================
    // EXPLAINABLE SECURITY ASSESSMENT REPORT (Deterministic plain English)
    // =========================================================================
    let securityReport = "";
    const activeCriticalRules = ruleTriggers.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH");

    if (riskLevel === "High") {
        securityReport = `⚠️ HIGH RISK ASSESSMENT (Score: ${riskScore}/100) — Critical risk factors detected across ${
            ruleTriggers.length
        } triggered heuristic rules. Primary vectors: ${
            activeCriticalRules.map((r) => r.title).join(", ") || "Abnormal velocity and fund pass-through behavior"
        }. The address warrants immediate risk mitigation and continuous monitoring.`;
    } else if (riskLevel === "Medium") {
        securityReport = `🟡 MEDIUM RISK ASSESSMENT (Score: ${riskScore}/100) — Noticeable behavioral patterns observed across ${
            ruleTriggers.length
        } active heuristic rules. Primary indicators include ${
            ruleTriggers.slice(0, 2).map((r) => r.title).join(" and ") || "moderate volume and transaction frequency"
        }. Regular monitoring is advised.`;
    } else {
        securityReport = `🟢 LOW RISK ASSESSMENT (Score: ${riskScore}/100) — Wallet demonstrates standard on-chain behavioral characteristics with no direct mixer association, sanctions exposure, or abnormal churn velocity across evaluated dimensions.`;
    }

    return {
        riskScore,
        riskLevel,
        security: riskLevel,
        breakdown,
        scoreBreakdown: breakdown,
        ruleTriggers,
        aiReport: securityReport,
        securityAssessment: securityReport,
        riskFactors: ruleTriggers.map((r) => `${r.title}: ${r.description}`),
        methodology: "Deterministic 5-Axis Heuristic Rule Engine (Explainable Framework)",
    };
}

module.exports = {
    calculateRisk,
};