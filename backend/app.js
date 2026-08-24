const express = require("express");
const cors = require("cors");

const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// =============================================================================
// Security & Parsing Middleware
// =============================================================================
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Global general API rate limiter
app.use("/api", apiLimiter);

// Health check endpoints
app.get("/", (req, res) => {
    res.json({
        success: true,
        platform: "CryptoScope AI",
        version: "2.0.0",
        engine: "Deterministic 5-Axis Heuristic Security Engine",
        status: "Operational 🛡️",
        timestamp: new Date().toISOString(),
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        platform: "CryptoScope AI",
        version: "2.0.0",
        engine: "Deterministic 5-Axis Heuristic Security Engine",
        status: "Operational 🛡️",
        timestamp: new Date().toISOString(),
    });
});

// =============================================================================
// API Routes
// =============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler for unmatched API routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
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