/**
 * CryptoScope AI — Configurable Risk Rule Engine Service (Feature #17)
 * 
 * Allows compliance analysts to tune key risk thresholds according to organizational risk appetite.
 * Only the chosen trigger numbers are stored in MongoDB — live on-chain evaluation remains 100% real-time.
 */

const RiskRuleConfig = require("../../models/riskRuleConfigModel");

const PRESETS = {
    STRICT_COMPLIANCE: {
        presetName: "STRICT_COMPLIANCE",
        dustThresholdSat: 1000,
        feeOverpayMultiplier: 1.5,
        maxPropagationHops: 3,
        cddAlertThreshold: 20,
        whaleThresholdBtc: 0.5,
        mixerStrictness: "STRICT",
        customWeights: {
            transactionVelocity: 30,
            balanceExposure: 20,
            flowPattern: 20,
            activityAge: 10,
            entityAssociation: 20,
        },
    },
    BASEL_AML: {
        presetName: "BASEL_AML",
        dustThresholdSat: 546,
        feeOverpayMultiplier: 2.0,
        maxPropagationHops: 2,
        cddAlertThreshold: 50,
        whaleThresholdBtc: 1.0,
        mixerStrictness: "STANDARD",
        customWeights: {
            transactionVelocity: 25,
            balanceExposure: 20,
            flowPattern: 20,
            activityAge: 15,
            entityAssociation: 20,
        },
    },
    LOW_FALSE_POSITIVE: {
        presetName: "LOW_FALSE_POSITIVE",
        dustThresholdSat: 300,
        feeOverpayMultiplier: 3.5,
        maxPropagationHops: 1,
        cddAlertThreshold: 200,
        whaleThresholdBtc: 5.0,
        mixerStrictness: "RELAXED",
        customWeights: {
            transactionVelocity: 20,
            balanceExposure: 20,
            flowPattern: 20,
            activityAge: 20,
            entityAssociation: 20,
        },
    },
};

class RuleConfigService {
    /**
     * Get user config or return standard baseline
     */
    async getUserConfig(userId) {
        if (!userId) return PRESETS.BASEL_AML;

        let config = await RiskRuleConfig.findOne({ userId });
        if (!config) {
            config = await RiskRuleConfig.create({
                userId,
                ...PRESETS.BASEL_AML,
            });
        }
        return config;
    }

    /**
     * Update user custom thresholds
     */
    async updateUserConfig(userId, updates) {
        let config = await RiskRuleConfig.findOne({ userId });
        if (!config) {
            config = new RiskRuleConfig({ userId });
        }

        if (updates.presetName && PRESETS[updates.presetName]) {
            Object.assign(config, PRESETS[updates.presetName]);
            config.presetName = updates.presetName;
        } else {
            if (updates.dustThresholdSat !== undefined) config.dustThresholdSat = Math.max(100, Math.min(5000, updates.dustThresholdSat));
            if (updates.feeOverpayMultiplier !== undefined) config.feeOverpayMultiplier = Math.max(1.1, Math.min(10.0, updates.feeOverpayMultiplier));
            if (updates.maxPropagationHops !== undefined) config.maxPropagationHops = Math.max(1, Math.min(3, updates.maxPropagationHops));
            if (updates.cddAlertThreshold !== undefined) config.cddAlertThreshold = Math.max(5, Math.min(2000, updates.cddAlertThreshold));
            if (updates.whaleThresholdBtc !== undefined) config.whaleThresholdBtc = Math.max(0.1, Math.min(100.0, updates.whaleThresholdBtc));
            if (updates.mixerStrictness) config.mixerStrictness = updates.mixerStrictness;
            if (updates.customWeights) config.customWeights = updates.customWeights;
            config.presetName = "CUSTOM";
        }

        await config.save();
        return config;
    }

    /**
     * Reset config to system default (BASEL_AML)
     */
    async resetUserConfig(userId) {
        return this.updateUserConfig(userId, { presetName: "BASEL_AML" });
    }

    /**
     * Calculate tuned risk score given live data and user's custom thresholds
     */
    simulateTunedScore(liveAuditData, userConfig) {
        if (!liveAuditData) return 0;

        let adjustedScore = liveAuditData.explainability?.riskScore || 0;
        const config = userConfig || PRESETS.BASEL_AML;

        // Tune Dusting sensitivity
        const unspentDust = liveAuditData.dusting?.metrics?.unspentDustUtxosCount || 0;
        if (unspentDust > 0 && config.dustThresholdSat > 546) {
            adjustedScore = Math.min(100, adjustedScore + 5);
        }

        // Tune Fee urgency
        const feeOverpayRatio = liveAuditData.feeUrgency?.metrics?.feeOverpayRatio || 1.0;
        if (feeOverpayRatio >= config.feeOverpayMultiplier) {
            adjustedScore = Math.min(100, adjustedScore + 10);
        }

        // Tune CDD Dormancy
        const peakCdd = liveAuditData.cdd?.metrics?.maxSingleTxCdd || 0;
        if (peakCdd >= config.cddAlertThreshold) {
            adjustedScore = Math.min(100, adjustedScore + 15);
        }

        return Math.min(100, adjustedScore);
    }
}

module.exports = new RuleConfigService();
