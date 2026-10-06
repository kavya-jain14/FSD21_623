function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function objectBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail("Send a JSON object");
  return body;
}

function text(value, label, maximum, minimum = 1) {
  if (typeof value !== "string") fail(label + " must be text");
  const trimmed = value.trim();
  if (trimmed.length < minimum || trimmed.length > maximum) {
    fail(label + " must contain " + minimum + " to " + maximum + " characters");
  }
  return trimmed;
}

function choice(value, label, options) {
  if (!options.includes(value)) fail("Choose a valid " + label);
  return value;
}

function queryText(value, label, maximum = 200) {
  return value === undefined ? "" : text(value, label, maximum, 0);
}

module.exports = { fail, objectBody, text, choice, queryText };
