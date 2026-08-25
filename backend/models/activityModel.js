const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },
        userEmail: {
            type: String,
            default: "guest@cryptoscope.ai",
            index: true,
        },
        action: {
            type: String,
            required: true,
            enum: [
                "USER_REGISTERED",
                "USER_LOGIN",
                "GOOGLE_LOGIN",
                "USER_REGISTERED_VIA_GOOGLE",
                "GOOGLE_ACCOUNT_LINKED",
                "USER_LOGOUT",
                "PROFILE_UPDATED",
                "PASSWORD_RESET_REQUESTED",
                "PASSWORD_RESET_COMPLETED",
                "PASSWORD_RESET",
                "PASSWORD_CHANGED",
                "WALLET_SCANNED",
                "BATCH_SCAN_EXECUTED",
                "WATCHLIST_ADDED",
                "WATCHLIST_REMOVED",
                "WATCHLIST_RESCANNED",
                "SECURITY_ALERT_TRIGGERED",
                "REPORT_EXPORTED",
                "ADMIN_ACTION",
            ],
            index: true,
        },
        resourceType: {
            type: String,
            enum: ["WALLET", "USER", "WATCHLIST", "ALERT", "REPORT", "SYSTEM"],
            default: "WALLET",
            index: true,
        },
        resourceId: {
            type: String,
            default: null,
            trim: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED", "WARNING"],
            default: "SUCCESS",
            index: true,
        },
        ipAddress: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for audit timeline and user activity isolation
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ resourceType: 1, resourceId: 1 });

module.exports = mongoose.model("UserActivity", activitySchema);
