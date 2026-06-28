const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/certificates.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/templates", ctrl.listTemplates);
router.post("/preview", requireAuth, requireRole("organizer", "admin"), ctrl.preview);
router.post("/generate-batch", requireAuth, requireRole("organizer", "admin"), ctrl.generateBatch);
router.get("/event/:eventId", requireAuth, requireRole("organizer", "admin"), ctrl.listForEvent);
router.get("/me", requireAuth, ctrl.myCertificates);

module.exports = router;
