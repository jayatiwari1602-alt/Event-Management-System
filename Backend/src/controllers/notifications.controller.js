const db = require("../store/db");
const { ok, ApiError } = require("../utils/response");

function listMyNotifications(req, res) {
  const notifications = db.notifications
    .find((n) => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = notifications.filter((n) => !n.read).length;
  return ok(res, notifications, 200, { unreadCount });
}

function markRead(req, res, next) {
  const note = db.notifications.get(req.params.id);
  if (!note) return next(new ApiError("Notification not found", 404, "NOT_FOUND"));
  return ok(res, db.notifications.update(req.params.id, { read: true }));
}

function markAllRead(req, res) {
  const mine = db.notifications.find((n) => n.userId === req.user.id);
  mine.forEach((n) => db.notifications.update(n.id, { read: true }));
  return ok(res, { message: "All notifications marked as read" });
}

/** Internal helper used by other controllers to push a notification to a specific user. */
function pushNotification({ userId, title, message, type = "info" }) {
  return db.notifications.insert({ userId, title, message, type, read: false });
}

module.exports = { listMyNotifications, markRead, markAllRead, pushNotification };
