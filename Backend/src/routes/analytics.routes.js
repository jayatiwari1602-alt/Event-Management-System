const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/analytics.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/dashboard", requireAuth, ctrl.dashboardSummary);
router.get("/registration-trends", requireAuth, ctrl.registrationTrends);
router.get("/revenue-by-segment", requireAuth, requireRole("organizer", "admin"), ctrl.revenueBySegment);
router.get("/capacity-thresholds", requireAuth, requireRole("organizer", "admin"), ctrl.capacityThresholds);

module.exports = router;
