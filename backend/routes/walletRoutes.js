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

// 1. Public Shareable Report Endpoint (Allows unauthenticated viewing with optional auth)
router.get("/report/:id", optionalAuth, getPublicReport);

// 2. All Private Wallet Operations, Scanning, History, Activities, Watchlist, and Alerts require authentication
router.use(authMiddleware);

// Dashboard & History (User Scoped)
router.get("/dashboard/stats", getDashboardStats);
router.get("/history/all", getHistory);
router.get("/activities", getUserActivities);

// Security Alerts / Incidents (User Scoped, Admin simulation)
router.get("/alerts", getSecurityAlerts);
router.post("/alerts/simulate", requireAdmin, simulateSecurityAlert);

// Watchlist Management (User Scoped)
router.get("/watchlist", getWatchlist);
router.post("/watchlist", addToWatchlist);
router.post("/watchlist/rescan", rescanWatchlist);
router.delete("/watchlist/:address", removeFromWatchlist);

// Multi-Address Batch Scanning
router.post("/batch-scan", scanLimiter, validateBatchAddresses, batchScan);

// Address Deep-Dive Sub-resources (Authenticated)
router.get("/:address/transactions", validateAddressParam, getTransactions);
router.get("/:address/graph", validateAddressParam, getWalletGraph);
router.get("/:address/trend", validateAddressParam, getRiskTrend);

// Main Single Wallet Scan Endpoint
router.get("/:address", scanLimiter, validateAddressParam, fetchWallet);

module.exports = router;