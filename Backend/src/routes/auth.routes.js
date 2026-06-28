const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");

router.post(
  "/signup",
  validateBody({ email: "required|email", password: "required|min:6", firstName: "required" }),
  ctrl.signup
);
router.post("/login", validateBody({ email: "required|email", password: "required" }), ctrl.login);
router.get("/me", requireAuth, ctrl.me);
router.patch("/me", requireAuth, ctrl.updateMe);
router.post(
  "/change-password",
  requireAuth,
  validateBody({ currentPassword: "required", newPassword: "required|min:6" }),
  ctrl.changePassword
);

module.exports = router;
