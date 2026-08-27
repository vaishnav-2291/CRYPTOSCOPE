/**
 * CryptoScope AI — Investigation Case Routes (/api/cases/*)
 */

const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { requireValidBitcoinAddress } = require("../middleware/bitcoinAddressValidator");

router.use(authMiddleware); // All case endpoints require analyst authentication

router.post("/", caseController.createCase);
router.get("/", caseController.getUserCases);
router.get("/:id", caseController.getCaseById);
router.get("/:id/live-dossier", caseController.getCaseLiveDossier);
router.put("/:id", caseController.updateCase);
router.post("/:id/addresses", caseController.addAddressToCase);
router.delete("/:id/addresses/:address", caseController.removeAddressFromCase);
router.post("/:id/notes", caseController.addTimelineNote);
router.delete("/:id", caseController.deleteCase);

module.exports = router;
