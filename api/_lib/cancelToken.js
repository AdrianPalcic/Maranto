const crypto = require("crypto");

function sign(eventId) {
  const secret = process.env.CANCEL_SECRET;
  return crypto.createHmac("sha256", secret).update(eventId).digest("hex").slice(0, 32);
}

function buildCancelUrl(eventId) {
  const base = process.env.SITE_URL || "";
  const token = sign(eventId);
  return `${base}/api/cancel?eventId=${encodeURIComponent(eventId)}&token=${token}`;
}

function verify(eventId, token) {
  const expected = sign(eventId);
  if (expected.length !== token.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

module.exports = { buildCancelUrl, verify };
