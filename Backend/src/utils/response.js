/**
 * Every endpoint returns this exact shape so the frontend can write one
 * generic fetch wrapper instead of guessing per-route.
 *
 * Success: { success: true, data: ..., meta?: {...} }
 * Error:   { success: false, error: { message, code } }
 */
function ok(res, data, status = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

function created(res, data) {
  return ok(res, data, 201);
}

function fail(res, message, status = 400, code = "BAD_REQUEST") {
  return res.status(status).json({ success: false, error: { message, code } });
}

class ApiError extends Error {
  constructor(message, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = { ok, created, fail, ApiError };
