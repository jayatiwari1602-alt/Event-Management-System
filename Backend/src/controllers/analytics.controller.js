const db = require("../store/db");
const { ok } = require("../utils/response");

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// GET /api/analytics/dashboard  -- Executive Dashboard top stat cards
function dashboardSummary(req, res) {
  const isOrganizer = req.user.role === "organizer" || req.user.role === "admin";
  const myEvents = isOrganizer ? db.events.find((e) => e.organizerId === req.user.id) : [];
  const myEventIds = new Set(myEvents.map((e) => e.id));

  const regs = isOrganizer
    ? db.registrations.find((r) => myEventIds.has(r.eventId))
    : db.registrations.find((r) => r.userId === req.user.id);

  const confirmedRegs = regs.filter((r) => r.status === "confirmed");
  const revenue = confirmedRegs.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const totalUsers = db.users.count();

  return ok(res, {
    revenue,
    totalUsers: isOrganizer ? totalUsers : undefined,
    registrations: confirmedRegs.length,
    upcomingEvents: (isOrganizer ? myEvents : db.events.all()).filter(
      (e) => new Date(e.startDate) >= new Date() && e.status !== "completed"
    ).length,
    completedEvents: (isOrganizer ? myEvents : myEvents).filter((e) => e.status === "completed").length,
    certificatesEarned: db.certificates.find((c) => c.userId === req.user.id).length,
  });
}

// GET /api/analytics/registration-trends?eventId=&days=7  -- the wavy line chart
function registrationTrends(req, res) {
  const { eventId, days = 7 } = req.query;
  let regs = db.registrations.all();
  if (eventId) regs = regs.filter((r) => r.eventId === eventId);

  const buckets = {};
  const today = new Date();
  const series = [];

  for (let i = Number(days) - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
    series.push({ date: key, label: DAY_NAMES[d.getDay()] });
  }

  regs.forEach((r) => {
    const key = r.createdAt.slice(0, 10);
    if (buckets[key] !== undefined) buckets[key]++;
  });

  const result = series.map((s) => ({ ...s, count: buckets[s.date] }));
  return ok(res, result);
}

// GET /api/analytics/revenue-by-segment  -- horizontal bar breakdown (Enterprise/Professional/Individual/Add-ons)
function revenueBySegment(req, res) {
  const myEvents = db.events.find((e) => e.organizerId === req.user.id);
  const myEventIds = new Set(myEvents.map((e) => e.id));
  const regs = db.registrations.find((r) => myEventIds.has(r.eventId) && r.status === "confirmed");

  const segments = { Enterprise: 0, Professional: 0, Individual: 0, "Add-ons": 0 };
  regs.forEach((r) => {
    const label = (r.ticketLabel || "").toLowerCase();
    if (label.includes("vip") || label.includes("enterprise")) segments.Enterprise += r.amountPaid;
    else if (label.includes("professional") || label.includes("workshop")) segments.Professional += r.amountPaid;
    else if (label.includes("add")) segments["Add-ons"] += r.amountPaid;
    else segments.Individual += r.amountPaid;
  });

  return ok(
    res,
    Object.entries(segments).map(([label, amount]) => ({ label, amount }))
  );
}

// GET /api/analytics/capacity-thresholds  -- "Upcoming Event Thresholds" table
function capacityThresholds(req, res) {
  const myEvents = db.events.find((e) => e.organizerId === req.user.id);
  const result = myEvents
    .filter((e) => e.status === "active" || e.status === "scheduled")
    .map((e) => {
      const registered = db.registrations.find((r) => r.eventId === e.id && r.status === "confirmed").length;
      const pct = e.capacity > 0 ? registered / e.capacity : 0;
      let status = "On Track";
      if (pct >= 1) status = "Full";
      else if (pct >= 0.9) status = "Near Capacity";
      else if (pct >= 0.5) status = "Stable";
      return { eventId: e.id, eventName: e.title, registered, capacity: e.capacity, status };
    });
  return ok(res, result);
}

module.exports = { dashboardSummary, registrationTrends, revenueBySegment, capacityThresholds };
