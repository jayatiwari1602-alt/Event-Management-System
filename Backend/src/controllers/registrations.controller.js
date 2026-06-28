const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");
const { logActivity } = require("./activity.controller");
const { generateQrPayload, generateQrImage } = require("../utils/qr");

function toPublicRegistration(reg) {
  const event = db.events.get(reg.eventId);
  const user = db.users.get(reg.userId);
  return {
    ...reg,
    event: event ? { id: event.id, title: event.title, startDate: event.startDate, venueName: event.venueName, isVirtual: event.isVirtual } : null,
    attendee: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatarUrl: user.avatarUrl } : null,
  };
}

// POST /api/registrations  { eventId, ticketTypeId }
function register(req, res, next) {
  try {
    const { eventId, ticketTypeId } = req.body;
    const event = db.events.get(eventId);
    if (!event) throw new ApiError("Event not found", 404, "NOT_FOUND");

    const already = db.registrations.findOne(
      (r) => r.eventId === eventId && r.userId === req.user.id && r.status !== "cancelled"
    );
    if (already) throw new ApiError("You are already registered for this event", 409, "ALREADY_REGISTERED");

    let ticketType = null;
    let amountPaid = event.price || 0;
    let ticketLabel = "General";

    if (ticketTypeId) {
      ticketType = db.tickets.get(ticketTypeId);
      if (!ticketType) throw new ApiError("Ticket type not found", 404, "NOT_FOUND");
      if (ticketType.quantity > 0 && ticketType.sold >= ticketType.quantity) {
        throw new ApiError("This ticket type is sold out", 409, "SOLD_OUT");
      }
      amountPaid = ticketType.price;
      ticketLabel = ticketType.name;
      db.tickets.update(ticketType.id, { sold: ticketType.sold + 1 });
    }

    const registration = db.registrations.insert({
      eventId,
      userId: req.user.id,
      ticketTypeId: ticketTypeId || null,
      ticketLabel,
      amountPaid,
      status: event.requiresApproval ? "pending" : "confirmed",
      checkedIn: false,
      qrCode: generateQrPayload({ eventId, userId: req.user.id }),
      orderId: `EP-${Math.floor(100000 + Math.random() * 900000)}`,
    });

    logActivity({
      type: "registration",
      message: `${req.user.firstName || "Someone"} joined ${event.title}`,
      userId: req.user.id,
      eventId,
    });

    return created(res, toPublicRegistration(registration));
  } catch (err) {
    next(err);
  }
}

// GET /api/registrations/me  -> "My Events" / "Registered Events" page
function myRegistrations(req, res) {
  const regs = db.registrations
    .find((r) => r.userId === req.user.id)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(toPublicRegistration);
  return ok(res, regs);
}

// GET /api/registrations/event/:eventId -> organizer view, real-time check-in feed source
function listForEvent(req, res, next) {
  const event = db.events.get(req.params.eventId);
  if (!event) return next(new ApiError("Event not found", 404, "NOT_FOUND"));

  const { status } = req.query;
  let regs = db.registrations.find((r) => r.eventId === req.params.eventId);
  if (status) regs = regs.filter((r) => r.status === status);

  regs = regs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(toPublicRegistration);
  return ok(res, regs);
}

// PATCH /api/registrations/:id/approve
function approve(req, res, next) {
  const reg = db.registrations.get(req.params.id);
  if (!reg) return next(new ApiError("Registration not found", 404, "NOT_FOUND"));
  const updated = db.registrations.update(req.params.id, { status: "confirmed" });
  logActivity({ type: "approval", message: `Registration approved for ${reg.userId}`, eventId: reg.eventId });
  return ok(res, toPublicRegistration(updated));
}

// PATCH /api/registrations/:id/reject
function reject(req, res, next) {
  const reg = db.registrations.get(req.params.id);
  if (!reg) return next(new ApiError("Registration not found", 404, "NOT_FOUND"));
  const updated = db.registrations.update(req.params.id, { status: "rejected" });
  return ok(res, toPublicRegistration(updated));
}

// PATCH /api/registrations/:id/cancel  (attendee cancels their own)
function cancel(req, res, next) {
  const reg = db.registrations.get(req.params.id);
  if (!reg) return next(new ApiError("Registration not found", 404, "NOT_FOUND"));
  if (reg.userId !== req.user.id && req.user.role !== "admin") {
    return next(new ApiError("Not authorized", 403, "FORBIDDEN"));
  }
  const updated = db.registrations.update(req.params.id, { status: "cancelled" });
  return ok(res, toPublicRegistration(updated));
}

// GET /api/registrations/:id/qr-image -> base64 PNG for the digital entrance pass
async function getQrImage(req, res, next) {
  try {
    const reg = db.registrations.get(req.params.id);
    if (!reg) throw new ApiError("Registration not found", 404, "NOT_FOUND");
    if (reg.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "organizer") {
      throw new ApiError("Not authorized", 403, "FORBIDDEN");
    }
    const dataUri = await generateQrImage(reg.qrCode);
    return ok(res, { qrImage: dataUri });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, myRegistrations, listForEvent, approve, reject, cancel, getQrImage, toPublicRegistration };
