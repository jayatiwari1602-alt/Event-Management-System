const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/venues.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", ctrl.listVenues);
router.post("/", requireAuth, requireRole("organizer", "admin"), ctrl.createVenue);
router.patch("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.updateVenue);
router.delete("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.deleteVenue);

module.exports = router;
