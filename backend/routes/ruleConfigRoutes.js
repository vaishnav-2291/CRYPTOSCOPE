/**
 * CryptoScope AI — Configurable Risk Rule Routes (/api/risk-rules/*)
 */

const express = require("express");
const router = express.Router();
const ruleConfigController = require("../controllers/ruleConfigController");
const { authMiddleware, optionalAuth } = require("../middleware/authMiddleware");

router.get("/config", optionalAuth, ruleConfigController.getUserConfig);
router.put("/config", authMiddleware, ruleConfigController.updateUserConfig);
router.post("/reset", authMiddleware, ruleConfigController.resetUserConfig);

module.exports = router;
