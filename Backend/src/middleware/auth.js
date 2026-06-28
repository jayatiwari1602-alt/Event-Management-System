const { verifyToken } = require("../utils/auth");
const { ApiError } = require("../utils/response");
const db = require("../store/db");

/** Requires a valid Bearer token. Attaches req.user (full user record, minus password). */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError("Missing or malformed Authorization header", 401, "UNAUTHORIZED"));
  }

  try {
    const payload = verifyToken(token);
    const user = db.users.get(payload.sub);
    if (!user) return next(new ApiError("User no longer exists", 401, "UNAUTHORIZED"));

    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    return next(new ApiError("Invalid or expired token", 401, "TOKEN_INVALID"));
  }
}

/** Use after requireAuth. e.g. requireRole("organizer", "admin") */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError("Unauthenticated", 401, "UNAUTHORIZED"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("You do not have permission to perform this action", 403, "FORBIDDEN"));
    }
    next();
  };
}

/** Like requireAuth, but doesn't fail if no token is present. Used for public-but-personalized routes. */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = verifyToken(token);
      const user = db.users.get(payload.sub);
      if (user) {
        const { password, ...safeUser } = user;
        req.user = safeUser;
      }
    } catch (_) {
      /* ignore invalid token for optional auth */
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
