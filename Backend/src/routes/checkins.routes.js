const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/checkins.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post("/", requireAuth, requireRole("organizer", "admin"), ctrl.checkInByQr);
router.post("/manual", requireAuth, requireRole("organizer", "admin"), ctrl.checkInManual);
router.get("/event/:eventId", requireAuth, requireRole("organizer", "admin"), ctrl.feedForEvent);
router.get("/event/:eventId/stats", requireAuth, requireRole("organizer", "admin"), ctrl.statsForEvent);

module.exports = router;
