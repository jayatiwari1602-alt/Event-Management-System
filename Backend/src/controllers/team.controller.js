const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");

function listTeam(req, res) {
  return ok(res, db.teamMembers.find((t) => t.ownerId === req.user.id));
}

function inviteMember(req, res, next) {
  const { email, role } = req.body;
  if (!email) return next(new ApiError("Email is required", 422, "VALIDATION_ERROR"));

  const member = db.teamMembers.insert({
    ownerId: req.user.id,
    email,
    role: role || "member", // member | admin | viewer
    status: "pending", // pending | accepted
  });
  return created(res, member);
}

function removeMember(req, res, next) {
  const member = db.teamMembers.get(req.params.id);
  if (!member) return next(new ApiError("Team member not found", 404, "NOT_FOUND"));
  db.teamMembers.remove(req.params.id);
  return ok(res, { message: "Team member removed" });
}

module.exports = { listTeam, inviteMember, removeMember };
