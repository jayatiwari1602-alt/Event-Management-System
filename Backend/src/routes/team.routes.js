const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/team.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", requireAuth, requireRole("organizer", "admin"), ctrl.listTeam);
router.post("/invite", requireAuth, requireRole("organizer", "admin"), ctrl.inviteMember);
router.delete("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.removeMember);

module.exports = router;
