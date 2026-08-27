/**
 * CryptoScope AI — Network Congestion & Fee-Overpay Urgency Analyzer
 * 
 * Correlates live Bitcoin mempool congestion with transaction fee rates to detect
 * anomalous fee overpayment patterns.
 * 
 * Important: Fee overpayment (>300% above median) is treated as a heuristic urgency
 * indicator (not proof of intent), such as capital flight, rapid laundering hops, or
 * urgent queue-jumping.
 * 
 * Live Sources:
 * - https://mempool.space/api/v1/fees/recommended
 * - https://mempool.space/api/mempool
 * - https://mempool.space/api/address/:address/txs
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";

class FeeUrgencyAnalyzer {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-FeeUrgency/2.0",
            },
        });
    }

    /**
     * Fetch live mempool fee recommendations and current congestion stats
     */
    async getMempoolCongestion() {
        const cacheKey = "mempool_live_congestion_stats";
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        try {
            const [feesRes, mempoolRes] = await Promise.all([
                this.client.get("/v1/fees/recommended"),
                this.client.get("/mempool"),
            ]);

            const feeData = feesRes.data || {};
            const mempoolData = mempoolRes.data || {};

            const result = {
                fastestFeeSatVb: feeData.fastestFee || 20,
                halfHourFeeSatVb: feeData.halfHourFee || 15,
                hourFeeSatVb: feeData.hourFee || 10,
                minimumFeeSatVb: feeData.minimumFee || 1,
                unconfirmedTxsCount: mempoolData.count || 0,
                mempoolTotalVsizeMb: mempoolData.vsize ? (mempoolData.vsize / 1000000).toFixed(2) : "0",
                totalFeesBtc: mempoolData.total_fee ? (mempoolData.total_fee / 100000000).toFixed(4) : "0",
                congestionLevel:
                    (mempoolData.count || 0) > 100000 ? "HIGH" : (mempoolData.count || 0) > 30000 ? "MODERATE" : "LOW",
                fetchedAt: new Date().toISOString(),
            };

            cacheService.set(cacheKey, result, 30); // 30s TTL
            return result;
        } catch (err) {
            console.warn("[FeeUrgencyAnalyzer] Failed to fetch live mempool congestion:", err.message);
            return {
                fastestFeeSatVb: null,
                halfHourFeeSatVb: null,
                hourFeeSatVb: null,
                minimumFeeSatVb: null,
                unconfirmedTxsCount: null,
                mempoolTotalVsizeMb: null,
                congestionLevel: "UNAVAILABLE",
                statusMessage: "Live mempool congestion data temporarily unreachable.",
                fetchedAt: new Date().toISOString(),
            };
        }
    }

    /**
     * Analyze address transactions for anomalous fee overpayment / urgency patterns
     * @param {string} address - Target Bitcoin address
     */
    async analyzeFeeUrgency(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address is required for fee urgency analysis.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_fee_urgency_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const [congestion, txsRes] = await Promise.all([
            this.getMempoolCongestion(),
            this.client.get(`/address/${cleanAddr}/txs`).catch(() => ({ data: [] })),
        ]);

        const txs = Array.isArray(txsRes.data) ? txsRes.data : [];

        let totalFeeSat = 0;
        let totalVsize = 0;
        const txFeeStats = [];
        let anomalousOverpayCount = 0;
        let highestFeeRateSatVb = 0;

        const referenceHighPrioritySatVb = congestion.fastestFeeSatVb || 25;

        txs.forEach((tx) => {
            const fee = tx.fee || 0;
            const vsize = tx.vsize || tx.weight ? Math.ceil(tx.weight / 4) : 250;
            const effectiveSatVb = vsize > 0 ? +(fee / vsize).toFixed(1) : 0;

            totalFeeSat += fee;
            totalVsize += vsize;

            if (effectiveSatVb > highestFeeRateSatVb) {
                highestFeeRateSatVb = effectiveSatVb;
            }

            // Heuristic overpay threshold: paying > 3x the high-priority rate
            const isOverpaying = effectiveSatVb > referenceHighPrioritySatVb * 3;
            if (isOverpaying) anomalousOverpayCount++;

            txFeeStats.push({
                txid: tx.txid,
                feeSat: fee,
                feeBtc: fee / 100000000,
                vsize,
                feeRateSatVb: effectiveSatVb,
                isHeuristicUrgencyOverpay: isOverpaying,
                confirmed: Boolean(tx.status?.confirmed),
                timestamp: tx.status?.block_time
                    ? new Date(tx.status.block_time * 1000).toISOString()
                    : "Mempool",
            });
        });

        const averageFeeRateSatVb = totalVsize > 0 ? +(totalFeeSat / totalVsize).toFixed(1) : 0;
        const urgencyScore = Math.min(
            100,
            Math.round(
                (anomalousOverpayCount * 25) +
                (highestFeeRateSatVb > referenceHighPrioritySatVb * 4 ? 30 : 0) +
                (averageFeeRateSatVb > referenceHighPrioritySatVb * 2 ? 20 : 0)
            )
        );

        let urgencyLevel = "NORMAL";
        let forensicFinding = "Heuristic baseline: Transaction fee rates align with standard network mempool dynamics (no anomalous fee overpayment).";

        if (anomalousOverpayCount > 0) {
            urgencyLevel = urgencyScore > 60 ? "HIGH" : "ELEVATED";
            forensicFinding = `HEURISTIC SIGNAL: Detected ${anomalousOverpayCount} transaction(s) paying >300% of reference priority fee rates (peak: ${highestFeeRateSatVb} sat/vB). This represents a heuristic urgency indicator (not proof of intent), often correlating with rapid queue-jumping, automated hot-wallet sweepers, or urgent capital movements.`;
        }

        const result = {
            address: cleanAddr,
            urgencyScore,
            urgencyLevel,
            liveMempoolCongestion: congestion,
            metrics: {
                transactionsEvaluated: txs.length,
                anomalousOverpayTxsCount: anomalousOverpayCount,
                averageFeeRateSatVb,
                highestFeeRateSatVb,
                referencePrioritySatVb: referenceHighPrioritySatVb,
                totalFeesPaidSat: totalFeeSat,
                totalFeesPaidBtc: totalFeeSat / 100000000,
            },
            forensicFinding,
            transactionFeeBreakdown: txFeeStats.slice(0, 15),
            dataSource: "Mempool.space Live Fee Recommendations & Mempool Telemetry",
            analyzedAt: new Date().toISOString(),
        };

        cacheService.set(cacheKey, result, 60);
        return result;
    }
}

module.exports = new FeeUrgencyAnalyzer();
