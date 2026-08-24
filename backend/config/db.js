const mongoose = require("mongoose");
const dns = require("dns");

// Force standard DNS resolution if needed for Atlas SRV
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
    // Ignore on restricted environments
}

let isConnecting = false;

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
        return true;
    } catch (err) {
        isConnecting = false;
        console.error("❌ MongoDB Connection Error:", err.message);
        return false;
    }
};

// Event Listeners for MongoDB Lifecycle
mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB Disconnected. Reconnection will be attempted automatically by Mongoose driver.");
});

mongoose.connection.on("reconnected", () => {
    console.log("🔄 MongoDB Reconnected Successfully.");
});

mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB Internal Error:", err.message);
});

module.exports = connectDB;