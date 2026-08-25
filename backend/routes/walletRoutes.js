const express = require("express");
const router = express.Router();

const {
    fetchWallet,
    batchScan,
    getTransactions,
    getWalletGraph,
    getRiskTrend,
    getPublicReport,
    getHistory,
    getDashboardStats,
    getWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    rescanWatchlist,
    getUserActivities,
    getSecurityAlerts,
    simulateSecurityAlert,
} = require("../controllers/walletController");

const { authMiddleware, optionalAuth, requireAdmin } = require("../middleware/authMiddleware");
const { validateAddressParam, validateBatchAddresses } = require("../middleware/validators");
const { scanLimiter } = require("../middleware/rateLimiter");

// Dashboard & History
router.get("/dashboard/stats", optionalAuth, getDashboardStats);
router.get("/history/all", optionalAuth, getHistory);
router.get("/activities", optionalAuth, getUserActivities);

// Security Alerts / Incidents (Simulation restricted to admin/dev)
router.get("/alerts", optionalAuth, getSecurityAlerts);
router.post("/alerts/simulate", authMiddleware, requireAdmin, simulateSecurityAlert);

// Watchlist Management
router.get("/watchlist", optionalAuth, getWatchlist);
router.post("/watchlist", optionalAuth, addToWatchlist);
router.post("/watchlist/rescan", optionalAuth, rescanWatchlist);
router.delete("/watchlist/:address", optionalAuth, removeFromWatchlist);

// Multi-Address Batch Scanning
router.post("/batch-scan", optionalAuth, scanLimiter, validateBatchAddresses, batchScan);

// Public Read-Only Shareable Report Lookup
router.get("/report/:id", getPublicReport);

// Address Deep-Dive Sub-resources
router.get("/:address/transactions", validateAddressParam, getTransactions);
router.get("/:address/graph", validateAddressParam, getWalletGraph);
router.get("/:address/trend", validateAddressParam, getRiskTrend);

// Main Single Wallet Scan Endpoint
router.get("/:address", optionalAuth, scanLimiter, validateAddressParam, fetchWallet);

module.exports = router;