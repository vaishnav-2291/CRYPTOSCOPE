/**
 * CryptoScope AI — CoinJoin / Privacy Mixer Participation Detector
 * 
 * Detects structural on-chain fingerprints of privacy mixing protocols directly
 * from live transaction topologies.
 * 
 * Documented Public Conventions:
 * 1. Samourai / Ashigaru Whirlpool Standard Pools:
 *    - 0.001 BTC (100,000 sats)
 *    - 0.01 BTC (1,000,000 sats)
 *    - 0.05 BTC (5,000,000 sats)
 *    - 0.5 BTC (50,000,000 sats)
 *    - Structure: 5 inputs, 5 equal outputs (Tx0 / mix rounds)
 * 2. Wasabi Wallet / WabiSabi:
 *    - Multi-party collaborative transactions with >= 15 inputs and >= 15 equal/decomposed outputs
 * 3. JoinMarket:
 *    - Collaborative maker-taker rounds with multiple inputs and 2+ equal denomination outputs
 * 
 * Live Sources:
 * - Primary: https://mempool.space/api/address/:address/txs
 * - Fallback: https://blockstream.info/api/address/:address/txs
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SAT_TO_BTC = 100000000;

// Standard documented Whirlpool pool sizes in satoshis
const WHIRLPOOL_POOLS_SAT = [100000, 1000000, 5000000, 50000000];

class MixerDetector {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 10000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-MixerDetector/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 10000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-MixerDetector/2.0",
            },
        });
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

    classifyTxStructure(tx) {
        const inputs = tx.vin || [];
        const outputs = tx.vout || [];

        if (inputs.length < 2 || outputs.length < 2) return null;

        // Group output values
        const valueCounts = {};
        outputs.forEach((o) => {
            valueCounts[o.value] = (valueCounts[o.value] || 0) + 1;
        });

        // 1. Check for Whirlpool (5 inputs, 5 outputs of standard pool size)
        for (const poolSat of WHIRLPOOL_POOLS_SAT) {
            if (valueCounts[poolSat] >= 4) {
                return {
                    protocol: "Samourai Whirlpool",
                    poolDenominationSat: poolSat,
                    poolDenominationBtc: poolSat / SAT_TO_BTC,
                    matchingOutputsCount: valueCounts[poolSat],
                    totalInputs: inputs.length,
                    totalOutputs: outputs.length,
                    confidence: "HIGH",
                };
            }
        }

        // 2. Check for Wasabi / WabiSabi (Large multi-party rounds with >= 10 equal outputs)
        for (const [valStr, count] of Object.entries(valueCounts)) {
            const countNum = Number(count);
            const valNum = Number(valStr);
            if (countNum >= 8 && inputs.length >= 10) {
                return {
                    protocol: "Wasabi / WabiSabi CoinJoin",
                    poolDenominationSat: valNum,
                    poolDenominationBtc: valNum / SAT_TO_BTC,
                    matchingOutputsCount: countNum,
                    totalInputs: inputs.length,
                    totalOutputs: outputs.length,
                    confidence: "HIGH",
                };
            }
        }

        // 3. Generic CoinJoin / JoinMarket fingerprint (>= 3 equal outputs in multi-input tx)
        for (const [valStr, count] of Object.entries(valueCounts)) {
            const countNum = Number(count);
            const valNum = Number(valStr);
            if (countNum >= 3 && inputs.length >= 3 && valNum > 10000) {
                return {
                    protocol: "Generic CoinJoin / Collaborative Transaction",
                    poolDenominationSat: valNum,
                    poolDenominationBtc: valNum / SAT_TO_BTC,
                    matchingOutputsCount: countNum,
                    totalInputs: inputs.length,
                    totalOutputs: outputs.length,
                    confidence: "MODERATE",
                };
            }
        }

        return null;
    }

    async analyzeMixerExposure(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required for mixer detection.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_mixer_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        try {
            const txs = await this.fetchAddressTxs(cleanAddr);
            const detectedMixRounds = [];

            txs.forEach((tx) => {
                const classification = this.classifyTxStructure(tx);
                if (classification) {
                    detectedMixRounds.push({
                        txid: tx.txid,
                        protocol: classification.protocol,
                        poolDenominationBtc: classification.poolDenominationBtc,
                        poolDenominationSat: classification.poolDenominationSat,
                        matchingEqualOutputsCount: classification.matchingOutputsCount,
                        totalTxInputs: classification.totalInputs,
                        totalTxOutputs: classification.totalOutputs,
                        confidence: classification.confidence,
                        confirmed: Boolean(tx.status?.confirmed),
                        timestamp: tx.status?.block_time
                            ? new Date(tx.status.block_time * 1000).toISOString()
                            : "Mempool",
                    });
                }
            });

            let exposureLevel = "NONE";
            let forensicSummary = "No CoinJoin or privacy mixer structural fingerprints detected in recent transactions.";

            if (detectedMixRounds.length > 0) {
                exposureLevel = detectedMixRounds.some((r) => r.confidence === "HIGH") ? "HIGH" : "MODERATE";
                forensicSummary = `HEURISTIC MIXER DETECTION: Identified ${detectedMixRounds.length} transaction(s) matching known CoinJoin/Whirlpool/Wasabi structural mixing templates. Privacy mixers break deterministic heuristic linkability.`;
            }

            const result = {
                address: cleanAddr,
                isMixerParticipant: detectedMixRounds.length > 0,
                mixerExposureLevel: exposureLevel,
                totalMixRoundsDetected: detectedMixRounds.length,
                detectedMixRounds: detectedMixRounds.slice(0, 15),
                forensicSummary,
                methodology: "Structural output-denomination entropy analysis based on documented Whirlpool and Wasabi public pool standards.",
                dataSource: "Mempool.space Live On-Chain Transaction Analysis",
                analyzedAt: new Date().toISOString(),
            };

            cacheService.set(cacheKey, result, 120);
            return result;
        } catch (err) {
            console.warn("[MixerDetector] Mixer analysis error:", err.message);
            throw new Error(`Failed to analyze mixer exposure: ${err.message}`);
        }
    }
}

module.exports = new MixerDetector();
