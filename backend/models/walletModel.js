const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
    },
    address: {
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    network: {
        type: String,
        default: "bitcoin",
    },
    balance: {
        type: Number,
        default: 0,
    },
    totalReceived: {
        type: Number,
        default: 0,
    },
    totalSent: {
        type: Number,
        default: 0,
    },
    transactions: {
        type: Number,
        default: 0,
    },
    riskScore: {
        type: Number,
        default: 0,
    },
    riskLevel: {
        type: String,
        default: "Low",
    },
    riskFactors: {
        type: [String],
        default: [],
    },
    aiReport: {
        type: String,
        default: "",
    },
    scoreBreakdown: {
        transactionRisk: { type: Number, default: 0 },
        balanceRisk: { type: Number, default: 0 },
        patternRisk: { type: Number, default: 0 },
        activityRisk: { type: Number, default: 0 },
        entityRisk: { type: Number, default: 0 },
    },
    ruleTriggers: [
        {
            id: String,
            dimension: String,
            severity: String,
            title: String,
            description: String,
            metric: String,
            points: Number,
            recommendation: String,
        },
    ],
    entityTag: {
        name: String,
        category: String,
        riskWeight: Number,
        icon: String,
        isSanctioned: Boolean,
        isMixer: Boolean,
        description: String,
    },
    clusteringInfo: {
        clusterSize: Number,
        confidence: String,
        heuristic: String,
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

module.exports = mongoose.model("Wallet", walletSchema);