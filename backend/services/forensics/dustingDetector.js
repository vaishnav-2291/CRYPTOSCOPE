/**
 * CryptoScope AI — Live Bitcoin Dusting-Attack Detector
 * 
 * Detects unsolicited micro-deposits (<= 546 sat standard economic dust threshold)
 * and multi-destination fan-out dusting campaigns on Bitcoin addresses using live on-chain data.
 * 
 * Live Sources:
 * - https://mempool.space/api/address/:address/txs
 * - https://mempool.space/api/address/:address/utxo
 * Fallback:
 * - https://blockstream.info/api/address/:address/txs
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";

// Bitcoin standard economic dust limit: 546 satoshis for standard P2PKH/P2SH
const DUST_ECONOMIC_THRESHOLD_SAT = 546;
// Upper bound for modern dusting campaigns (often 1000 - 1500 sats)
const DUST_CAMPAIGN_UPPER_BOUND_SAT = 1500;
const SAT_TO_BTC = 100000000;

class DustingDetector {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-Forensics/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 6000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-Forensics/2.0",
            },
        });
    }

    /**
     * Fetch address transactions and UTXOs with automatic provider failover
     */
    async fetchAddressData(address) {
        const cleanAddr = address.trim();
        let txs = [];
        let utxos = [];
        let provider = "Mempool.space Live On-Chain API";

        try {
            const [txsRes, utxoRes] = await Promise.all([
                this.client.get(`/address/${cleanAddr}/txs`).catch(() => ({ data: [] })),
                this.client.get(`/address/${cleanAddr}/utxo`).catch(() => ({ data: [] })),
            ]);
            txs = Array.isArray(txsRes.data) ? txsRes.data : [];
            utxos = Array.isArray(utxoRes.data) ? utxoRes.data : [];
        } catch (mempoolErr) {
            console.warn(`[DustingDetector] Mempool.space failed for ${cleanAddr}, trying Blockstream:`, mempoolErr.message);
        }

        if (txs.length === 0 && utxos.length === 0) {
            try {
                const [txsRes, utxoRes] = await Promise.all([
                    this.fallbackClient.get(`/address/${cleanAddr}/txs`).catch(() => ({ data: [] })),
                    this.fallbackClient.get(`/address/${cleanAddr}/utxo`).catch(() => ({ data: [] })),
                ]);
                txs = Array.isArray(txsRes.data) ? txsRes.data : [];
                utxos = Array.isArray(utxoRes.data) ? utxoRes.data : [];
                provider = "Blockstream.info Live API (Fallback)";
            } catch (fbErr) {
                console.warn(`[DustingDetector] Blockstream failed for ${cleanAddr}:`, fbErr.message);
            }
        }

        return { txs, utxos, provider };
    }

    /**
     * Analyze address for dusting attacks and deanonymization exposure
     * @param {string} address - Target Bitcoin address
     * @returns {Promise<Object>} Structured dusting attack forensics
     */
    async analyzeAddress(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address is required for dusting analysis.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_dusting_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const { txs, utxos, provider } = await this.fetchAddressData(cleanAddr);

        // 1. Identify unspent dust UTXOs (active deanonymization hazard)
        const activeDustUtxos = utxos.filter((u) => u.value <= DUST_CAMPAIGN_UPPER_BOUND_SAT);
        const activeDustSatoshis = activeDustUtxos.reduce((sum, u) => sum + u.value, 0);

        // 2. Scan historical transactions for dusting deposits and multi-destination fanouts
        const detectedCampaigns = [];
        let totalHistoricalDustSat = 0;
        let totalDustTxCount = 0;

        txs.forEach((tx) => {
            // Find outputs belonging to target address
            const matchingOutputs = (tx.vout || []).filter(
                (out) => out.scriptpubkey_address === cleanAddr && out.value <= DUST_CAMPAIGN_UPPER_BOUND_SAT
            );

            if (matchingOutputs.length > 0) {
                totalDustTxCount++;
                const isFanout = (tx.vout || []).length >= 10;
                const fanoutTinyOutputs = (tx.vout || []).filter((out) => out.value <= DUST_CAMPAIGN_UPPER_BOUND_SAT).length;

                matchingOutputs.forEach((out) => {
                    totalHistoricalDustSat += out.value;
                    detectedCampaigns.push({
                        txid: tx.txid,
                        satoshis: out.value,
                        btc: out.value / SAT_TO_BTC,
                        isUnderEconomicThreshold: out.value <= DUST_ECONOMIC_THRESHOLD_SAT,
                        totalTxOutputsCount: tx.vout?.length || 0,
                        isMassFanout: isFanout,
                        massFanoutDustOutputsCount: fanoutTinyOutputs,
                        confirmed: Boolean(tx.status?.confirmed),
                        blockHeight: tx.status?.block_height || null,
                        blockTime: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : "Unconfirmed Mempool",
                    });
                });
            }
        });

        // 3. Determine Risk Severity Level
        let activeHazard = "NONE";
        let summaryDescription = "No unsolicited micro-deposits or dusting fingerprints detected on this wallet.";

        if (activeDustUtxos.length > 0 && detectedCampaigns.some((c) => c.isMassFanout)) {
            activeHazard = "HIGH";
            summaryDescription = `CRITICAL HAZARD: ${activeDustUtxos.length} unspent dust UTXO(s) detected resulting from verified mass-fanout dusting campaigns. Spending these funds together with normal UTXOs will deanonymize your wallet cluster via the common-input heuristic.`;
        } else if (activeDustUtxos.length > 0) {
            activeHazard = "MEDIUM";
            summaryDescription = `WARNING: ${activeDustUtxos.length} unspent micro-deposit(s) found below economic dust threshold (${(activeDustSatoshis / SAT_TO_BTC).toFixed(8)} BTC). Active deanonymization tracking risk.`;
        } else if (detectedCampaigns.length > 0) {
            activeHazard = "LOW";
            summaryDescription = `HISTORICAL NOTICE: ${detectedCampaigns.length} past dusting deposit(s) identified, but all dust outputs have already been moved or consolidated.`;
        }

        const result = {
            address: cleanAddr,
            isDustingVictim: detectedCampaigns.length > 0,
            activeHazard,
            metrics: {
                totalDustTxsDetected: totalDustTxCount,
                unspentDustUtxosCount: activeDustUtxos.length,
                unspentDustSatoshis: activeDustSatoshis,
                unspentDustBtc: activeDustSatoshis / SAT_TO_BTC,
                totalHistoricalDustSatoshis: totalHistoricalDustSat,
                totalHistoricalDustBtc: totalHistoricalDustSat / SAT_TO_BTC,
                economicDustThresholdSat: DUST_ECONOMIC_THRESHOLD_SAT,
                campaignThresholdSat: DUST_CAMPAIGN_UPPER_BOUND_SAT,
            },
            campaigns: detectedCampaigns.slice(0, 20),
            summaryDescription,
            remediationAdvice: activeDustUtxos.length > 0
                ? "DO NOT spend or consolidate these dust UTXOs in standard transactions. Freeze these specific coins using coin-control in your wallet software or route them through CoinJoin/privacy protocols to prevent deanonymization."
                : "Standard hygiene recommended. No coin-control freeze currently required.",
            dataSource: provider,
            analyzedAt: new Date().toISOString(),
        };

        // Cache for 120 seconds
        cacheService.set(cacheKey, result, 120);
        return result;
    }
}

module.exports = new DustingDetector();
