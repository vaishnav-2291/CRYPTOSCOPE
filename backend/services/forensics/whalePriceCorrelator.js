/**
 * CryptoScope AI — Live Whale-Move vs. Price-Impact Correlator
 * 
 * Correlates large on-chain transactions with historical spot price swings
 * using live Mempool.space transaction timestamps and CoinGecko market charts.
 * 
 * Live Sources:
 * - Mempool.space: https://mempool.space/api/address/:address/txs
 * - CoinGecko: https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range
 */

const axios = require("axios");
const cacheService = require("../cacheService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";
const SAT_TO_BTC = 100000000;
const WHALE_THRESHOLD_BTC = 1.0; // Transactions >= 1.0 BTC evaluated for price correlation

class WhalePriceCorrelator {
    constructor() {
        this.mempoolClient = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 12000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-WhaleCorrelator/2.0",
            },
        });

        this.coingeckoClient = axios.create({
            baseURL: COINGECKO_API_BASE,
            timeout: 12000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-WhaleCorrelator/2.0",
            },
        });
    }

    /**
     * Correlate large wallet transactions with real BTC price movements
     * @param {string} address - Target Bitcoin address
     */
    async correlateWhaleMoves(address) {
        if (!address || typeof address !== "string") {
            throw new Error("Valid Bitcoin address required for whale correlation.");
        }

        const cleanAddr = address.trim();
        const cacheKey = `forensics_whale_price_${cleanAddr}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        try {
            let txs = [];
            try {
                const txsRes = await this.mempoolClient.get(`/address/${cleanAddr}/txs`);
                txs = Array.isArray(txsRes.data) ? txsRes.data : [];
            } catch (mErr) {
                console.warn("[WhalePriceCorrelator] Mempool fetch notice:", mErr.message);
                // Fallback to Blockstream
                const bsRes = await axios.get(`https://blockstream.info/api/address/${cleanAddr}/txs`, { timeout: 12000 });
                txs = Array.isArray(bsRes.data) ? bsRes.data : [];
            }

            // Filter large transactions
            const whaleTxs = [];
            txs.forEach((tx) => {
                const totalOutSat = (tx.vout || []).reduce((acc, o) => acc + (o.value || 0), 0);
                const totalOutBtc = totalOutSat / SAT_TO_BTC;
                const blockTime = tx.status?.block_time;

                if (totalOutBtc >= WHALE_THRESHOLD_BTC && blockTime) {
                    whaleTxs.push({
                        txid: tx.txid,
                        volumeBtc: totalOutBtc,
                        blockTime,
                        isoTime: new Date(blockTime * 1000).toISOString(),
                        confirmed: Boolean(tx.status?.confirmed),
                    });
                }
            });

            // For the top 2 whale transactions, fetch CoinGecko historical price range concurrently
            const targetWhales = whaleTxs.slice(0, 2);
            const correlationPromises = targetWhales.map(async (wTx) => {
                try {
                    const fromTime = wTx.blockTime - 7200; // -2 hours
                    const toTime = wTx.blockTime + 7200;   // +2 hours

                    const chartRes = await this.coingeckoClient.get(
                        `/coins/bitcoin/market_chart/range?vs_currency=usd&from=${fromTime}&to=${toTime}`
                    );

                    const prices = chartRes.data?.prices || [];
                    if (prices.length >= 2) {
                        const priceBefore = prices[0][1];
                        const priceAfter = prices[prices.length - 1][1];
                        const priceDeltaPct = +(((priceAfter - priceBefore) / priceBefore) * 100).toFixed(2);

                        return {
                            txid: wTx.txid,
                            volumeBtc: wTx.volumeBtc,
                            txTimestamp: wTx.isoTime,
                            btcPriceAtWindowStartUsd: Math.round(priceBefore),
                            btcPriceAtWindowEndUsd: Math.round(priceAfter),
                            priceDeltaPct,
                            marketObservation:
                                Math.abs(priceDeltaPct) >= 2.0
                                    ? `Notable market move: BTC price swung ${priceDeltaPct > 0 ? "+" : ""}${priceDeltaPct}% within a 4-hour window surrounding this ${wTx.volumeBtc.toFixed(2)} BTC transfer.`
                                    : `Standard price stability: BTC moved ${priceDeltaPct > 0 ? "+" : ""}${priceDeltaPct}% during this transaction's timeframe.`,
                        };
                    }
                } catch (cgErr) {
                    console.warn(`[WhalePriceCorrelator] CoinGecko notice:`, cgErr.message);
                }
                return {
                    txid: wTx.txid,
                    volumeBtc: wTx.volumeBtc,
                    txTimestamp: wTx.isoTime,
                    btcPriceAtWindowStartUsd: null,
                    btcPriceAtWindowEndUsd: null,
                    priceDeltaPct: null,
                    marketObservation: "Spot price swing unavailable during this query window (CoinGecko rate-limit or timeout).",
                };
            });

            const settled = await Promise.all(correlationPromises);
            const correlations = settled.filter(Boolean);

            const result = {
                address: cleanAddr,
                whaleThresholdBtc: WHALE_THRESHOLD_BTC,
                totalLargeTxsEvaluated: whaleTxs.length,
                correlations,
                summaryFinding: correlations.length > 0
                    ? `Correlated ${correlations.length} large transfer(s) (>= ${WHALE_THRESHOLD_BTC} BTC) against real on-chain transfer data.`
                    : "No high-volume transactions (>= 1.0 BTC) detected in recent on-chain history.",
                dataSource: "Mempool.space / Blockstream On-Chain Telemetry + CoinGecko Market Charts",
                analyzedAt: new Date().toISOString(),
            };

            cacheService.set(cacheKey, result, 300);
            return result;
        } catch (err) {
            console.warn("[WhalePriceCorrelator] Error:", err.message);
            return {
                address: cleanAddr,
                whaleThresholdBtc: WHALE_THRESHOLD_BTC,
                totalLargeTxsEvaluated: 0,
                correlations: [],
                summaryFinding: "Whale transaction telemetry temporarily unreachable.",
                dataSource: "Mempool.space / Blockstream On-Chain Telemetry (Offline)",
                analyzedAt: new Date().toISOString(),
            };
        }
    }
}

module.exports = new WhalePriceCorrelator();
