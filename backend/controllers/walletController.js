const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const SecurityAlert = require("../models/alertModel");
const UserActivity = require("../models/activityModel");
const { getWalletData, getPaginatedTransactions } = require("../services/blockchainService");
const { calculateRisk } = require("../services/riskEngine");
const { lookupEntity } = require("../services/entityService");
const cacheService = require("../services/cacheService");
const realtimeService = require("../services/realtimeService");
const { logActivity } = require("../services/activityService");
const mongoose = require("mongoose");
const axios = require("axios");

function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Helper to fetch live BTC price for USD conversions (cached for 60s)
 */
async function getLiveBtcPriceUSD() {
    const cached = cacheService.get("live_btc_price_usd");
    if (cached) return cached;

    try {
        const res = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", {
            timeout: 2000,
        });
        const price = res.data?.bitcoin?.usd || 96420;
        cacheService.set("live_btc_price_usd", price, 60);
        return price;
    } catch {
        cacheService.set("live_btc_price_usd", 96420, 60);
        return 96420;
    }
}

// =============================================================================
// ANALYZE SINGLE WALLET (Persisted in MongoDB)
// =============================================================================
exports.fetchWallet = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({
            success: false,
            message: "Database service is currently unavailable. Wallet scan cannot be persisted.",
        });
    }

    try {
        const address = req.validatedAddress || req.params.address;
        const btcPriceUSD = await getLiveBtcPriceUSD();

        // 1. Fetch live blockchain data from Mempool.space
        const data = await getWalletData(address);
        data.balanceUSD = Number((data.balance * btcPriceUSD).toFixed(2));

        // 2. Execute Deterministic 5-Axis Risk Engine
        const risk = calculateRisk(data);

        // 3. Persist scan document to MongoDB
        const walletScan = new Wallet({
            user: req.user?.id || null,
            address: data.address,
            network: data.network || "bitcoin",
            scanType: "SINGLE_SCAN",
            balance: data.balance,
            balanceUSD: data.balanceUSD,
            totalReceived: data.totalReceived,
            totalSent: data.totalSent,
            transactions: data.n_tx,
            unconfirmedTxCount: data.unconfirmedTxCount || 0,
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel,
            riskFactors: risk.riskFactors,
            aiReport: risk.aiReport,
            scoreBreakdown: risk.breakdown,
            ruleTriggers: risk.ruleTriggers,
            entityTag: data.entityTag,
            clusteringInfo: data.clustering,
            graphData: data.graphData,
            isPublic: true,
            status: "COMPLETED",
            scannedAt: new Date(),
        });

        const savedScan = await walletScan.save();

        // 4. If High Risk / Exploit / OFAC Triggered, persist SecurityAlert
        if (risk.riskScore >= 70 || risk.riskLevel === "High" || data.entityTag?.isSanctioned || data.entityTag?.isMixer) {
            try {
                const incidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                const topRule = risk.ruleTriggers[0]?.title || "High Risk Deterministic Anomaly";
                const primarySeverity = risk.riskScore >= 80 ? "CRITICAL" : "HIGH";

                const alertDoc = new SecurityAlert({
                    incidentId,
                    userId: req.user?.id || null,
                    address: data.address,
                    threatCategory: data.entityTag?.category || "Heuristic Risk Anomaly",
                    ruleTrigger: risk.ruleTriggers[0]?.id ? `${risk.ruleTriggers[0].id} (${topRule})` : "RULE-RISK-HIGH",
                    severity: primarySeverity,
                    riskScore: risk.riskScore,
                    status: data.entityTag?.isSanctioned ? "AUTO-QUARANTINED" : "UNDER_INVESTIGATION",
                    amount: `${Number(data.balance || 0).toFixed(8)} BTC`,
                    details: risk.aiReport?.split(". ")[0] || "High risk score flagged by 5-axis engine.",
                });

                await alertDoc.save();
                realtimeService.emitAlertTriggered(alertDoc);
            } catch (alertErr) {
                console.error("Alert save notice:", alertErr.message);
            }
        }

        // 5. Persistent User Activity Logging
        await logActivity({
            userId: req.user?.id || null,
            userEmail: req.user?.email || "guest@cryptoscope.ai",
            action: "WALLET_SCANNED",
            resourceType: "WALLET",
            resourceId: data.address,
            details: {
                scanId: savedScan._id.toString(),
                riskScore: risk.riskScore,
                riskLevel: risk.riskLevel,
                balance: data.balance,
            },
            status: "SUCCESS",
            req,
        });

        // 6. Emit Real-time Event
        realtimeService.emitScanCompleted(savedScan);

        // 7. Enriched API Response
        res.json({
            success: true,
            scanId: savedScan._id.toString(),
            address: data.address,
            network: data.network,
            balance: data.balance,
            balanceUSD: data.balanceUSD,
            btcPriceUSD,
            totalReceived: data.totalReceived,
            totalSent: data.totalSent,
            transactionCount: data.n_tx,
            unconfirmedTxCount: data.unconfirmedTxCount,
            entityTag: data.entityTag,
            clustering: data.clustering,
            transactions: data.transactions,
            graphData: data.graphData,
            hasMoreTxs: data.hasMoreTxs,
            lastSeenTxId: data.lastSeenTxId,
            riskScore: risk.riskScore,
            riskLevel: risk.riskLevel,
            security: risk.riskLevel,
            riskFactors: risk.riskFactors,
            aiReport: risk.aiReport,
            securityAssessment: risk.aiReport,
            breakdown: risk.breakdown,
            scoreBreakdown: risk.breakdown,
            ruleTriggers: risk.ruleTriggers,
            methodology: risk.methodology,
            scannedAt: savedScan.scannedAt,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message || "Failed to analyze wallet.",
        });
    }
};

