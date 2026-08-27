/**
 * CryptoScope AI — Forensic Intelligence Routes (/api/forensics/*)
 */

const express = require("express");
const router = express.Router();
const forensicsController = require("../controllers/forensicsController");
const { optionalAuth, authMiddleware } = require("../middleware/authMiddleware");
const { requireValidBitcoinAddress } = require("../middleware/bitcoinAddressValidator");

// Round 1 Routes
router.get("/mempool/congestion", forensicsController.getLiveMempoolCongestion);
router.get("/dusting/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getDustingAnalysis);
router.get("/graph/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getFundFlowGraph);
router.get("/cluster/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getClusteringAnalysis);
router.get("/fee-urgency/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getFeeUrgencyAnalysis);
router.get("/sanctions/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getSanctionsCheck);
router.get("/explain/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getExplainabilityReport);

// Round 2 Routes
router.get("/propagation/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getRiskPropagation);
router.get("/reuse/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getAddressReuse);
router.get("/mixer/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getMixerDetection);
router.get("/whale-correlations/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getWhaleCorrelations);
router.get("/peer-percentiles/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getPeerPercentiles);
router.get("/cdd/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getCoinDaysDestroyed);

// Round 3 Routes (Threat Radar & Alert Triage Queue)
router.get("/radar/feed", optionalAuth, forensicsController.getThreatRadarFeed);
router.get("/radar/stats", optionalAuth, forensicsController.getThreatRadarStats);
router.get("/triage/queue", authMiddleware, forensicsController.getTriageQueue);
router.put("/triage/:alertId/status", authMiddleware, forensicsController.updateTriageStatus);
router.post("/triage/:alertId/escalate", authMiddleware, forensicsController.escalateTriageAlert);

// Consolidated Full Audit (Round 1 + Round 2 + Round 3)
router.get("/full-audit/:address", optionalAuth, requireValidBitcoinAddress, forensicsController.getFullForensicAudit);

module.exports = router;
