/**
 * CryptoScope AI — Real-Time Watch & Alert Service (SSE & Email)
 * 
 * Periodically monitors live on-chain activity for addresses on users' watchlists.
 * Dispatches real-time SSE stream events and instant Gmail SMTP alert emails
 * upon new on-chain transaction arrivals, dusting attacks, or high-risk fund movements.
 * 
 * Live Sources:
 * - https://mempool.space/api/address/:address/txs
 */

const axios = require("axios");
const User = require("../../models/userModel");
const SecurityAlert = require("../../models/alertModel");
const realtimeService = require("../realtimeService");
const emailService = require("../emailService");
const { lookupEntity } = require("../entityService");

const MEMPOOL_API_BASE = "https://mempool.space/api";
const SAT_TO_BTC = 100000000;
const DUST_LIMIT_SAT = 546;

const mongoose = require("mongoose");

class WalletWatcherService {
    constructor() {
        this.client = axios.create({
            baseURL: MEMPOOL_API_BASE,
            timeout: 12000,
            headers: {
                Accept: "application/json",
                "User-Agent": "CryptoScope-AI-Watcher/2.0",
            },
        });

        this.lastSeenTxMap = new Map(); // address -> Set of known txids
        this.pollInterval = null;
        this.isPolling = false;
    }

    /**
     * Start background on-chain watcher loop (runs every 30s)
     */
    startWatcher(intervalMs = 30000) {
        if (this.pollInterval) return;

        // Initial check after 5s startup delay
        setTimeout(() => {
            this.pollWatchlists().catch(() => {});
        }, 5000);

        this.pollInterval = setInterval(() => {
            this.pollWatchlists().catch(() => {});
        }, intervalMs);

        console.log("📡 [WalletWatcherService] Real-time on-chain watchlist watcher active.");
    }

    stopWatcher() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Poll live mempool for all watched addresses in MongoDB
     */
    async pollWatchlists() {
        if (this.isPolling) return;
        if (mongoose.connection.readyState !== 1) return; // Wait for active MongoDB connection
        this.isPolling = true;

        try {
            // Find all users with active watchlists
            const usersWithWatchlist = await User.find(
                { "watchlist.0": { $exists: true } },
                "_id name email watchlist"
            ).lean();

            if (!usersWithWatchlist || usersWithWatchlist.length === 0) {
                this.isPolling = false;
                return;
            }

            // Map addresses to subscriber users
            const addressToUsersMap = new Map();
            usersWithWatchlist.forEach((u) => {
                (u.watchlist || []).forEach((item) => {
                    if (!item.address) return;
                    const addr = item.address.trim();
                    if (!addressToUsersMap.has(addr)) {
                        addressToUsersMap.set(addr, []);
                    }
                    addressToUsersMap.get(addr).push({
                        userId: u._id.toString(),
                        email: u.email,
                        name: u.name,
                        label: item.label,
                    });
                });
            });

            // Process watched addresses in bounded batches
            const uniqueAddresses = Array.from(addressToUsersMap.keys());
            const BATCH_SIZE = 3;

            for (let i = 0; i < uniqueAddresses.length; i += BATCH_SIZE) {
                const batch = uniqueAddresses.slice(i, i + BATCH_SIZE);
                await Promise.all(
                    batch.map((addr) => this.checkAddressActivity(addr, addressToUsersMap.get(addr)))
                );
            }
        } catch (err) {
            console.warn("[WalletWatcherService] Watchlist polling error:", err.message);
        } finally {
            this.isPolling = false;
        }
    }

    /**
     * Inspect single address for new on-chain transactions
     */
    async checkAddressActivity(address, subscribers) {
        try {
            let txs = [];
            try {
                const res = await this.client.get(`/address/${address}/txs`);
                txs = Array.isArray(res.data) ? res.data : [];
            } catch {
                const bsRes = await axios.get(`https://blockstream.info/api/address/${address}/txs`, {
                    timeout: 12000,
                    headers: { Accept: "application/json" },
                });
                txs = Array.isArray(bsRes.data) ? bsRes.data : [];
            }
            if (txs.length === 0) return;

            // Initialize baseline set if first time checking this address
            if (!this.lastSeenTxMap.has(address)) {
                const baselineSet = new Set(txs.map((t) => t.txid));
                this.lastSeenTxMap.set(address, baselineSet);
                return;
            }

            const knownTxs = this.lastSeenTxMap.get(address);
            const newTxs = txs.filter((t) => !knownTxs.has(t.txid));

            for (const newTx of newTxs) {
                knownTxs.add(newTx.txid);

                // Calculate received value on target address
                const receivedOutputs = (newTx.vout || []).filter(
                    (out) => out.scriptpubkey_address === address
                );
                const totalReceivedSat = receivedOutputs.reduce((acc, o) => acc + (o.value || 0), 0);
                const isDusting = receivedOutputs.some((o) => o.value <= DUST_LIMIT_SAT);

                const entity = lookupEntity(address);
                const eventType = isDusting ? "dusting_alert" : "tx_detected";

                const alertPayload = {
                    eventType,
                    address,
                    txid: newTx.txid,
                    receivedSat: totalReceivedSat,
                    receivedBtc: totalReceivedSat / SAT_TO_BTC,
                    isDusting,
                    entityTag: entity,
                    confirmed: Boolean(newTx.status?.confirmed),
                    timestamp: newTx.status?.block_time
                        ? new Date(newTx.status.block_time * 1000).toISOString()
                        : new Date().toISOString(),
                };

                // 1. Broadcast SSE Realtime Event to all subscribers
                subscribers.forEach((sub) => {
                    realtimeService.broadcast(eventType, { ...alertPayload, label: sub.label }, sub.userId);
                });

                // 2. Dispatch Email Notifications if configured
                for (const sub of subscribers) {
                    if (sub.email && emailService) {
                        const emailSubject = isDusting
                            ? `[CryptoScope ALERT] Dusting Attack Detected on ${sub.label || address}`
                            : `[CryptoScope] New On-Chain Transaction on ${sub.label || address}`;

                        const emailContent = `
                            <h2>${emailSubject}</h2>
                            <p>Hello ${sub.name},</p>
                            <p>CryptoScope AI has detected a live on-chain event on your watched address:</p>
                            <ul>
                                <li><strong>Address:</strong> ${address}</li>
                                <li><strong>Label:</strong> ${sub.label || "Watched Wallet"}</li>
                                <li><strong>Transaction ID:</strong> ${newTx.txid}</li>
                                <li><strong>Amount:</strong> ${(totalReceivedSat / SAT_TO_BTC).toFixed(8)} BTC</li>
                                ${isDusting ? `<li style="color:red;"><strong>WARNING:</strong> Micro-deposit (<= ${DUST_LIMIT_SAT} sat) detected. Do not co-spend to prevent deanonymization.</li>` : ""}
                            </ul>
                            <p>View complete forensic diagnostics in your CryptoScope Dashboard.</p>
                        `;

                        emailService.sendMail({
                            to: sub.email,
                            subject: emailSubject,
                            html: emailContent,
                        }).catch((mailErr) => {
                            console.warn(`[WalletWatcherService] Email notification notice for ${sub.email}:`, mailErr.message);
                        });
                    }
                }
            }
        } catch (err) {
            console.warn(`[WalletWatcherService] Check activity failed for ${address}:`, err.message);
        }
    }
}

module.exports = new WalletWatcherService();
