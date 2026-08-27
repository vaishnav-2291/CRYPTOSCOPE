/**
 * CryptoScope AI — Forensic Intelligence Routes (/api/forensics/*)
 */

const express = require("express");
const router = express.Router();
const forensicsController = require("../controllers/forensicsController");
const { optionalAuth } = require("../middleware/authMiddleware");

// Round 1 Routes
router.get("/mempool/congestion", forensicsController.getLiveMempoolCongestion);
router.get("/dusting/:address", optionalAuth, forensicsController.getDustingAnalysis);
router.get("/graph/:address", optionalAuth, forensicsController.getFundFlowGraph);
router.get("/cluster/:address", optionalAuth, forensicsController.getClusteringAnalysis);
router.get("/fee-urgency/:address", optionalAuth, forensicsController.getFeeUrgencyAnalysis);
router.get("/sanctions/:address", optionalAuth, forensicsController.getSanctionsCheck);
router.get("/explain/:address", optionalAuth, forensicsController.getExplainabilityReport);

// Round 2 Routes
router.get("/propagation/:address", optionalAuth, forensicsController.getRiskPropagation);
router.get("/reuse/:address", optionalAuth, forensicsController.getAddressReuse);
router.get("/mixer/:address", optionalAuth, forensicsController.getMixerDetection);
router.get("/whale-correlations/:address", optionalAuth, forensicsController.getWhaleCorrelations);
router.get("/peer-percentiles/:address", optionalAuth, forensicsController.getPeerPercentiles);

// Consolidated Full Audit (Round 1 + Round 2)
router.get("/full-audit/:address", optionalAuth, forensicsController.getFullForensicAudit);

module.exports = router;
