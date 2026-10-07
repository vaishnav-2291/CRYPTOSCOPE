const mongoose = require("mongoose");
const dns = require("dns");
const path = require("path");

// Ensure environment variables are loaded if db.js is imported directly
if (!process.env.MONGO_URI) {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
    // Ignore on restricted environments
}

let retryTimer = null;
let isConnecting = false;
let retryDelay = 5000;

function scheduleReconnect() {
    if (process.env.NODE_ENV === "test") return;
    if (retryTimer || mongoose.connection.readyState === 1) return;
    retryTimer = setTimeout(async () => {
        retryTimer = null;
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
            if (mongoose.connection.readyState !== 1) {
                retryDelay = Math.min(Math.round(retryDelay * 1.5), 60000);
                scheduleReconnect();
            } else {
                retryDelay = 5000;
            }
        }
    }, retryDelay);
    if (retryTimer && typeof retryTimer.unref === "function") {
        retryTimer.unref();
    }
}

/**
 * Connect to MongoDB with robust error handling and connection lifecycle hooks
 */
const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        console.error("❌ Fatal: MONGO_URI is not defined in environment variables.");
        return false;
    }

    if (mongoose.connection.readyState === 1) {
        return true;
    }

    if (isConnecting) {
        return false;
    }

    try {
        isConnecting = true;
        const sanitizedUri = mongoUri.replace(/:([^@]+)@/, ":****@");
        console.log(`Connecting to MongoDB Atlas (${sanitizedUri})...`);

        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
        });

        console.log("✅ MongoDB Atlas Connected Successfully & Ready for Persistence");
        isConnecting = false;
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        retryDelay = 5000;
        return true;
    } catch (err) {
        isConnecting = false;
        console.error("❌ MongoDB Connection Error:", err.message);
        scheduleReconnect();
        return false;
    }
};

// Event Listeners for MongoDB Lifecycle
mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB Disconnected. Reconnection will be attempted automatically.");
    scheduleReconnect();
});

mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB Reconnected Successfully.");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Internal Error:", err.message);
});

module.exports = connectDB;