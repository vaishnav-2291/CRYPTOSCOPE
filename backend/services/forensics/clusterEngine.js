/**
 * CryptoScope AI — Address Clustering Engine (Common-Input-Ownership Heuristic)
 * 
 * Implements the foundational blockchain forensics heuristic:
 * In any multi-input transaction (vin >= 2), all input addresses are inferred
 * to be controlled by the same private keyholder/entity.
 * 
 * Live Source:
 * - https://mempool.space/api/address/:address/txs
 */

const axios = require("axios");
const cacheService = require("../cacheService");
const { lookupEntity } = require("../entityService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SAT_TO_BTC = 100000000;

class ClusterEngine {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 7000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-Clustering/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 7000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-Clustering/2.0",
            },
        });
    }

    async fetchTxs(address) {
        const cleanAddr = address.trim();
        try {
            const res = await this.client.get(`/address/${cleanAddr}/txs`);
            return Array.isArray(res.data) ? res.data : [];
        } catch (err) {
            try {
                const res = await this.fallbackClient.get(`/address/${cleanAddr}/txs`);
                return Array.isArray(res.data) ? res.data : [];
            } catch (fbErr) {
                console.warn(`[ClusterEngine] Failed to fetch txs for ${cleanAddr}:`, fbErr.message);
                return [];
            }
        }
    }

    /**
     * Check if a transaction is a CoinJoin / Whirlpool collaborative mix
     * CoinJoin fingerprint: many inputs and many equal-denomination outputs (e.g. Wasabi 0.1 BTC or Whirlpool 0.05 BTC)
     */
    isCoinJoinTx(tx) {
        const outputs = tx.vout || [];
        const inputs = tx.vin || [];

        if (outputs.length < 5 || inputs.length < 5) return false;

        // Check if there are >= 5 outputs with the exact same satoshi value
        const valCounts = {};
        for (const out of outputs) {
            valCounts[out.value] = (valCounts[out.value] || 0) + 1;
            if (valCounts[out.value] >= 5) return true;
        }

        return false;
    }

    /**
     * Extract co-spending cluster for a Bitcoin address using Common-Input Heuristic
     * @param {string} targetAddress - Address to cluster
     */
    async extractCluster(targetAddress) {
        if (!targetAddress || typeof targetAddress !== "string") {
            throw new Error("Valid Bitcoin address is required for clustering analysis.");
        }

        const cleanTarget = targetAddress.trim();
        const cacheKey = `forensics_cluster_${cleanTarget}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const txs = await this.fetchTxs(cleanTarget);
        const clusteredMap = new Map();
        let totalCoSpentSat = 0;
        let multiInputTxsAnalyzed = 0;
        let coinJoinTxsFiltered = 0;

        for (const tx of txs) {
            const inputs = tx.vin || [];
            if (inputs.length < 2) continue; // Single input tx cannot establish co-ownership

            // Filter out CoinJoin transactions to avoid cluster poisoning
            if (this.isCoinJoinTx(tx)) {
                coinJoinTxsFiltered++;
                continue;
            }

            // Check if target address is one of the inputs
            const targetIsInput = inputs.some(
                (inp) => inp.prevout?.scriptpubkey_address === cleanTarget
            );

            if (targetIsInput) {
                multiInputTxsAnalyzed++;

                for (const inp of inputs) {
                    const siblingAddr = inp.prevout?.scriptpubkey_address;
                    if (!siblingAddr || siblingAddr === cleanTarget) continue;

                    const satVal = inp.prevout?.value || 0;
                    totalCoSpentSat += satVal;

                    if (!clusteredMap.has(siblingAddr)) {
                        const entity = lookupEntity(siblingAddr);
                        clusteredMap.set(siblingAddr, {
                            address: siblingAddr,
                            entityTag: entity,
                            firstCoSpentTxid: tx.txid,
                            firstCoSpentTime: tx.status?.block_time
                                ? new Date(tx.status.block_time * 1000).toISOString()
                                : "Unconfirmed",
                            coSpentTxsCount: 1,
                            totalCoSpentSat: satVal,
                            totalCoSpentBtc: satVal / SAT_TO_BTC,
                            heuristicConfidence: "HIGH_CONFIDENCE_CO_SIGNER",
                        });
                    } else {
                        const existing = clusteredMap.get(siblingAddr);
                        existing.coSpentTxsCount++;
                        existing.totalCoSpentSat += satVal;
                        existing.totalCoSpentBtc = existing.totalCoSpentSat / SAT_TO_BTC;
                    }
                }
            }
        }

        const clusteredAddresses = Array.from(clusteredMap.values()).sort(
            (a, b) => b.totalCoSpentSat - a.totalCoSpentSat
        );

        const targetEntity = lookupEntity(cleanTarget);

        const result = {
            targetAddress: cleanTarget,
            targetEntity,
            clusterSize: clusteredAddresses.length + 1, // Sibling addresses + Target itself
            totalCoSpentSatoshis: totalCoSpentSat,
            totalCoSpentBtc: totalCoSpentSat / SAT_TO_BTC,
            metrics: {
                multiInputTxsAnalyzed,
                coinJoinTxsFiltered,
                siblingAddressesCount: clusteredAddresses.length,
                heuristicMethod: "Common-Input-Ownership (Multi-Input Co-Spending)",
            },
            clusteredAddresses: clusteredAddresses.slice(0, 30),
            forensicAssessment: clusteredAddresses.length > 0
                ? `HEURISTIC CLUSTERING: Identified ${clusteredAddresses.length} distinct address(es) co-spending inputs in ${multiInputTxsAnalyzed} multi-input transactions with this wallet. Standard chain analysis considers these addresses part of the same entity wallet cluster.`
                : "No multi-input co-spending siblings detected in recent transactions. Address appears to spend from isolated single-input UTXOs.",
            dataSource: "Mempool.space Live On-Chain Analysis",
            analyzedAt: new Date().toISOString(),
        };

        // Cache for 300 seconds
        cacheService.set(cacheKey, result, 300);
        return result;
    }
}

module.exports = new ClusterEngine();
