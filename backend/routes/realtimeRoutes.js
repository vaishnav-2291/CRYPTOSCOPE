const express = require("express");
const router = express.Router();
const realtimeService = require("../services/realtimeService");
const { optionalAuth } = require("../middleware/authMiddleware");

/**
 * SSE Real-time Events Stream
 * Connects frontend clients to live database-driven alerts, scan completions, and activity feeds
 */
router.get("/events", optionalAuth, (req, res) => {
    realtimeService.addClient(req, res, req.user);
});

/**
 * Active SSE Client Stats (Admin/Telemetry)
 */
router.get("/status", (req, res) => {
    res.json({
        success: true,
        activeClients: realtimeService.getClientCount(),
        protocol: "Server-Sent Events (SSE)",
        status: "Online",
    });
});

module.exports = router;
