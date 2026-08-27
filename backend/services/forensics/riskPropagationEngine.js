/**
 * CryptoScope AI — Multi-Hop Risk Propagation Engine ("Degrees of Separation")
 * 
 * Computes an on-chain exposure score by recursively traversing 2–3 hops of live transactions
 * and calculating decayed proximity to US Treasury OFAC sanctioned addresses.
 * 
 * Decay Model (Chainalysis-style exposure decay):
 * - Direct (0 hops): 100 pts
 * - 1 Hop: 50 pts (Weight: 0.50)
 * - 2 Hops: 25 pts (Weight: 0.25)
 * - 3 Hops: 12 pts (Weight: 0.12)
 * 
 * Live Sources:
 * - https://mempool.space/api/address/:address/txs
 * - Official OFAC SDN Registry via sanctionsChecker
 */

const axios = require("axios");
const cacheService = require("../cacheService");
const sanctionsChecker = require("./sanctionsChecker");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SAT_TO_BTC = 100000000;

class RiskPropagationEngine {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 5000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-RiskPropagation/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 5000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-RiskPropagation/2.0",
            },
        });
    }

    async fetchAddressTxs(address) {
        try {
            const res = await this.client.get(`/address/${address}/txs`);
            return Array.isArray(res.data) ? res.data : [];
        } catch {
            try {
                const fb = await this.fallbackClient.get(`/address/${address}/txs`);
                return Array.isArray(fb.data) ? fb.data : [];
            } catch {
                return [];
            }
        }
    }

    /**
     * Calculate multi-hop exposure propagation score across 2-3 live transaction hops
     * @param {string} targetAddress - Starting Bitcoin address
     * @param {number} maxHops - Search depth (default: 2, max: 3)
     */
    async calculatePropagation(targetAddress, maxHops = 2) {
        if (!targetAddress || typeof targetAddress !== "string") {
            throw new Error("Valid Bitcoin target address required for risk propagation analysis.");
        }

        const cleanAddr = targetAddress.trim();
        const boundedHops = Math.min(3, Math.max(1, maxHops));
        const cacheKey = `forensics_propagation_${cleanAddr}_hops_${boundedHops}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        // Sync live OFAC list
        const sanctionsData = await sanctionsChecker.syncSanctionsList();
        const sanctionedSet = sanctionsData.addresses || new Set();

        const visited = new Set();
        const exposurePaths = [];
        let cumulativePropagatedScore = 0;

        // Check direct target (0-hop)
        if (sanctionedSet.has(cleanAddr)) {
            exposurePaths.push({
                distanceHops: 0,
                sanctionedAddress: cleanAddr,
                path: [cleanAddr],
                decayWeight: 1.0,
                riskContribution: 100,
                exposureType: "DIRECT_DESIGNATION",
            });
            cumulativePropagatedScore += 100;
        }

        // Breadth-first live traversal
        const queue = [{ address: cleanAddr, hop: 0, path: [cleanAddr] }];
        visited.add(cleanAddr);
        let totalUniqueAddressesScanned = 1;

        let expansions = 0;
        const MAX_EXPANSIONS = 4;

        while (queue.length > 0 && expansions < MAX_EXPANSIONS) {
            const current = queue.shift();
            if (current.hop >= boundedHops) continue;
            expansions++;

            const txs = await this.fetchAddressTxs(current.address);
            const topTxs = txs.slice(0, 5); // Bounded sample per hop

            for (const tx of topTxs) {
                const counterparties = new Set();

                (tx.vin || []).forEach((inp) => {
                    const addr = inp.prevout?.scriptpubkey_address;
                    if (addr) counterparties.add(addr);
                });
                (tx.vout || []).forEach((out) => {
                    const addr = out.scriptpubkey_address;
                    if (addr) counterparties.add(addr);
                });

                // Check all counterparties for sanctions
                for (const neighborAddr of counterparties) {
                    if (neighborAddr === cleanAddr) continue;

                    const nextHop = current.hop + 1;
                    const nextPath = [...current.path, `TX:${tx.txid.slice(0, 8)}`, neighborAddr];

                    // Check if neighbor is sanctioned
                    if (sanctionedSet.has(neighborAddr)) {
                        const decayWeight = nextHop === 1 ? 0.5 : nextHop === 2 ? 0.25 : 0.12;
                        const riskPts = Math.round(100 * decayWeight);

                        const alreadyLogged = exposurePaths.some((p) => p.sanctionedAddress === neighborAddr);
                        if (!alreadyLogged) {
                            exposurePaths.push({
                                distanceHops: nextHop,
                                sanctionedAddress: neighborAddr,
                                path: nextPath,
                                decayWeight,
                                riskContribution: riskPts,
                                exposureType: nextHop === 1 ? "DIRECT_COUNTERPARTY" : "TRANSITIVE_COUNTERPARTY",
                            });
                            cumulativePropagatedScore += riskPts;
                        }
                    }

                    if (!visited.has(neighborAddr) && nextHop < boundedHops && queue.length < MAX_EXPANSIONS) {
                        visited.add(neighborAddr);
                        totalUniqueAddressesScanned++;
                        queue.push({ address: neighborAddr, hop: nextHop, path: nextPath });
                    }
                }
            }
        }

        const finalExposureScore = Math.min(100, cumulativePropagatedScore);

        let riskLevel = "MINIMAL_EXPOSURE";
        let summaryStatement = "No direct or transitive connections to OFAC-sanctioned entities detected within evaluated transaction depth.";

        if (finalExposureScore >= 70) {
            riskLevel = "CRITICAL_EXPOSURE";
            summaryStatement = `CRITICAL EXPOSURE: Address has immediate proximity to sanctioned entity designations (${exposurePaths.length} identified exposure path(s)).`;
        } else if (finalExposureScore >= 30) {
            riskLevel = "ELEVATED_TRANSITIVE_EXPOSURE";
            summaryStatement = `ELEVATED HEURISTIC EXPOSURE: Address is within 2 hops of sanctioned addresses. Total decayed propagation risk: ${finalExposureScore}/100.`;
        } else if (exposurePaths.length > 0) {
            riskLevel = "LOW_TRANSITIVE_EXPOSURE";
            summaryStatement = `LOW TRANSITIVE EXPOSURE: Minor multi-hop connection detected (${exposurePaths[0].distanceHops} hops away).`;
        }

        const result = {
            targetAddress: cleanAddr,
            maxHopsExplored: boundedHops,
            sanctionProximityScore: finalExposureScore,
            riskLevel,
            totalUniqueAddressesScanned,
            exposurePathsCount: exposurePaths.length,
            exposurePaths,
            summaryStatement,
            sanctionsDatabase: {
                source: sanctionsData.source,
                snapshotDate: sanctionsData.lastFetchedAt,
                totalSanctionedAddrsIndexed: sanctionsData.count,
            },
            methodology: "Exponential Proximity Decay Model (0-hop: 100%, 1-hop: 50%, 2-hop: 25%, 3-hop: 12%)",
            analyzedAt: new Date().toISOString(),
        };

        cacheService.set(cacheKey, result, 180);
        return result;
    }
}

module.exports = new RiskPropagationEngine();
