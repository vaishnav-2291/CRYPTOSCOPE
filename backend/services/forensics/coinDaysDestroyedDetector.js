/**
 * CryptoScope AI — Coin Days Destroyed (CDD) & Dormant-Coin Reactivation Detector
 * 
 * Computes Coin Days Destroyed (CDD = BTC Amount * Days Unspent) for each spent UTXO
 * to detect dormant coin reactivation (e.g., legacy whale wakeups, cold storage sweeps,
 * or compromised old keys).
 * 
 * Philosophy: Labeled as a "heuristic indicator / statistical on-chain dormancy pattern — not proof of intent."
 * 
 * Live Sources:
 * - https://mempool.space/api/address/:address/txs
 * - https://mempool.space/api/address/:address/utxo
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SAT_TO_BTC = 100000000;
const SECONDS_PER_DAY = 86400;

class CoinDaysDestroyedDetector {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-CDD/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-CDD/2.0",
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

    async fetchAddressUtxos(address) {
        try {
            const res = await this.client.get(`/address/${address}/utxo`);
            return Array.isArray(res.data) ? res.data : [];
        } catch {
            try {
                const fb = await this.fallbackClient.get(`/address/${address}/utxo`);
                return Array.isArray(fb.data) ? fb.data : [];
            } catch {
                return [];
            }
        }
    }

    /**
     * Analyze Coin Days Destroyed & Dormant-Coin Movements
     * @param {string} address - Target Bitcoin address
     */
    async analyzeCoinDaysDestroyed(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required for Coin Days Destroyed analysis.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_cdd_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const [txs, utxos] = await Promise.all([
            this.fetchAddressTxs(cleanAddr),
            this.fetchAddressUtxos(cleanAddr),
        ]);

        const lowerAddr = cleanAddr.toLowerCase();
        let totalCoinDaysDestroyed = 0;
        let totalSpentBtc = 0;
        let maxSingleTxCdd = 0;
        let peakCddTxid = null;
        let totalInputAgeDays = 0;
        let spentInputsCount = 0;

        const cddEvents = [];

        // Build a historical reference map of transaction timestamps for funding reference
        const txTimestampMap = new Map();
        txs.forEach((tx) => {
            if (tx.txid && tx.status?.block_time) {
                txTimestampMap.set(tx.txid, tx.status.block_time);
            }
        });

        // Current unspent coins dormancy profile
        const nowSec = Math.floor(Date.now() / 1000);
        let unspentCoinDays = 0;
        let totalUnspentBtc = 0;

        utxos.forEach((u) => {
            const valBtc = (u.value || 0) / SAT_TO_BTC;
            totalUnspentBtc += valBtc;
            const blockTime = u.status?.block_time;
            if (blockTime) {
                const ageDays = Math.max(0, (nowSec - blockTime) / SECONDS_PER_DAY);
                unspentCoinDays += valBtc * ageDays;
            }
        });

        // Traverse spending transactions where this address is an input (vin)
        txs.forEach((tx) => {
            const spendingBlockTime = tx.status?.block_time || nowSec;
            let txCdd = 0;
            let txSpentBtc = 0;
            let hasTargetInput = false;

            (tx.vin || []).forEach((inp) => {
                const prevAddr = (inp.prevout?.scriptpubkey_address || "").toLowerCase();
                const isTarget = prevAddr === lowerAddr;

                if (isTarget && inp.prevout?.value) {
                    hasTargetInput = true;
                    const inputBtc = inp.prevout.value / SAT_TO_BTC;
                    txSpentBtc += inputBtc;

                    // Estimate input age from previous transaction timestamp or block height
                    let fundingBlockTime = txTimestampMap.get(inp.txid);
                    let inputAgeDays = 0;

                    if (fundingBlockTime && spendingBlockTime > fundingBlockTime) {
                        inputAgeDays = Math.max(0, (spendingBlockTime - fundingBlockTime) / SECONDS_PER_DAY);
                    } else if (inp.prevout.height && tx.status?.block_height) {
                        const blockDelta = Math.max(0, tx.status.block_height - inp.prevout.height);
                        inputAgeDays = +(blockDelta / 144).toFixed(2); // ~144 blocks per day
                    } else {
                        inputAgeDays = 1.5; // Baseline conservative assumption for immediate churn
                    }

                    const inputCdd = +(inputBtc * inputAgeDays).toFixed(4);
                    txCdd += inputCdd;
                    totalInputAgeDays += inputAgeDays;
                    spentInputsCount++;
                }
            });

            if (hasTargetInput) {
                totalCoinDaysDestroyed += txCdd;
                totalSpentBtc += txSpentBtc;

                if (txCdd > maxSingleTxCdd) {
                    maxSingleTxCdd = txCdd;
                    peakCddTxid = tx.txid;
                }

                if (txCdd >= 1.0 || txSpentBtc >= 0.1) {
                    cddEvents.push({
                        txid: tx.txid,
                        spentBtc: +txSpentBtc.toFixed(6),
                        coinDaysDestroyed: +txCdd.toFixed(4),
                        spendingTimestamp: new Date(spendingBlockTime * 1000).toISOString(),
                        blockHeight: tx.status?.block_height || null,
                        significance:
                            txCdd >= 500
                                ? "CRITICAL_DORMANT_SWEEP"
                                : txCdd >= 50
                                ? "HIGH_AGE_MOVEMENT"
                                : txCdd >= 5
                                ? "NOTABLE_CDD"
                                : "ROUTINE_CHURN",
                    });
                }
            }
        });

        const avgCoinAgeDays = spentInputsCount > 0 ? +(totalInputAgeDays / spentInputsCount).toFixed(1) : 0;

        // Classify Dormancy Reactivation Signal
        let reactivationSignal = "STANDARD_CIRCULATION";
        let dormancyLevel = "NORMAL";
        let assessment = "Address exhibits standard velocity with regular UTXO turnover and no anomalous dormant coin spikes.";

        if (maxSingleTxCdd >= 1000) {
            reactivationSignal = "ANOMALOUS_ANCIENT_COIN_WAKEUP";
            dormancyLevel = "CRITICAL";
            assessment = `ANOMALOUS DORMANT ACTIVATION: Detected a massive movement destroying ${maxSingleTxCdd.toFixed(1)} Coin Days in a single transaction. This indicates long-dormant coins (e.g. multi-year cold storage) have suddenly moved.`;
        } else if (maxSingleTxCdd >= 100) {
            reactivationSignal = "HIGH_DORMANCY_REACTIVATION";
            dormancyLevel = "ELEVATED";
            assessment = `ELEVATED DORMANCY EVENT: A transaction destroyed ${maxSingleTxCdd.toFixed(1)} Coin Days, signaling an old UTXO reactivation.`;
        } else if (maxSingleTxCdd >= 20) {
            reactivationSignal = "MODERATE_DORMANCY_CYCLE";
            dormancyLevel = "MODERATE";
            assessment = `MODERATE DORMANT PATTERN: Minor dormant coin movement observed (${maxSingleTxCdd.toFixed(1)} peak CDD).`;
        }

        const result = {
            address: cleanAddr,
            metrics: {
                totalCoinDaysDestroyed: +totalCoinDaysDestroyed.toFixed(2),
                maxSingleTxCdd: +maxSingleTxCdd.toFixed(2),
                peakCddTxid,
                totalSpentBtc: +totalSpentBtc.toFixed(6),
                averageCoinAgeDays: avgCoinAgeDays,
                currentUnspentBtc: +totalUnspentBtc.toFixed(6),
                accumulatedUnspentCoinDays: +unspentCoinDays.toFixed(2),
                evaluatedTxCount: txs.length,
            },
            dormancyClassification: {
                reactivationSignal,
                dormancyLevel,
                assessment,
            },
            cddEvents: cddEvents.slice(0, 10),
            heuristicDisclaimer: "Heuristic indicator / statistical on-chain dormancy pattern — not proof of intent.",
            dataSource: "Mempool.space Live UTXO & Transaction Telemetry",
            analyzedAt: new Date().toISOString(),
        };

        cacheService.set(cacheKey, result, 180);
        return result;
    }
}

module.exports = new CoinDaysDestroyedDetector();
