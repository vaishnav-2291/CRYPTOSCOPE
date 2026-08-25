require("dotenv").config();

const connectDB = require("./config/db");
const { validateJwtConfigOnStartup } = require("./config/jwtConfig");
const app = require("./app");

const PORT = process.env.PORT || 3000;

// Initialize server
async function startServer() {
    // Fail-fast security validation
    validateJwtConfigOnStartup();
    
    await connectDB();

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