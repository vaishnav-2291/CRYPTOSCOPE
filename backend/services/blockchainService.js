const axios = require("axios");
const cacheService = require("./cacheService");
const { lookupEntity, extractAddressClustering } = require("./entityService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SATOSHIS_PER_BTC = 100000000;

class BitcoinProvider {
    constructor() {
        this.name = "Bitcoin Mainnet RPC/API";
        this.mempoolClient = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 5000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-BlockchainEngine/2.0",
            },
        });

        this.blockstreamClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 5000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-BlockchainEngine/2.0",
            },
        });
    }

    /**
     * Get complete live overview for Bitcoin wallet address
     */
    async getWalletOverview(address) {
        const cleanAddress = address.trim();
        const cacheKey = `wallet_overview_${cleanAddress}`;

        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        let rawAddressData = null;
        let rawTxs = [];
        let activeProvider = "Mempool.space";

        // 1. Try Mempool.space first
        try {
            const [addrRes, txsRes] = await Promise.all([
                this.mempoolClient.get(`/address/${cleanAddress}`),
                this.mempoolClient.get(`/address/${cleanAddress}/txs`),
            ]);

            rawAddressData = addrRes.data;
            rawTxs = Array.isArray(txsRes.data) ? txsRes.data : [];
        } catch (mempoolErr) {
            console.warn(`[BlockchainService] Mempool.space failed for ${cleanAddress}, trying Blockstream:`, mempoolErr.message);

            // 2. Fallback to Blockstream API
            try {
                const [addrRes, txsRes] = await Promise.all([
                    this.blockstreamClient.get(`/address/${cleanAddress}`),
                    this.blockstreamClient.get(`/address/${cleanAddress}/txs`),
                ]);

                rawAddressData = addrRes.data;
                rawTxs = Array.isArray(txsRes.data) ? txsRes.data : [];
                activeProvider = "Blockstream.info";
            } catch (blockstreamErr) {
                console.warn(`[BlockchainService] Blockstream failed for ${cleanAddress}:`, blockstreamErr.message);
            }
        }

        const entityTag = lookupEntity(cleanAddress);

        // If provider returned genuine blockchain data
        if (rawAddressData) {
            const chainStats = rawAddressData.chain_stats || {};
            const mempoolStats = rawAddressData.mempool_stats || {};

            const fundedSat = (chainStats.funded_txo_sum || 0) + (mempoolStats.funded_txo_sum || 0);
            const spentSat = (chainStats.spent_txo_sum || 0) + (mempoolStats.spent_txo_sum || 0);
            const balanceSat = fundedSat - spentSat;

            const balance = Number((balanceSat / SATOSHIS_PER_BTC).toFixed(8));
            const totalReceived = Number((fundedSat / SATOSHIS_PER_BTC).toFixed(8));
            const totalSent = Number((spentSat / SATOSHIS_PER_BTC).toFixed(8));
            const totalTxCount = (chainStats.tx_count || 0) + (mempoolStats.tx_count || 0);

            const transactions = this.parseTransactions(rawTxs, cleanAddress);
            const clustering = extractAddressClustering(cleanAddress, rawTxs);
            const graphData = this.buildFundFlowGraph(cleanAddress, transactions);

            const result = {
                address: cleanAddress,
                network: "bitcoin",
                provider: activeProvider,
                balance,
                balanceUSD: 0,
                totalReceived,
                totalSent,
                n_tx: totalTxCount,
                unconfirmedTxCount: mempoolStats.tx_count || 0,
                unconfirmedBalanceSat: (mempoolStats.funded_txo_sum || 0) - (mempoolStats.spent_txo_sum || 0),
                entityTag,
                clustering,
                transactions,
                graphData,
                lastSeenTxId: rawTxs.length > 0 ? rawTxs[rawTxs.length - 1].txid : null,
                hasMoreTxs: totalTxCount > rawTxs.length,
                scannedAt: new Date().toISOString(),
            };

            cacheService.set(cacheKey, result, 120);
            return result;
        }

        // Clean zero-activity response if address is fresh/unfound on mainnet
        const emptyResult = {
            address: cleanAddress,
            network: "bitcoin",
            provider: "Bitcoin Mainnet (Zero State / Dormant)",
            balance: 0,
            balanceUSD: 0,
            totalReceived: 0,
            totalSent: 0,
            n_tx: 0,
            unconfirmedTxCount: 0,
            unconfirmedBalanceSat: 0,
            entityTag,
            clustering: { clusterSize: 1, confidence: "Low", heuristic: "Single Address", associatedAddresses: [] },
            transactions: [],
            graphData: {
                nodes: [
                    {
                        id: cleanAddress,
                        label: entityTag?.name || "Target Address",
                        shortLabel: `${cleanAddress.slice(0, 6)}...${cleanAddress.slice(-4)}`,
                        type: "target",
                        isTarget: true,
                        entity: entityTag,
                        val: 20,
                    },
                ],
                edges: [],
            },
            lastSeenTxId: null,
            hasMoreTxs: false,
            scannedAt: new Date().toISOString(),
        };

        cacheService.set(cacheKey, emptyResult, 120);
        return emptyResult;
    }

    /**
     * Get paginated transactions from live explorer API
     */
    async getPaginatedTransactions(address, afterTxid = null) {
        const cleanAddress = address.trim();
        const cacheKey = `txs_${cleanAddress}_${afterTxid || "first"}`;

        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        try {
            const url = afterTxid
                ? `/address/${cleanAddress}/txs/chain/${afterTxid}`
                : `/address/${cleanAddress}/txs`;

            const res = await this.mempoolClient.get(url);
            const rawTxs = Array.isArray(res.data) ? res.data : [];
            const parsed = this.parseTransactions(rawTxs, cleanAddress);

            const result = {
                address: cleanAddress,
                transactions: parsed,
                count: parsed.length,
                nextAfterTxid: rawTxs.length >= 25 ? rawTxs[rawTxs.length - 1].txid : null,
                hasMore: rawTxs.length >= 25,
            };

            cacheService.set(cacheKey, result, 120);
            return result;
        } catch (err) {
            return {
                address: cleanAddress,
                transactions: [],
                count: 0,
                nextAfterTxid: null,
                hasMore: false,
            };
        }
    }

    /**
     * Parse raw transaction arrays into normalized forensic structures
     */
    parseTransactions(rawTxs, targetAddress) {
        const target = targetAddress.toLowerCase();

        return rawTxs.map((tx) => {
            const isConfirmed = tx.status && tx.status.confirmed;
            const blockHeight = tx.status?.block_height || null;
            const blockTime = tx.status?.block_time
                ? new Date(tx.status.block_time * 1000).toISOString()
                : new Date().toISOString();

            const inputs = (tx.vin || []).map((vin) => ({
                txid: vin.txid,
                vout: vin.vout,
                address: vin.prevout?.scriptpubkey_address || "Coinbase / Unknown",
                value: vin.prevout?.value ? vin.prevout.value / SATOSHIS_PER_BTC : 0,
                entityTag: lookupEntity(vin.prevout?.scriptpubkey_address),
            }));

            const outputs = (tx.vout || []).map((vout, index) => ({
                index,
                address: vout.scriptpubkey_address || "OP_RETURN / Script",
                value: vout.value ? vout.value / SATOSHIS_PER_BTC : 0,
                entityTag: lookupEntity(vout.scriptpubkey_address),
            }));

            const targetSentSat = (tx.vin || []).reduce((acc, vin) => {
                if (vin.prevout?.scriptpubkey_address?.toLowerCase() === target) {
                    return acc + (vin.prevout.value || 0);
                }
                return acc;
            }, 0);

            const targetReceivedSat = (tx.vout || []).reduce((acc, vout) => {
                if (vout.scriptpubkey_address?.toLowerCase() === target) {
                    return acc + (vout.value || 0);
                }
                return acc;
            }, 0);

            let direction = "OUTGOING";
            let netAmountSat = 0;

            if (targetReceivedSat > 0 && targetSentSat === 0) {
                direction = "INCOMING";
                netAmountSat = targetReceivedSat;
            } else if (targetSentSat > 0 && targetReceivedSat === 0) {
                direction = "OUTGOING";
                netAmountSat = targetSentSat;
            } else if (targetReceivedSat > targetSentSat) {
                direction = "INCOMING";
                netAmountSat = targetReceivedSat - targetSentSat;
            } else {
                direction = "OUTGOING";
                netAmountSat = targetSentSat - targetReceivedSat;
            }

            const totalOutputValueSat = (tx.vout || []).reduce((sum, vout) => sum + (vout.value || 0), 0);
            const totalInputValueSat = (tx.vin || []).reduce((sum, vin) => sum + (vin.prevout?.value || 0), 0);
            const feeSat = tx.fee || (totalInputValueSat > totalOutputValueSat ? totalInputValueSat - totalOutputValueSat : 0);

            return {
                hash: tx.txid,
                status: isConfirmed ? "Confirmed" : "Pending",
                blockHeight,
                timestamp: blockTime,
                direction,
                amount: Number((netAmountSat / SATOSHIS_PER_BTC).toFixed(8)),
                totalVolume: Number((totalOutputValueSat / SATOSHIS_PER_BTC).toFixed(8)),
                feeBTC: Number((feeSat / SATOSHIS_PER_BTC).toFixed(8)),
                inputs,
                outputs,
            };
        });
    }

    /**
     * Build Fund Flow Graph structure
     */
    buildFundFlowGraph(targetAddress, transactions = []) {
        const nodesMap = new Map();
        const edges = [];

        nodesMap.set(targetAddress, {
            id: targetAddress,
            label: "Target Wallet",
            shortLabel: `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}`,
            type: "target",
            isTarget: true,
            entity: lookupEntity(targetAddress),
            val: 20,
        });

        transactions.slice(0, 15).forEach((tx) => {
            if (tx.direction === "INCOMING") {
                tx.inputs.slice(0, 3).forEach((inp) => {
                    if (inp.address && inp.address !== targetAddress && inp.address !== "Coinbase / Unknown") {
                        if (!nodesMap.has(inp.address)) {
                            nodesMap.set(inp.address, {
                                id: inp.address,
                                label: inp.entityTag?.name || "Inbound Source",
                                shortLabel: `${inp.address.slice(0, 5)}...${inp.address.slice(-4)}`,
                                type: inp.entityTag?.isMixer ? "mixer" : inp.entityTag?.name ? "entity" : "source",
                                entity: inp.entityTag,
                                val: 10,
                            });
                        }
                        edges.push({
                            id: `edge_${inp.address}_${targetAddress}_${tx.hash.slice(0, 8)}`,
                            source: inp.address,
                            target: targetAddress,
                            amount: tx.amount,
                            txHash: tx.hash,
                            direction: "inbound",
                        });
                    }
                });
            } else {
                tx.outputs.slice(0, 3).forEach((out) => {
                    if (out.address && out.address !== targetAddress && !out.address.includes("Script")) {
                        if (!nodesMap.has(out.address)) {
                            nodesMap.set(out.address, {
                                id: out.address,
                                label: out.entityTag?.name || "Outbound Dest",
                                shortLabel: `${out.address.slice(0, 5)}...${out.address.slice(-4)}`,
                                type: out.entityTag?.isMixer ? "mixer" : out.entityTag?.name ? "entity" : "destination",
                                entity: out.entityTag,
                                val: 10,
                            });
                        }
                        edges.push({
                            id: `edge_${targetAddress}_${out.address}_${tx.hash.slice(0, 8)}`,
                            source: targetAddress,
                            target: out.address,
                            amount: out.value || tx.amount,
                            txHash: tx.hash,
                            direction: "outbound",
                        });
                    }
                });
            }
        });

        return {
            nodes: Array.from(nodesMap.values()),
            edges: edges.slice(0, 25),
        };
    }
}

const btcProvider = new BitcoinProvider();

module.exports = {
    btcProvider,
    getWalletData: (address) => btcProvider.getWalletOverview(address),
    getPaginatedTransactions: (address, afterTxid) => btcProvider.getPaginatedTransactions(address, afterTxid),
};
