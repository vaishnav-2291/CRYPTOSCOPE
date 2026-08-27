const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db");
const { validateJwtConfigOnStartup } = require("./config/jwtConfig");
const walletWatcherService = require("./services/forensics/walletWatcherService");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Process-level unhandled rejection & exception guards
process.on("unhandledRejection", (reason) => {
    console.warn("⚠️ [Server] Unhandled Rejection notice:", reason?.message || reason);
});

process.on("uncaughtException", (err) => {
    console.error("❌ [Server] Uncaught Exception notice:", err.message);
});

// Initialize server
async function startServer() {
    // Fail-fast security validation
    validateJwtConfigOnStartup();
    
    await connectDB();

    // Start background on-chain watchlist watcher (SSE & email alerts)
    walletWatcherService.startWatcher(30000);

    const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`🚀 CryptoScope AI Server is actively listening on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
        console.error("Server Error:", err.message);
    });

    // Keep event loop active
    setInterval(() => {}, 60000);
}

startServer();