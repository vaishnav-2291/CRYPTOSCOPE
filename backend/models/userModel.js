const mongoose = require("mongoose");

const watchlistItemSchema = new mongoose.Schema(
    {
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
            default: 10,
        },
    },
    { _id: true }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 100,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId && (!this.authProvider || this.authProvider === "local");
            },
        },
        googleId: {
            type: String,
            default: null,
            sparse: true,
            index: true,
        },
        authProvider: {
            type: String,
            enum: ["local", "google", "local+google"],
            default: "local",
            index: true,
        },
        avatar: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: ["user", "admin", "analyst"],
            default: "user",
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "suspended", "pending"],
            default: "active",
        },
        watchlist: [watchlistItemSchema],
        lastLogin: {
            type: Date,
            default: null,
        },
        lastLoginIp: {
            type: String,
            default: null,
        },
        refreshToken: {
            type: String,
            default: null,
        },
        resetPasswordOtp: {
            type: String,
            default: null,
        },
        resetPasswordOtpExpires: {
            type: Date,
            default: null,
        },
        resetPasswordOtpAttempts: {
            type: Number,
            default: 0,
        },
        resetPasswordToken: {
            type: String,
            default: null,
        },
        resetPasswordExpires: {
            type: Date,
            default: null,
        },
        passwordChangedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookup and integrity
userSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("User", userSchema);