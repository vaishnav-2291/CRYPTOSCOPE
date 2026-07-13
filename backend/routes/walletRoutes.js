const express = require("express");

const router = express.Router();

const {
    fetchWallet,
    getHistory,
    getDashboardStats
} = require("../controllers/walletController");

const authMiddleware = require("../middleware/authMiddleware");


// Dashboard Stats
router.get("/dashboard/stats", authMiddleware, getDashboardStats);


// Wallet History
router.get("/history/all", authMiddleware, getHistory);


// Analyze Wallet
router.get("/:address", authMiddleware, fetchWallet);


module.exports = router;