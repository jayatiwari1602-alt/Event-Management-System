const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/registrations.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.post("/", requireAuth, ctrl.register);
router.get("/me", requireAuth, ctrl.myRegistrations);
router.get("/event/:eventId", requireAuth, requireRole("organizer", "admin"), ctrl.listForEvent);
router.get("/:id/qr-image", requireAuth, ctrl.getQrImage);
router.patch("/:id/approve", requireAuth, requireRole("organizer", "admin"), ctrl.approve);
router.patch("/:id/reject", requireAuth, requireRole("organizer", "admin"), ctrl.reject);
router.patch("/:id/cancel", requireAuth, ctrl.cancel);

module.exports = router;
