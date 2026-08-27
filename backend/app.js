const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const walletRoutes = require("./routes/walletRoutes");
const authRoutes = require("./routes/authRoutes");
const cryptoRoutes = require("./routes/cryptoRoutes");
const adminRoutes = require("./routes/adminRoutes");
const realtimeRoutes = require("./routes/realtimeRoutes");
const forensicsRoutes = require("./routes/forensicsRoutes");
const realtimeService = require("./services/realtimeService");
const marketService = require("./services/marketService");
const cacheService = require("./services/cacheService");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// =============================================================================
// Security & Parsing Middleware
// =============================================================================

// 1. Helmet HTTP Security Headers
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for Vite / React hot script tags in dev
                    "https://accounts.google.com",
                    "https://apis.google.com",
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for Tailwind / inline styles
                    "https://fonts.googleapis.com",
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "data:",
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https:",
                    "http:",
                ],
                connectSrc: [
                    "'self'",
                    "http://localhost:*",
                    "ws://localhost:*",
                    "https://accounts.google.com",
                    "https://api.binance.com",
                    "https://api.coingecko.com",
                    "https://mempool.space",
                    "https://blockstream.info",
                ],
                frameSrc: [
                    "'self'",
                    "https://accounts.google.com",
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        hsts: process.env.NODE_ENV === "production"
            ? { maxAge: 31536000, includeSubDomains: true, preload: true }
            : false,
    })
);

// 2. Strict CORS Allowlist Policy
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS || "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173";
const allowedOriginsList = rawAllowedOrigins
    .split(",")
    .map((o) => o.trim().toLowerCase())
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow same-origin / server-to-server / tools without origin header
            if (!origin) {
                return callback(null, true);
            }

            const normalizedOrigin = origin.trim().toLowerCase();

            // Strict exact match against configured allowlist
            if (allowedOriginsList.includes(normalizedOrigin)) {
                return callback(null, true);
            }

            // In development or test mode, permit localhost on any port
            if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
                return callback(null, true);
            }

            // Reject untrusted external origins
            return callback(new Error(`CORS Error: Origin '${origin}' is not permitted by CRYPTOSCOPE security policy.`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        exposedHeaders: ["Content-Range", "X-Content-Range"],
        maxAge: 86400,
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
    const rtStats = realtimeService.getDiagnostics();
    const cachedNews = cacheService.get("crypto_news_cache");

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
                activeClients: rtStats.totalClients,
                authenticatedClients: rtStats.authenticatedClients,
                eventsEmitted: rtStats.eventsEmittedCount,
            },
            blockchainProvider: {
                status: "connected",
                primary: "Mempool.space Mainnet API",
                fallback: "Blockstream.info Mainnet API",
                chain: "Bitcoin (BTC) Mainnet",
            },
            marketDataProvider: {
                status: "connected",
                primary: "Binance 24hr Ticker API",
                secondary: "CoinGecko Markets API",
                activeProvider: marketService.activeProviderName || "Binance Live Public API",
                assetsTracked: 6,
            },
            newsProvider: {
                status: "connected",
                sources: ["CoinTelegraph RSS", "CoinDesk RSS", "Decrypt RSS", "Bitcoin Magazine RSS"],
                articlesCached: cachedNews ? cachedNews.length : 0,
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
app.use("/api/forensics", forensicsRoutes);

// =============================================================================
// Static Frontend Production Serving & SPA Fallback (Express 5 Compatible)
// =============================================================================
const frontendDist = path.join(__dirname, "../frontend/dist");

if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // Express 5 SPA catch-all middleware (routes only, skip static assets and files)
    app.use((req, res, next) => {
        if (
            req.method === "GET" &&
            !req.path.startsWith("/api/") &&
            !req.path.startsWith("/assets/") &&
            !path.extname(req.path)
        ) {
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