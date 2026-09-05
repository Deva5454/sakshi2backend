// Strips MongoDB operator keys (anything starting with "$") and dotted keys
// from incoming request bodies/queries/params. Several controllers pass
// req.body fields straight into Mongoose query filters (e.g.
// `Staff.findOne({ email: req.body.email })`); without this, a payload like
// `{ "email": { "$ne": null } }` could manipulate those queries in ways the
// developer never intended. This is a blunt, whole-app defense so no
// individual controller has to remember to sanitize its own inputs.
function stripOperators(value) {
  if (Array.isArray(value)) {
    return value.map(stripOperators);
  }
  if (value && typeof value === "object") {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue; // drop dangerous keys entirely
      }
      clean[key] = stripOperators(val);
    }
    return clean;
  }
  return value;
}

module.exports = function sanitizeInput(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = stripOperators(req.body);
  }
  if (req.query && typeof req.query === "object") {
    req.query = stripOperators(req.query);
  }
  if (req.params && typeof req.params === "object") {
    req.params = stripOperators(req.params);
  }
  next();
};