// =============================================================================
// BATCH WALLET SCAN (Persisted in MongoDB)
// =============================================================================
exports.batchScan = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database service unavailable." });
    }

    try {
        const addresses = req.validAddresses || [];
        const btcPriceUSD = await getLiveBtcPriceUSD();

        const results = [];
        const chunkSize = 4;

        for (let i = 0; i < addresses.length; i += chunkSize) {
            const chunk = addresses.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (addr) => {
                try {
                    const data = await getWalletData(addr);
                    const risk = calculateRisk(data);
                    data.balanceUSD = Number((data.balance * btcPriceUSD).toFixed(2));

                    // Save each scan to MongoDB
                    const scan = new Wallet({
                        user: req.user?.id || null,
                        address: addr,
                        scanType: "BATCH_SCAN",
                        balance: data.balance,
                        balanceUSD: data.balanceUSD,
                        transactions: data.n_tx,
                        totalReceived: data.totalReceived,
                        totalSent: data.totalSent,
                        riskScore: risk.riskScore,
                        riskLevel: risk.riskLevel,
                        scoreBreakdown: risk.breakdown,
                        ruleTriggers: risk.ruleTriggers,
                        entityTag: data.entityTag,
                        isPublic: true,
                        scannedAt: new Date(),
                    });

                    await scan.save();

                    return {
                        address: addr,
                        scanId: scan._id.toString(),
                        success: true,
                        balance: data.balance,
                        balanceUSD: data.balanceUSD,
                        transactions: data.n_tx,
                        totalReceived: data.totalReceived,
                        totalSent: data.totalSent,
                        riskScore: risk.riskScore,
                        riskLevel: risk.riskLevel,
                        breakdown: risk.breakdown,
                        entityTag: data.entityTag,
                        activeRulesCount: risk.ruleTriggers.length,
                        topRiskFactor: risk.ruleTriggers[0]?.title || "Standard activity",
                    };
                } catch (err) {
                    return {
                        address: addr,
                        success: false,
                        error: err.message,
                    };
                }
            });

            const chunkResults = await Promise.all(chunkPromises);
            results.push(...chunkResults);
        }

        // Audit Log
        await logActivity({
            userId: req.user?.id || null,
            userEmail: req.user?.email || "guest@cryptoscope.ai",
            action: "BATCH_SCAN_EXECUTED",
            resourceType: "WALLET",
            details: { requestedCount: addresses.length, successfulCount: results.filter((r) => r.success).length },
            status: "SUCCESS",
            req,
        });

        res.json({
            success: true,
            totalRequested: addresses.length,
            scannedCount: results.length,
            invalidCount: (req.invalidAddresses || []).length,
            invalidAddresses: req.invalidAddresses || [],
            results,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message || "Batch scan execution failed.",
        });
    }
};

