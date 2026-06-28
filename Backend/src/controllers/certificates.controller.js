const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");

const TEMPLATES = [
  { id: "tpl_elite_platinum", name: "Elite Platinum", style: "elite-platinum" },
  { id: "tpl_modern", name: "Modern", style: "modern" },
  { id: "tpl_classic", name: "Classic", style: "classic" },
];

function listTemplates(req, res) {
  return ok(res, TEMPLATES);
}

/** Replaces [[variable_name]] tokens in a template string with real values. */
function fillTemplate(templateText, vars) {
  return templateText.replace(/\[\[(\w+)\]\]/g, (match, key) => (vars[key] !== undefined ? vars[key] : match));
}

// POST /api/certificates/preview  -- live preview as org edits the template/variables
function preview(req, res, next) {
  try {
    const { registrationId, trackName } = req.body;
    const reg = db.registrations.get(registrationId);
    if (!reg) throw new ApiError("Registration not found", 404, "NOT_FOUND");
    const user = db.users.get(reg.userId);
    const event = db.events.get(reg.eventId);

    const vars = {
      full_name: `${user.firstName} ${user.lastName}`.trim(),
      track_id: trackName || "Main Track",
      issue_date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      event_name: event.title,
    };

    const bodyTemplate =
      "For successful completion of the advanced track in [[track_id]] at the [[event_name]].";

    return ok(res, { variables: vars, renderedBody: fillTemplate(bodyTemplate, vars) });
  } catch (err) {
    next(err);
  }
}

// POST /api/certificates/generate-batch
// { eventId, templateId, ticketTypeFilter?, deliveryModes: { emailAttendee, syncLinkedIn, storePortal } }
function generateBatch(req, res, next) {
  try {
    const { eventId, templateId, ticketTypeFilter, deliveryModes = {} } = req.body;
    const event = db.events.get(eventId);
    if (!event) throw new ApiError("Event not found", 404, "NOT_FOUND");

    let regs = db.registrations.find((r) => r.eventId === eventId && r.status === "confirmed");
    if (ticketTypeFilter) regs = regs.filter((r) => r.ticketTypeId === ticketTypeFilter);

    const generated = regs.map((reg) => {
      const user = db.users.get(reg.userId);
      return db.certificates.insert({
        eventId,
        registrationId: reg.id,
        userId: reg.userId,
        templateId: templateId || TEMPLATES[0].id,
        recipientName: `${user.firstName} ${user.lastName}`.trim(),
        deliveryModes,
        status: "issued",
      });
    });

    return created(res, {
      issuedCount: generated.length,
      queuedCount: regs.length,
      certificates: generated,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/certificates/event/:eventId  -- "Issued Certs" counter + list
function listForEvent(req, res) {
  const certs = db.certificates.find((c) => c.eventId === req.params.eventId);
  const totalConfirmed = db.registrations.find(
    (r) => r.eventId === req.params.eventId && r.status === "confirmed"
  ).length;

  return ok(res, certs, 200, { issued: certs.length, total: totalConfirmed });
}

// GET /api/certificates/me  -- attendee's own certs (e.g. for Account Settings "Professional Certifications")
function myCertificates(req, res) {
  const certs = db.certificates.find((c) => c.userId === req.user.id);
  return ok(res, certs);
}

module.exports = { listTemplates, preview, generateBatch, listForEvent, myCertificates };
