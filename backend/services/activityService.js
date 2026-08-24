const UserActivity = require("../models/activityModel");
const realtimeService = require("./realtimeService");
const mongoose = require("mongoose");

function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

/**
 * Log a meaningful user activity to MongoDB and broadcast real-time telemetry
 */
async function logActivity({ userId, userEmail, action, resourceType = "WALLET", resourceId = null, details = {}, status = "SUCCESS", req = null }) {
    if (!isDbConnected()) {
        console.warn(`[ActivityLogger] DB not connected. Activity ${action} cannot be persisted.`);
        return null;
    }

    try {
        let ipAddress = null;
        let userAgent = null;

        if (req) {
            ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null;
            userAgent = req.headers["user-agent"] ? req.headers["user-agent"].substring(0, 200) : null;
        }

        const activity = new UserActivity({
            userId: userId || req?.user?.id || null,
            userEmail: userEmail || req?.user?.email || "guest@cryptoscope.ai",
            action,
            resourceType,
            resourceId,
            details,
            status,
            ipAddress,
            userAgent,
        });

        const saved = await activity.save();

        // Emit real-time event after successful DB write
        realtimeService.emitActivityLogged(saved);

        return saved;
    } catch (err) {
        console.error("Failed to log user activity to MongoDB:", err.message);
        return null;
    }
}

module.exports = {
    logActivity,
};
