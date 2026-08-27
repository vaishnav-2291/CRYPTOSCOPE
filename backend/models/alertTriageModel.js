const mongoose = require("mongoose");

const alertTriageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        alertType: {
            type: String,
            enum: [
                "NEW_TRANSACTION",
                "DUSTING_ATTACK",
                "MIXER_INTERACTION",
                "SANCTION_PROXIMITY",
                "CDD_DORMANCY_SPIKE",
                "PRIORITY_FEE_OVERPAY",
                "WHALE_TRANSFER",
            ],
            required: true,
        },
        txid: {
            type: String,
            default: null,
        },
        severityScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            index: true,
        },
        triagePriority: {
            type: String,
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            default: "MEDIUM",
            index: true,
        },
        triageStatus: {
            type: String,
            enum: ["UNREAD", "INVESTIGATING", "ESCALATED_TO_CASE", "DISMISSED"],
            default: "UNREAD",
            index: true,
        },
        caseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "InvestigationCase",
            default: null,
        },
        title: {
            type: String,
            required: true,
        },
        summary: {
            type: String,
            default: "",
        },
        triggeredSignals: {
            type: [mongoose.Schema.Types.Mixed],
            default: [],
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

alertTriageSchema.index({ userId: 1, severityScore: -1, createdAt: -1 });

module.exports = mongoose.model("AlertTriage", alertTriageSchema);