// =============================================================================
// PAGINATED TRANSACTIONS
// =============================================================================
exports.getTransactions = async (req, res) => {
    try {
        const address = req.params.address;
        const afterTxid = req.query.after || null;

        const result = await getPaginatedTransactions(address, afterTxid);
        res.json({
            success: true,
            ...result,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// TRANSACTION FUND FLOW GRAPH DATA
// =============================================================================
exports.getWalletGraph = async (req, res) => {
    try {
        const address = req.params.address;
        const data = await getWalletData(address);

        res.json({
            success: true,
            address,
            graphData: data.graphData,
            entityTag: data.entityTag,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// HISTORICAL RISK TREND FOR WALLET (From MongoDB)
// =============================================================================
exports.getRiskTrend = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const address = req.params.address;
        const scans = await Wallet.find({ address })
            .sort({ createdAt: 1 })
            .limit(30)
            .select("riskScore riskLevel createdAt scoreBreakdown balance transactions");

        if (!scans || scans.length === 0) {
            const data = await getWalletData(address);
            const risk = calculateRisk(data);
            return res.json({
                success: true,
                address,
                trend: [
                    {
                        date: new Date().toISOString(),
                        riskScore: risk.riskScore,
                        riskLevel: risk.riskLevel,
                        balance: data.balance,
                    },
                ],
            });
        }

        res.json({
            success: true,
            address,
            trend: scans.map((s) => ({
                id: s._id,
                date: s.createdAt,
                riskScore: s.riskScore,
                riskLevel: s.riskLevel,
                balance: s.balance,
                transactions: s.transactions,
                breakdown: s.scoreBreakdown,
            })),
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// PUBLIC SHAREABLE REPORT (Read from MongoDB)
// =============================================================================
exports.getPublicReport = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const identifier = req.params.id;
        let scan = null;

        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            scan = await Wallet.findById(identifier);
        }

        if (!scan) {
            scan = await Wallet.findOne({ address: identifier }).sort({ createdAt: -1 });
        }

        if (!scan) {
            const data = await getWalletData(identifier);
            const risk = calculateRisk(data);
            const btcPrice = await getLiveBtcPriceUSD();

            return res.json({
                success: true,
                report: {
                    address: data.address,
                    balance: data.balance,
                    balanceUSD: Number((data.balance * btcPrice).toFixed(2)),
                    totalReceived: data.totalReceived,
                    totalSent: data.totalSent,
                    transactionCount: data.n_tx,
                    riskScore: risk.riskScore,
                    riskLevel: risk.riskLevel,
                    breakdown: risk.breakdown,
                    ruleTriggers: risk.ruleTriggers,
                    aiReport: risk.aiReport,
                    entityTag: data.entityTag,
                    clustering: data.clustering,
                    transactions: data.transactions.slice(0, 15),
                    graphData: data.graphData,
                    createdAt: data.scannedAt,
                },
            });
        }

        res.json({
            success: true,
            report: scan,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// USER SCAN HISTORY (Strictly Isolated to Authenticated User)
// =============================================================================
exports.getHistory = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const query = req.user ? { user: req.user.id } : { isPublic: true };
        const history = await Wallet.find(query).sort({ createdAt: -1 }).limit(50);

        res.json({
            success: true,
            count: history.length,
            history,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// DASHBOARD STATISTICS (Aggregated directly from MongoDB)
// =============================================================================
exports.getDashboardStats = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const [totalScans, highRisk, mediumRisk, lowRisk, allScans] = await Promise.all([
            Wallet.countDocuments(),
            Wallet.countDocuments({ riskLevel: "High" }),
            Wallet.countDocuments({ riskLevel: "Medium" }),
            Wallet.countDocuments({ riskLevel: "Low" }),
            Wallet.find({}).select("riskScore transactions").limit(100),
        ]);

        const avgScore =
            allScans.length > 0 ? Math.round(allScans.reduce((sum, w) => sum + (w.riskScore || 0), 0) / allScans.length) : 42;

        const totalTransactions = allScans.reduce((sum, w) => sum + (w.transactions || 0), 0);

        res.json({
            success: true,
            totalScans,
            highRiskWallets: highRisk,
            mediumRiskWallets: mediumRisk,
            lowRiskWallets: lowRisk,
            averageRiskScore: avgScore,
            totalTransactions,
            riskDistribution: {
                high: highRisk,
                medium: mediumRisk,
                low: lowRisk,
            },
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};

// =============================================================================
// WATCHLIST MANAGEMENT (Strict MongoDB Persistence per User)
// =============================================================================
exports.getWatchlist = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    if (!req.user) {
        return res.json({ success: true, watchlist: [] });
    }

    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            watchlist: user?.watchlist || [],
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.addToWatchlist = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required to save watched wallets." });
    }

    try {
        const { address, label } = req.body;
        if (!address) {
            return res.status(400).json({ success: false, message: "Wallet address is required." });
        }

        let initialScore = 0;
        let initialLevel = "Low";

        try {
            const data = await getWalletData(address);
            const risk = calculateRisk(data);
            initialScore = risk.riskScore;
            initialLevel = risk.riskLevel;
        } catch {
            // baseline
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.watchlist = user.watchlist.filter((w) => w.address.toLowerCase() !== address.toLowerCase());
        const newItem = {
            address,
            label: label || "Monitored Address",
            lastRiskScore: initialScore,
            lastRiskLevel: initialLevel,
            addedAt: new Date(),
        };

        user.watchlist.push(newItem);
        await user.save();

        // Audit Logging
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "WATCHLIST_ADDED",
            resourceType: "WATCHLIST",
            resourceId: address,
            details: { label: newItem.label, score: initialScore },
            status: "SUCCESS",
            req,
        });

        // Real-time Event
        realtimeService.emitWatchlistUpdated(user._id.toString(), "ADDED", newItem);

        res.json({
            success: true,
            message: "Wallet added to watchlist and persisted to MongoDB.",
            watchlist: user.watchlist,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.removeFromWatchlist = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    try {
        const address = req.params.address;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.watchlist = user.watchlist.filter((w) => w.address.toLowerCase() !== address.toLowerCase());
        await user.save();

        // Audit Logging
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "WATCHLIST_REMOVED",
            resourceType: "WATCHLIST",
            resourceId: address,
            status: "SUCCESS",
            req,
        });

        // Real-time Event
        realtimeService.emitWatchlistUpdated(user._id.toString(), "REMOVED", { address });

        res.json({
            success: true,
            message: "Wallet removed from watchlist.",
            watchlist: user.watchlist,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.rescanWatchlist = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    if (!req.user) {
        return res.status(401).json({ success: false, message: "Authentication required." });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const changes = [];
        for (let item of user.watchlist) {
            try {
                const data = await getWalletData(item.address);
                const risk = calculateRisk(data);
                const scoreDiff = risk.riskScore - item.lastRiskScore;

                if (scoreDiff !== 0) {
                    changes.push({
                        address: item.address,
                        label: item.label,
                        oldScore: item.lastRiskScore,
                        newScore: risk.riskScore,
                        oldLevel: item.lastRiskLevel,
                        newLevel: risk.riskLevel,
                        diff: scoreDiff,
                    });
                }

                item.lastRiskScore = risk.riskScore;
                item.lastRiskLevel = risk.riskLevel;
            } catch {
                // Ignore individual network blips
            }
        }

        await user.save();

        // Audit Logging
        await logActivity({
            userId: user._id,
            userEmail: user.email,
            action: "WATCHLIST_RESCANNED",
            resourceType: "WATCHLIST",
            details: { count: user.watchlist.length, changesCount: changes.length },
            status: "SUCCESS",
            req,
        });

        res.json({
            success: true,
            message: "Watchlist re-scanned and updated in MongoDB.",
            changesCount: changes.length,
            changes,
            watchlist: user.watchlist,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// =============================================================================
// USER ACTIVITIES & AUDIT LOGS (From MongoDB)
// =============================================================================
exports.getUserActivities = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const query = req.user ? { userId: req.user.id } : {};
        const activities = await UserActivity.find(query).sort({ createdAt: -1 }).limit(50);

        res.json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// =============================================================================
// SECURITY ALERTS / INCIDENTS (From MongoDB)
// =============================================================================
exports.getSecurityAlerts = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const alerts = await SecurityAlert.find({}).sort({ createdAt: -1 }).limit(50);

        res.json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.simulateSecurityAlert = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const incidentId = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const sampleAddress = "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo";

        const alertDoc = new SecurityAlert({
            incidentId,
            userId: req.user?.id || null,
            address: sampleAddress,
            threatCategory: "High-Velocity Burst Churn Alert",
            ruleTrigger: "RULE-PAT-02 (Rapid Churn > 50 TXs/hr)",
            severity: "HIGH",
            riskScore: 78,
            status: "AUTO-FLAGGED",
            amount: "5.45 BTC",
            details: "Mempool detector captured synthetic anomalous burst transfer pattern targeting unverified counterparty.",
        });

        await alertDoc.save();

        // Broadcast Real-time Event
        realtimeService.emitAlertTriggered(alertDoc);

        // Audit Log
        await logActivity({
            userId: req.user?.id || null,
            userEmail: req.user?.email || "guest@cryptoscope.ai",
            action: "SECURITY_ALERT_TRIGGERED",
            resourceType: "ALERT",
            resourceId: incidentId,
            details: { address: sampleAddress, severity: "HIGH" },
            status: "SUCCESS",
            req,
        });

        res.json({
            success: true,
            message: "Synthetic intrusion alert saved to MongoDB and broadcasted via real-time SSE stream.",
            alert: alertDoc,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};