const mongoose = require("mongoose");

const riskRuleConfigSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        presetName: {
            type: String,
            enum: ["CUSTOM", "STRICT_COMPLIANCE", "BASEL_AML", "LOW_FALSE_POSITIVE"],
            default: "BASEL_AML",
        },
        dustThresholdSat: {
            type: Number,
            default: 546,
            min: 100,
            max: 5000,
        },
        feeOverpayMultiplier: {
            type: Number,
            default: 2.0, // 200% of median mempool fee rate
            min: 1.1,
            max: 10.0,
        },
        maxPropagationHops: {
            type: Number,
            default: 2,
            min: 1,
            max: 3,
        },
        cddAlertThreshold: {
            type: Number,
            default: 50, // Coin days destroyed
            min: 5,
            max: 2000,
        },
        whaleThresholdBtc: {
            type: Number,
            default: 1.0, // BTC
            min: 0.1,
            max: 100.0,
        },
        mixerStrictness: {
            type: String,
            enum: ["STRICT", "STANDARD", "RELAXED"],
            default: "STANDARD",
        },
        customWeights: {
            transactionVelocity: { type: Number, default: 25 },
            balanceExposure: { type: Number, default: 20 },
            flowPattern: { type: Number, default: 20 },
            activityAge: { type: Number, default: 15 },
            entityAssociation: { type: Number, default: 20 },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("RiskRuleConfig", riskRuleConfigSchema);
