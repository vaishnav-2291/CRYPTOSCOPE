const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const adminRoutes = require("./routes/adminRoutes");
const realtimeRoutes = require("./routes/realtimeRoutes");
const realtimeService = require("./services/realtimeService");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// =============================================================================
// Security & Parsing Middleware
// =============================================================================
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                return callback(null, true);
            }
            callback(null, true);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Global general API rate limiter
app.use("/api", apiLimiter);

// Comprehensive Subsystem Health Check Endpoint
app.get("/api/health", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    const dbState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] || "unknown";

    const health = {
        success: isDbConnected,
        platform: "CryptoScope AI",
        version: "2.0.0",
        engine: "Deterministic 5-Axis Heuristic Security Engine",
        status: isDbConnected ? "Operational 🛡️" : "Degraded - Database Disconnected",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        subsystems: {
            api: {
                status: "healthy",
                port: process.env.PORT || 3000,
            },
            database: {
                provider: "MongoDB Atlas",
                status: isDbConnected ? "connected" : "disconnected",
                connectionState: dbState,
                host: mongoose.connection.host ? mongoose.connection.host.replace(/\..*$/, "") : "unresolved",
            },
            realtime: {
                status: "active",
                protocol: "Server-Sent Events (SSE)",
                activeClients: realtimeService.getClientCount(),
            },
            heuristicsEngine: {
                status: "operational",
                version: "2.0.0",
                rulesCount: 14,
            },
        },
    };

    const statusCode = isDbConnected ? 200 : 503;
    res.status(statusCode).json(health);
});

// =============================================================================
// API Routes
// =============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/realtime", realtimeRoutes);

// =============================================================================
// Static Frontend Production Serving & SPA Fallback (Express 5 Compatible)
// =============================================================================
const frontendDist = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // Express 5 SPA catch-all middleware
    app.use((req, res, next) => {
        if (req.method === "GET" && !req.path.startsWith("/api/")) {
            return res.sendFile(path.join(frontendDist, "index.html"));
        }
        next();
    });
} else {
    app.get("/", (req, res) => {
        res.json({
            success: true,
            platform: "CryptoScope AI",
            version: "2.0.0",
            engine: "Deterministic 5-Axis Heuristic Security Engine",
            status: "Operational 🛡️",
            timestamp: new Date().toISOString(),
            message: "CryptoScope AI API Gateway Running.",
        });
    });
}

// 404 handler for unmatched API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `API Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
});

// Global central error handler
app.use((err, req, res, next) => {
    console.error("Central API Error:", err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error occurred.",
        error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

module.exports = app;