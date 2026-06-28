const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/tickets.controller");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/event/:eventId", ctrl.listTicketsForEvent);
router.post("/event/:eventId", requireAuth, requireRole("organizer", "admin"), ctrl.createTicketType);
router.patch("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.updateTicketType);
router.delete("/:id", requireAuth, requireRole("organizer", "admin"), ctrl.deleteTicketType);

module.exports = router;
