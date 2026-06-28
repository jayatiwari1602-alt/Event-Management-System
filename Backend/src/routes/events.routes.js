const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/events.controller");
const { requireAuth, requireRole, optionalAuth } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { ok } = require("../utils/response");

// Public discovery — optionalAuth lets us personalize later (e.g. "saved" flag) without requiring login
router.get("/", optionalAuth, ctrl.listEvents);
router.get("/directory/summary", requireAuth, requireRole("organizer", "admin"), ctrl.directorySummary);
router.get("/:id", optionalAuth, ctrl.getEvent);

router.post("/", requireAuth, requireRole("organizer", "admin"), ctrl.createEvent);
router.patch("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.updateEvent);
router.delete("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.deleteEvent);

// Banner upload — used by the "Create New Event" wizard step 1
router.post("/upload-banner", requireAuth, requireRole("organizer", "admin"), upload.single("banner"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: "No file uploaded" } });
  return ok(res, { url: `/uploads/${req.file.filename}` });
});

module.exports = router;
