const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");
const { logActivity } = require("./activity.controller");

function enrichEvent(event) {
  const registrations = db.registrations.find((r) => r.eventId === event.id);
  const capacity = event.capacity || 0;
  const registeredCount = registrations.filter((r) => r.status !== "cancelled").length;
  const revenue = registrations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);

  let capacityStatus = "On Track";
  if (capacity > 0) {
    const pct = registeredCount / capacity;
    if (pct >= 1) capacityStatus = "Full";
    else if (pct >= 0.9) capacityStatus = "Near Capacity";
    else if (pct >= 0.5) capacityStatus = "Stable";
  }

  return {
    ...event,
    registeredCount,
    capacityStatus,
    revenue,
    spotsLeft: capacity > 0 ? Math.max(capacity - registeredCount, 0) : null,
  };
}

// GET /api/events  (Discovery page: keyword, category, timeframe, price, pagination)
function listEvents(req, res) {
  const { keyword, category, timeframe, minPrice, maxPrice, status, organizerId, page = 1, limit = 6 } = req.query;

  let results = db.events.all();

  if (keyword) {
    const k = keyword.toLowerCase();
    results = results.filter(
      (e) => e.title.toLowerCase().includes(k) || (e.description || "").toLowerCase().includes(k)
    );
  }
  if (category && category !== "All Categories") {
    results = results.filter((e) => e.category === category);
  }
  if (status) {
    results = results.filter((e) => e.status === status);
  }
  if (organizerId) {
    results = results.filter((e) => e.organizerId === organizerId);
  }
  if (minPrice !== undefined) {
    results = results.filter((e) => e.price >= Number(minPrice));
  }
  if (maxPrice !== undefined) {
    results = results.filter((e) => e.price <= Number(maxPrice));
  }
  if (timeframe && timeframe !== "Any Date") {
    const now = new Date();
    results = results.filter((e) => {
      const start = new Date(e.startDate);
      if (timeframe === "This Week") {
        const weekOut = new Date(now);
        weekOut.setDate(now.getDate() + 7);
        return start >= now && start <= weekOut;
      }
      if (timeframe === "This Month") {
        return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }

  results.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  const total = results.length;
  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.max(Number(limit), 1);
  const start = (pageNum - 1) * limitNum;
  const paged = results.slice(start, start + limitNum).map(enrichEvent);

  return ok(res, paged, 200, {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
}

// GET /api/events/:id
function getEvent(req, res, next) {
  const event = db.events.get(req.params.id);
  if (!event) return next(new ApiError("Event not found", 404, "NOT_FOUND"));

  const ticketTypes = db.tickets.find((t) => t.eventId === event.id);
  const relatedEvents = db.events
    .find((e) => e.id !== event.id && e.category === event.category)
    .slice(0, 3)
    .map(enrichEvent);

  return ok(res, { ...enrichEvent(event), ticketTypes, relatedEvents });
}

// POST /api/events  (step 1 "Basics" of the create wizard — can be extended via PATCH for steps 2/3)
function createEvent(req, res, next) {
  try {
    const {
      title,
      bannerUrl,
      venueName,
      category,
      description,
      latitude,
      longitude,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      price,
      isVirtual,
      status,
    } = req.body;

    if (!title) throw new ApiError("Event title is required", 422, "VALIDATION_ERROR");

    const event = db.events.insert({
      title,
      bannerUrl: bannerUrl || "",
      venueName: venueName || "",
      category: category || "Technology & Innovation",
      description: description || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      startDate: startDate || null,
      endDate: endDate || startDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      capacity: Number(capacity) || 0,
      price: Number(price) || 0,
      isVirtual: !!isVirtual,
      status: status || "draft", // draft | scheduled | active | completed | cancelled
      organizerId: req.user.id,
      agenda: [],
      speakers: [],
    });

    logActivity({
      type: "event_created",
      message: `${req.user.firstName || "Someone"} created "${event.title}"`,
      userId: req.user.id,
      eventId: event.id,
    });

    return created(res, event);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/events/:id  (used by wizard steps 2 "Schedule" and 3 "Ticketing", and general edits)
function updateEvent(req, res, next) {
  const event = db.events.get(req.params.id);
  if (!event) return next(new ApiError("Event not found", 404, "NOT_FOUND"));
  if (event.organizerId !== req.user.id && req.user.role !== "admin") {
    return next(new ApiError("Not authorized to edit this event", 403, "FORBIDDEN"));
  }

  const allowed = [
    "title", "bannerUrl", "venueName", "category", "description", "latitude", "longitude",
    "startDate", "endDate", "startTime", "endTime", "capacity", "price", "isVirtual",
    "status", "agenda", "speakers",
  ];
  const patch = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) patch[key] = req.body[key];
  }

  const updated = db.events.update(req.params.id, patch);
  return ok(res, updated);
}

function deleteEvent(req, res, next) {
  const event = db.events.get(req.params.id);
  if (!event) return next(new ApiError("Event not found", 404, "NOT_FOUND"));
  if (event.organizerId !== req.user.id && req.user.role !== "admin") {
    return next(new ApiError("Not authorized to delete this event", 403, "FORBIDDEN"));
  }
  db.events.remove(req.params.id);
  return ok(res, { message: "Event deleted" });
}

// GET /api/events/directory/summary  (the 4 stat cards on Event Directory page)
function directorySummary(req, res) {
  const myEvents = db.events.find((e) => e.organizerId === req.user.id);
  const registrations = db.registrations.all();
  const myEventIds = new Set(myEvents.map((e) => e.id));
  const myRegs = registrations.filter((r) => myEventIds.has(r.eventId) && r.status !== "cancelled");

  const totalRevenue = myRegs.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const pendingApprovals = registrations.filter((r) => myEventIds.has(r.eventId) && r.status === "pending").length;

  return ok(res, {
    totalEvents: myEvents.length,
    activeRegistrations: myRegs.length,
    revenue: totalRevenue,
    pendingApprovals,
  });
}

module.exports = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  directorySummary,
  enrichEvent,
};
