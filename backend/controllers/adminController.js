const Wallet = require("../models/walletModel");
const User = require("../models/userModel");
const UserActivity = require("../models/activityModel");
const SecurityAlert = require("../models/alertModel");
const { getAllEntities } = require("../services/entityService");
const cacheService = require("../services/cacheService");
const realtimeService = require("../services/realtimeService");
const mongoose = require("mongoose");

function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Platform-wide Admin Statistics (From MongoDB)
 */
exports.getAdminStats = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const [totalScans, totalUsers, totalActivities, totalAlerts, allWallets] = await Promise.all([
            Wallet.countDocuments(),
            User.countDocuments(),
            UserActivity.countDocuments(),
            SecurityAlert.countDocuments(),
            Wallet.find({}).select("riskLevel riskScore createdAt transactions").limit(200),
        ]);

        const highRisk = allWallets.filter((w) => w.riskLevel === "High").length;
        const mediumRisk = allWallets.filter((w) => w.riskLevel === "Medium").length;
        const lowRisk = allWallets.filter((w) => w.riskLevel === "Low").length;

        const avgScore =
            allWallets.length > 0
                ? Math.round(allWallets.reduce((s, w) => s + (w.riskScore || 0), 0) / allWallets.length)
                : 42;

        const entities = getAllEntities();
        const cacheDiagnostics = cacheService.getStats();

        res.json({
            success: true,
            platformStats: {
                totalScans,
                totalUsers,
                totalActivities,
                totalAlerts,
                averageRiskScore: avgScore,
                riskDistribution: {
                    high: highRisk,
                    medium: mediumRisk,
                    low: lowRisk,
                },
                entityCatalogCount: entities.length,
                activeSSEConnections: realtimeService.getClientCount(),
                cacheDiagnostics,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * List Known Entities Catalog
 */
exports.getEntityCatalog = async (req, res) => {
    try {
        const entities = getAllEntities();
        res.json({
            success: true,
            count: entities.length,
            entities,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get Recent Platform-Wide Scans (Audit Log)
 */
exports.getAuditScans = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const scans = await Wallet.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("user", "name email role");

        res.json({
            success: true,
            count: scans.length,
            scans,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

/**
 * Get Platform-Wide User Activity Audit Trail
 */
exports.getAuditActivities = async (req, res) => {
    if (!isDbConnected()) {
        return res.status(503).json({ success: false, message: "Database unavailable." });
    }

    try {
        const activities = await UserActivity.find({})
            .sort({ createdAt: -1 })
            .limit(100)
            .populate("userId", "name email role");

        res.json({
            success: true,
            count: activities.length,
            activities,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
