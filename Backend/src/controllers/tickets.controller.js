const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");

function listTicketsForEvent(req, res) {
  const tickets = db.tickets.find((t) => t.eventId === req.params.eventId);
  return ok(res, tickets);
}

function createTicketType(req, res, next) {
  const event = db.events.get(req.params.eventId);
  if (!event) return next(new ApiError("Event not found", 404, "NOT_FOUND"));
  if (event.organizerId !== req.user.id && req.user.role !== "admin") {
    return next(new ApiError("Not authorized", 403, "FORBIDDEN"));
  }

  const { name, price, quantity, description } = req.body;
  if (!name) return next(new ApiError("Ticket name is required", 422, "VALIDATION_ERROR"));

  const ticket = db.tickets.insert({
    eventId: event.id,
    name, // e.g. "VIP Pass", "General", "Early Bird"
    price: Number(price) || 0,
    quantity: Number(quantity) || 0,
    sold: 0,
    description: description || "",
  });
  return created(res, ticket);
}

function updateTicketType(req, res, next) {
  const ticket = db.tickets.get(req.params.id);
  if (!ticket) return next(new ApiError("Ticket type not found", 404, "NOT_FOUND"));

  const allowed = ["name", "price", "quantity", "description"];
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

  return ok(res, db.tickets.update(req.params.id, patch));
}

function deleteTicketType(req, res, next) {
  const ticket = db.tickets.get(req.params.id);
  if (!ticket) return next(new ApiError("Ticket type not found", 404, "NOT_FOUND"));
  db.tickets.remove(req.params.id);
  return ok(res, { message: "Ticket type removed" });
}

module.exports = { listTicketsForEvent, createTicketType, updateTicketType, deleteTicketType };
