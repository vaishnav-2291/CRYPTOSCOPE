/**
 * CryptoScope AI — Configurable Risk Rule Engine Controller
 */

const ruleConfigService = require("../services/forensics/ruleConfigService");

exports.getUserConfig = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const config = await ruleConfigService.getUserConfig(userId);
        return res.status(200).json({ success: true, config });
    } catch (err) {
        console.error("[RuleConfigController] Get config error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to load risk rule configuration." });
    }
};

exports.updateUserConfig = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const config = await ruleConfigService.updateUserConfig(userId, req.body);
        return res.status(200).json({ success: true, config });
    } catch (err) {
        console.error("[RuleConfigController] Update config error:", err.message);
        return res.status(400).json({ success: false, message: err.message || "Failed to update risk rule configuration." });
    }
};

exports.resetUserConfig = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const config = await ruleConfigService.resetUserConfig(userId);
        return res.status(200).json({ success: true, config });
    } catch (err) {
        console.error("[RuleConfigController] Reset config error:", err.message);
        return res.status(500).json({ success: false, message: err.message || "Failed to reset risk rule configuration." });
    }
};
