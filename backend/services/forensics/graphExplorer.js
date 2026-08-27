/**
 * CryptoScope AI — Recursive Live Fund-Flow Graph Visualizer Engine
 * 
 * Explores 1-2 hops of live Bitcoin inputs and outputs to construct an interactive
 * forensic fund flow network graph using live mempool.space data.
 * 
 * Live Sources:
 * - https://mempool.space/api/address/:address/txs
 * - https://mempool.space/api/tx/:txid
 */

const axios = require("axios");
const cacheService = require("../cacheService");
const { lookupEntity } = require("../entityService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const BLOCKSTREAM_API_BASE = "https://blockstream.info/api";
const SAT_TO_BTC = 100000000;

class GraphExplorer {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 7000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-GraphEngine/2.0",
            },
        });

        this.fallbackClient = axios.create({
            baseURL: BLOCKSTREAM_API_BASE,
            timeout: 7000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-GraphEngine/2.0",
            },
        });
    }

    async fetchAddressTxs(address) {
        const cleanAddr = address.trim();
        try {
            const res = await this.client.get(`/address/${cleanAddr}/txs`);
            return Array.isArray(res.data) ? res.data : [];
        } catch (mempoolErr) {
            try {
                const res = await this.fallbackClient.get(`/address/${cleanAddr}/txs`);
                return Array.isArray(res.data) ? res.data : [];
            } catch (fbErr) {
                console.warn(`[GraphExplorer] Failed to fetch txs for ${cleanAddr}:`, fbErr.message);
                return [];
            }
        }
    }

    /**
     * Build interactive 1-2 hop fund flow graph from live on-chain transactions
     * @param {string} rootAddress - Target Bitcoin address
     * @param {number} maxHops - Maximum recursion depth (1 or 2)
     * @param {number} maxTxs - Maximum number of transactions to analyze (default: 20)
     */
    async buildFundFlowGraph(rootAddress, maxHops = 2, maxTxs = 20) {
        if (!rootAddress || typeof rootAddress !== "string") {
            throw new Error("Valid Bitcoin root address required for fund flow graph.");
        }

        const cleanRoot = rootAddress.trim();
        const cacheKey = `forensics_graph_${cleanRoot}_hops_${maxHops}`;
        const cached = cacheService.get(cacheKey);
        if (cached) return cached;

        const nodesMap = new Map();
        const edgesList = [];
        const visitedAddresses = new Set();
        const queue = [{ address: cleanRoot, hop: 0 }];

        // Add root node
        const rootEntity = lookupEntity(cleanRoot);
        nodesMap.set(cleanRoot, {
            id: cleanRoot,
            type: "target_address",
            label: rootEntity?.name || `${cleanRoot.slice(0, 8)}...${cleanRoot.slice(-6)}`,
            fullAddress: cleanRoot,
            entityTag: rootEntity,
            isTarget: true,
            hop: 0,
            inflowBtc: 0,
            outflowBtc: 0,
        });

        let totalTxsProcessed = 0;

        while (queue.length > 0 && totalTxsProcessed < maxTxs) {
            const current = queue.shift();
            if (visitedAddresses.has(current.address)) continue;
            visitedAddresses.add(current.address);

            const txs = await this.fetchAddressTxs(current.address);
            const txsToProcess = txs.slice(0, 10);

            for (const tx of txsToProcess) {
                if (totalTxsProcessed >= maxTxs) break;
                totalTxsProcessed++;

                const txNodeId = `tx_${tx.txid.slice(0, 10)}`;
                const totalOutSat = (tx.vout || []).reduce((acc, v) => acc + (v.value || 0), 0);
                const feeSat = tx.fee || 0;

                // Add Transaction Node if not present
                if (!nodesMap.has(txNodeId)) {
                    nodesMap.set(txNodeId, {
                        id: txNodeId,
                        type: "transaction",
                        label: `TX: ${tx.txid.slice(0, 8)}...`,
                        txid: tx.txid,
                        feeSat,
                        feeBtc: feeSat / SAT_TO_BTC,
                        volumeSat: totalOutSat,
                        volumeBtc: totalOutSat / SAT_TO_BTC,
                        confirmed: Boolean(tx.status?.confirmed),
                        timestamp: tx.status?.block_time ? new Date(tx.status.block_time * 1000).toISOString() : "Mempool",
                        hop: current.hop,
                    });
                }

                // Process Inflow (Senders -> Tx)
                (tx.vin || []).forEach((inItem) => {
                    const senderAddr = inItem.prevout?.scriptpubkey_address;
                    if (!senderAddr) return;

                    const senderEntity = lookupEntity(senderAddr);
                    if (!nodesMap.has(senderAddr)) {
                        nodesMap.set(senderAddr, {
                            id: senderAddr,
                            type: senderEntity?.isMixer ? "mixer" : senderEntity?.isSanctioned ? "sanctioned" : "address",
                            label: senderEntity?.name || `${senderAddr.slice(0, 6)}...${senderAddr.slice(-4)}`,
                            fullAddress: senderAddr,
                            entityTag: senderEntity,
                            isTarget: senderAddr === cleanRoot,
                            hop: current.hop + 1,
                            inflowBtc: 0,
                            outflowBtc: inItem.prevout?.value ? inItem.prevout.value / SAT_TO_BTC : 0,
                        });

                        if (current.hop + 1 < maxHops && !visitedAddresses.has(senderAddr)) {
                            queue.push({ address: senderAddr, hop: current.hop + 1 });
                        }
                    }

                    edgesList.push({
                        id: `edge_${senderAddr.slice(0, 6)}_${txNodeId}_${edgesList.length}`,
                        source: senderAddr,
                        target: txNodeId,
                        valueSat: inItem.prevout?.value || 0,
                        valueBtc: inItem.prevout?.value ? inItem.prevout.value / SAT_TO_BTC : 0,
                        type: "INFLOW",
                    });
                });

                // Process Outflow (Tx -> Recipients)
                (tx.vout || []).forEach((outItem) => {
                    const recipientAddr = outItem.scriptpubkey_address;
                    if (!recipientAddr) return;

                    const recipientEntity = lookupEntity(recipientAddr);
                    if (!nodesMap.has(recipientAddr)) {
                        nodesMap.set(recipientAddr, {
                            id: recipientAddr,
                            type: recipientEntity?.isMixer ? "mixer" : recipientEntity?.isSanctioned ? "sanctioned" : "address",
                            label: recipientEntity?.name || `${recipientAddr.slice(0, 6)}...${recipientAddr.slice(-4)}`,
                            fullAddress: recipientAddr,
                            entityTag: recipientEntity,
                            isTarget: recipientAddr === cleanRoot,
                            hop: current.hop + 1,
                            inflowBtc: outItem.value ? outItem.value / SAT_TO_BTC : 0,
                            outflowBtc: 0,
                        });

                        if (current.hop + 1 < maxHops && !visitedAddresses.has(recipientAddr)) {
                            queue.push({ address: recipientAddr, hop: current.hop + 1 });
                        }
                    }

                    edgesList.push({
                        id: `edge_${txNodeId}_${recipientAddr.slice(0, 6)}_${edgesList.length}`,
                        source: txNodeId,
                        target: recipientAddr,
                        valueSat: outItem.value || 0,
                        valueBtc: outItem.value ? outItem.value / SAT_TO_BTC : 0,
                        type: "OUTFLOW",
                    });
                });
            }
        }

        const nodes = Array.from(nodesMap.values());

        const result = {
            rootAddress: cleanRoot,
            maxHops,
            summary: {
                totalNodes: nodes.length,
                totalEdges: edgesList.length,
                transactionsAnalyzed: totalTxsProcessed,
                counterpartiesDiscovered: nodes.filter((n) => n.type !== "transaction").length,
                sanctionedNodesCount: nodes.filter((n) => n.entityTag?.isSanctioned).length,
                mixerNodesCount: nodes.filter((n) => n.entityTag?.isMixer).length,
            },
            nodes,
            edges: edgesList,
            source: "Mempool.space Recursive Live UTXO Graph",
            generatedAt: new Date().toISOString(),
        };

        // Cache for 180 seconds
        cacheService.set(cacheKey, result, 180);
        return result;
    }
}

module.exports = new GraphExplorer();
