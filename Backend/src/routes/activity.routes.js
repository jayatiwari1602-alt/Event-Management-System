const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/activity.controller");
const { requireAuth } = require("../middleware/auth");

router.get("/", requireAuth, ctrl.listActivity);

module.exports = router;
