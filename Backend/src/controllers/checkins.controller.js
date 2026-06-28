const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");
const { logActivity } = require("./activity.controller");

function toPublicCheckin(checkin) {
  const reg = db.registrations.get(checkin.registrationId);
  const user = reg ? db.users.get(reg.userId) : null;
  return {
    ...checkin,
    attendeeName: user ? `${user.firstName} ${user.lastName}`.trim() : "Unknown",
    ticketType: reg ? reg.ticketLabel : null,
  };
}

// POST /api/checkins  { qrCode }  -- scanning flow, "Align QR Code" terminal
function checkInByQr(req, res, next) {
  try {
    const { qrCode } = req.body;
    const reg = db.registrations.findOne((r) => r.qrCode === qrCode);
    if (!reg) throw new ApiError("Invalid or unrecognized QR code", 404, "INVALID_QR");
    if (reg.status === "cancelled" || reg.status === "rejected") {
      throw new ApiError("This registration is not valid for check-in", 409, "REGISTRATION_INVALID");
    }
    if (reg.checkedIn) throw new ApiError("This attendee has already checked in", 409, "ALREADY_CHECKED_IN");

    db.registrations.update(reg.id, { checkedIn: true });
    const checkin = db.checkins.insert({
      registrationId: reg.id,
      eventId: reg.eventId,
      method: "qr",
    });

    const user = db.users.get(reg.userId);
    logActivity({
      type: "checkin",
      message: `${user ? user.firstName : "Attendee"} checked in`,
      eventId: reg.eventId,
      userId: reg.userId,
    });

    return created(res, toPublicCheckin(checkin));
  } catch (err) {
    next(err);
  }
}

// POST /api/checkins/manual  { registrationId }  -- "Manual Entry" button
function checkInManual(req, res, next) {
  try {
    const { registrationId } = req.body;
    const reg = db.registrations.get(registrationId);
    if (!reg) throw new ApiError("Registration not found", 404, "NOT_FOUND");
    if (reg.checkedIn) throw new ApiError("Already checked in", 409, "ALREADY_CHECKED_IN");

    db.registrations.update(reg.id, { checkedIn: true });
    const checkin = db.checkins.insert({ registrationId: reg.id, eventId: reg.eventId, method: "manual" });
    return created(res, toPublicCheckin(checkin));
  } catch (err) {
    next(err);
  }
}

// GET /api/checkins/event/:eventId  -- "Real-time Check-in Feed" table
function feedForEvent(req, res) {
  const limit = Number(req.query.limit) || 50;
  const checkins = db.checkins
    .find((c) => c.eventId === req.params.eventId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map(toPublicCheckin);
  return ok(res, checkins);
}

// GET /api/checkins/event/:eventId/stats  -- "Attendance Rate" stat card
function statsForEvent(req, res) {
  const eventId = req.params.eventId;
  const allRegs = db.registrations.find((r) => r.eventId === eventId && r.status !== "cancelled" && r.status !== "rejected");
  const checkedIn = allRegs.filter((r) => r.checkedIn).length;
  const total = allRegs.length;
  const rate = total > 0 ? Math.round((checkedIn / total) * 1000) / 10 : 0;

  return ok(res, { totalRegistrations: total, checkedIn, attendanceRate: rate });
}

module.exports = { checkInByQr, checkInManual, feedForEvent, statsForEvent };
