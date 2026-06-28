const db = require("../store/db");
const { ok } = require("../utils/response");

/** Called internally by other controllers to push an activity log entry. */
function logActivity({ type, message, userId = null, eventId = null }) {
  return db.activity.insert({ type, message, userId, eventId });
}

function listActivity(req, res) {
  const limit = Number(req.query.limit) || 20;
  const items = db.activity
    .all()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
  return ok(res, items);
}

module.exports = { logActivity, listActivity };
