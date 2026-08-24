const express = require("express");
const router = express.Router();

const {
    getAdminStats,
    getEntityCatalog,
    getAuditScans,
    getAuditActivities,
} = require("../controllers/adminController");

const { authMiddleware, requireAdmin } = require("../middleware/authMiddleware");

// All Admin routes require valid JWT + admin role
router.use(authMiddleware, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/entities", getEntityCatalog);
router.get("/scans", getAuditScans);
router.get("/activities", getAuditActivities);

module.exports = router;
