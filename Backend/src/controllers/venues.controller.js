const db = require("../store/db");
const { ok, created, ApiError } = require("../utils/response");

function listVenues(req, res) {
  return ok(res, db.venues.all());
}

function createVenue(req, res, next) {
  const { name, address, city, capacity, latitude, longitude } = req.body;
  if (!name) return next(new ApiError("Venue name is required", 422, "VALIDATION_ERROR"));

  const venue = db.venues.insert({
    name,
    address: address || "",
    city: city || "",
    capacity: Number(capacity) || 0,
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    ownerId: req.user.id,
  });
  return created(res, venue);
}

function updateVenue(req, res, next) {
  const venue = db.venues.get(req.params.id);
  if (!venue) return next(new ApiError("Venue not found", 404, "NOT_FOUND"));

  const allowed = ["name", "address", "city", "capacity", "latitude", "longitude"];
  const patch = {};
  for (const key of allowed) if (req.body[key] !== undefined) patch[key] = req.body[key];

  return ok(res, db.venues.update(req.params.id, patch));
}

function deleteVenue(req, res, next) {
  const venue = db.venues.get(req.params.id);
  if (!venue) return next(new ApiError("Venue not found", 404, "NOT_FOUND"));
  db.venues.remove(req.params.id);
  return ok(res, { message: "Venue deleted" });
}

module.exports = { listVenues, createVenue, updateVenue, deleteVenue };
