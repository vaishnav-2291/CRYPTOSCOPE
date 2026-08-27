/**
 * CryptoScope AI — Address Reuse Privacy Detector
 * 
 * Analyzes live transaction histories to detect Address Reuse — a well-documented
 * on-chain privacy anti-pattern that compromises anonymity and facilitates cluster tracking.
 * 
 * Live Sources:
 * - Primary: https://mempool.space/api/address/:address
 * - Fallback: https://blockstream.info/api/address/:address
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";

class AddressReuseDetector {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 10000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-AddressReuse/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 10000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-AddressReuse/2.0",
            },
        });
    }

    async fetchAddressData(address) {
        try {
            const res = await this.client.get(`/address/${address}`);
            return res.data || {};
        } catch {
            const fb = await this.fallbackClient.get(`/address/${address}`);
            return fb.data || {};
        }
    }

    async fetchAddressTxs(address) {
        try {
            const res = await this.client.get(`/address/${address}/txs`);
            return Array.isArray(res.data) ? res.data : [];
        } catch {
            const fb = await this.fallbackClient.get(`/address/${address}/txs`);
            return Array.isArray(fb.data) ? fb.data : [];
        }
    }

    /**
     * Analyze address reuse patterns from live on-chain stats
     * @param {string} address - Target Bitcoin address
     */
    async analyzeAddressReuse(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required for address reuse analysis.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_reuse_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        try {
            const [addrData, txs] = await Promise.all([
                this.fetchAddressData(cleanAddr),
                this.fetchAddressTxs(cleanAddr),
            ]);

            // Compute inbound funding count from confirmed and unconfirmed stats
            const chainFundedTxCount = addrData.chain_stats?.funded_txo_count || 0;
            const mempoolFundedTxCount = addrData.mempool_stats?.funded_txo_count || 0;
            const totalFundedOutputsCount = chainFundedTxCount + mempoolFundedTxCount;

            const chainSpentTxCount = addrData.chain_stats?.spent_txo_count || 0;
            const mempoolSpentTxCount = addrData.mempool_stats?.spent_txo_count || 0;
            const totalSpentOutputsCount = chainSpentTxCount + mempoolSpentTxCount;

            // Count distinct incoming transactions in recent sample
            let distinctInboundTxs = 0;
            let distinctOutboundTxs = 0;

            txs.forEach((tx) => {
                const isIncoming = (tx.vout || []).some((out) => out.scriptpubkey_address === cleanAddr);
                const isOutgoing = (tx.vin || []).some((inp) => inp.prevout?.scriptpubkey_address === cleanAddr);
                if (isIncoming) distinctInboundTxs++;
                if (isOutgoing) distinctOutboundTxs++;
            });

            // Calculate Privacy Score (100 = optimal privacy, 0 = severe chronic reuse)
            let privacyGrade = "A";
            let privacyScore = 100;
            let reuseSeverity = "NONE";
            let assessment = "Optimal Bitcoin privacy hygiene: Single-use address pattern observed.";

            if (totalFundedOutputsCount > 20 || distinctInboundTxs > 15) {
                privacyGrade = "F";
                privacyScore = 20;
                reuseSeverity = "CHRONIC_REUSE";
                assessment = `SEVERE PRIVACY DEFICIT: Address has received ${totalFundedOutputsCount} separate funding outputs across multiple transactions. Chronic address reuse makes blockchain graph analysis and balance tracking trivially simple.`;
            } else if (totalFundedOutputsCount > 5 || distinctInboundTxs > 4) {
                privacyGrade = "D";
                privacyScore = 45;
                reuseSeverity = "FREQUENT_REUSE";
                assessment = `POOR PRIVACY PRACTICE: Multiple incoming deposits (${totalFundedOutputsCount} funded outputs) detected on the exact same address. Facilitates common-input and temporal clustering.`;
            } else if (totalFundedOutputsCount > 1 || distinctInboundTxs > 1) {
                privacyGrade = "C";
                privacyScore = 70;
                reuseSeverity = "MODERATE_REUSE";
                assessment = `MODERATE REUSE: Address has received ${totalFundedOutputsCount} separate deposits. Single-use addresses (BIP 32 HD Wallets) are recommended for enhanced privacy.`;
            }

            const result = {
                address: cleanAddr,
                privacyGrade,
                privacyScore,
                reuseSeverity,
                metrics: {
                    totalFundedOutputsCount,
                    totalSpentOutputsCount,
                    recentInboundTransactionsSampled: distinctInboundTxs,
                    recentOutboundTransactionsSampled: distinctOutboundTxs,
                    totalTxCount: (addrData.chain_stats?.tx_count || 0) + (addrData.mempool_stats?.tx_count || 0),
                },
                assessment,
                bestPracticeRecommendation: totalFundedOutputsCount > 1
                    ? "Generate a fresh receiving address for every incoming transaction using a BIP 32 Hierarchical Deterministic (HD) wallet to prevent third-party linkability."
                    : "Maintain standard single-use address hygiene for future transactions.",
                dataSource: "Mempool.space Live On-Chain Address Telemetry",
                analyzedAt: new Date().toISOString(),
            };

            cacheService.set(cacheKey, result, 120);
            return result;
        } catch (err) {
            console.warn("[AddressReuseDetector] Error analyzing reuse:", err.message);
            throw new Error(`Failed to analyze address reuse: ${err.message}`);
        }
    }
}

module.exports = new AddressReuseDetector();
