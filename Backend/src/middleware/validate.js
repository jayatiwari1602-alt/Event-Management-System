const { ApiError } = require("../utils/response");

/**
 * Tiny validator — no Joi/Zod dependency needed for this project size.
 * Usage: validateBody({ email: "required|email", password: "required|min:6" })
 */
function validateBody(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, ruleStr] of Object.entries(rules)) {
      const rulesArr = ruleStr.split("|");
      const value = req.body[field];

      for (const rule of rulesArr) {
        const [name, arg] = rule.split(":");

        if (name === "required" && (value === undefined || value === null || value === "")) {
          errors.push(`${field} is required`);
        }
        if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`${field} must be a valid email`);
        }
        if (name === "min" && value && String(value).length < Number(arg)) {
          errors.push(`${field} must be at least ${arg} characters`);
        }
        if (name === "number" && value !== undefined && isNaN(Number(value))) {
          errors.push(`${field} must be a number`);
        }
        if (name === "in" && value !== undefined && !arg.split(",").includes(value)) {
          errors.push(`${field} must be one of: ${arg}`);
        }
      }
    }

    if (errors.length > 0) {
      return next(new ApiError(errors.join("; "), 422, "VALIDATION_ERROR"));
    }
    next();
  };
}

module.exports = { validateBody };
