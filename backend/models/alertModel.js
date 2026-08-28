const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        incidentId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        threatCategory: {
            type: String,
            required: true,
            index: true,
        },
        ruleTrigger: {
            type: String,
            required: true,
        },
        severity: {
            type: String,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"],
            default: "MEDIUM",
            index: true,
        },
        riskScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ["AUTO-QUARANTINED", "ESCALATED_L2", "UNDER_INVESTIGATION", "RESOLVED", "AUTO-FLAGGED"],
            default: "UNDER_INVESTIGATION",
            index: true,
        },
        amount: {
            type: String,
            default: "0.00 BTC",
        },
        details: {
            type: String,
            required: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        isSimulated: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

alertSchema.index({ severity: 1, createdAt: -1 });
alertSchema.index({ address: 1, createdAt: -1 });

module.exports = mongoose.model("SecurityAlert", alertSchema);
