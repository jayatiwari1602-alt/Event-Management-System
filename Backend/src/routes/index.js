const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/events", require("./events.routes"));
router.use("/tickets", require("./tickets.routes"));
router.use("/registrations", require("./registrations.routes"));
router.use("/checkins", require("./checkins.routes"));
router.use("/certificates", require("./certificates.routes"));
router.use("/analytics", require("./analytics.routes"));
router.use("/venues", require("./venues.routes"));
router.use("/team", require("./team.routes"));
router.use("/activity", require("./activity.routes"));
router.use("/notifications", require("./notifications.routes"));

module.exports = router;
