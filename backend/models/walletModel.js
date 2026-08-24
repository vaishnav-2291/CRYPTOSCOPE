const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            index: true,
        },
        address: {
            type: String,
            required: [true, "Bitcoin address is required"],
            trim: true,
            index: true,
        },
        network: {
            type: String,
            default: "bitcoin",
            index: true,
        },
        scanType: {
            type: String,
            enum: ["SINGLE_SCAN", "BATCH_SCAN", "WATCHLIST_RESCAN", "MANUAL_INVESTIGATION"],
            default: "SINGLE_SCAN",
        },
        balance: {
            type: Number,
            default: 0,
        },
        balanceUSD: {
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
        unconfirmedTxCount: {
            type: Number,
            default: 0,
        },
        riskScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
            index: true,
        },
        riskLevel: {
            type: String,
            enum: ["Low", "Medium", "High"],
            required: true,
            index: true,
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
                id: { type: String, required: true },
                dimension: { type: String },
                severity: { type: String, default: "INFO" },
                title: { type: String },
                description: { type: String },
                metric: { type: String },
                points: { type: Number, default: 0 },
                recommendation: { type: String },
            },
        ],
        entityTag: {
            name: { type: String, default: null },
            category: { type: String, default: null },
            riskWeight: { type: Number, default: 0 },
            icon: { type: String, default: null },
            isSanctioned: { type: Boolean, default: false },
            isMixer: { type: Boolean, default: false },
            description: { type: String, default: null },
        },
        clusteringInfo: {
            clusterSize: { type: Number, default: 1 },
            confidence: { type: String, default: "Low" },
            heuristic: { type: String, default: "None" },
            associatedAddresses: [
                {
                    address: String,
                    entityTag: mongoose.Schema.Types.Mixed,
                },
            ],
        },
        graphData: {
            nodes: [mongoose.Schema.Types.Mixed],
            edges: [mongoose.Schema.Types.Mixed],
        },
        isPublic: {
            type: Boolean,
            default: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["COMPLETED", "FAILED", "PENDING"],
            default: "COMPLETED",
        },
        errorMessage: {
            type: String,
            default: null,
        },
        scannedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for optimal querying and data isolation
walletSchema.index({ user: 1, createdAt: -1 });
walletSchema.index({ address: 1, createdAt: -1 });
walletSchema.index({ riskLevel: 1, createdAt: -1 });
walletSchema.index({ user: 1, address: 1 });

module.exports = mongoose.model("Wallet", walletSchema);