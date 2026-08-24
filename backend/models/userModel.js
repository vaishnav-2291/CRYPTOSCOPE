const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema({
    address: {
        type: String,
        required: true,
        trim: true,
    },
    label: {
        type: String,
        default: "Watched Wallet",
        trim: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
    lastRiskScore: {
        type: Number,
        default: 0,
    },
    lastRiskLevel: {
        type: String,
        default: "Unknown",
    },
    notifyThreshold: {
        type: Number,
        default: 10, // Alert if risk score changes by >= 10 points
    },
});

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        watchlist: [watchlistItemSchema],
        refreshToken: {
            type: String,
            default: null,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);