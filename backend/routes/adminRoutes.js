const express = require("express");
const router = express.Router();

const {
    getAdminStats,
    getEntityCatalog,
    getAuditScans,
} = require("../controllers/adminController");

const { authMiddleware, requireAdmin } = require("../middleware/authMiddleware");

// All admin routes require valid auth + role === 'admin'
router.use(authMiddleware, requireAdmin);

router.get("/stats", getAdminStats);
router.get("/entities", getEntityCatalog);
router.get("/scans", getAuditScans);

module.exports = router;
