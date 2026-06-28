const db = require("../store/db");
const { hashPassword, comparePassword, signToken } = require("../utils/auth");
const { ok, created, ApiError } = require("../utils/response");
const { logActivity } = require("./activity.controller");

function sanitize(user) {
  const { password, ...rest } = user;
  return rest;
}

async function signup(req, res, next) {
  try {
    const { email, password, firstName, lastName, role, organization } = req.body;

    const existing = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) throw new ApiError("An account with this email already exists", 409, "EMAIL_TAKEN");

    const hashed = await hashPassword(password);
    const user = db.users.insert({
      email: email.toLowerCase(),
      password: hashed,
      firstName: firstName || "",
      lastName: lastName || "",
      role: role === "organizer" ? "organizer" : "attendee", // default to attendee
      organization: organization || "",
      phone: "",
      timezone: "UTC",
      bio: "",
      avatarUrl: "",
      plan: "free",
      verified: false,
      notificationPrefs: { eventReminders: true, teamUpdates: true, weeklyAnalytics: false },
    });

    const token = signToken(user);
    logActivity({ type: "user_joined", message: `${user.firstName || user.email} joined`, userId: user.id });

    return created(res, { user: sanitize(user), token });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const match = await comparePassword(password, user.password);
    if (!match) throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    const token = signToken(user);
    return ok(res, { user: sanitize(user), token });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  return ok(res, { user: req.user });
}

function updateMe(req, res, next) {
  try {
    const allowed = ["firstName", "lastName", "phone", "timezone", "bio", "organization", "avatarUrl", "notificationPrefs"];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    const updated = db.users.update(req.user.id, patch);
    return ok(res, { user: sanitize(updated) });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const fullUser = db.users.get(req.user.id);
    const match = await comparePassword(currentPassword, fullUser.password);
    if (!match) throw new ApiError("Current password is incorrect", 401, "INVALID_CREDENTIALS");

    const hashed = await hashPassword(newPassword);
    db.users.update(req.user.id, { password: hashed });
    return ok(res, { message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me, updateMe, changePassword, sanitize };
