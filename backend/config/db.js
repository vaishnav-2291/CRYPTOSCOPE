const mongoose = require("mongoose");
const dns = require("dns");

// Force Google DNS for MongoDB Atlas SRV resolution
try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch {
    // Ignore DNS override errors on restricted environments
}

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cryptoscope";

    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 3000,
        });
        console.log("✅ MongoDB Connected Successfully");
        return true;
    } catch (err) {
        console.warn(
            "⚠️ MongoDB Connection Notice: Could not establish connection to Mongo at",
            mongoUri,
            "- Running with in-memory state & live blockchain RPC mode."
        );
        return false;
    }
};

module.exports = connectDB;