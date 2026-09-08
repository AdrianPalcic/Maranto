const { JWT } = require("google-auth-library");
const { CALENDAR_ID, TIMEZONE } = require("./config");

let cachedClient = null;

function loadCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 nije postavljen");
  }
  const json = Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(json);
}

function getClient() {
  if (cachedClient) return cachedClient;
  const creds = loadCredentials();
  cachedClient = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return cachedClient;
}

// Vraca busy periode za CALENDAR_ID unutar [timeMinISO, timeMaxISO]
async function getBusyPeriods(timeMinISO, timeMaxISO) {
  const client = getClient();
  const res = await client.request({
    url: "https://www.googleapis.com/calendar/v3/freeBusy",
    method: "POST",
    data: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      items: [{ id: CALENDAR_ID }],
    },
  });
  const calendar = res.data.calendars && res.data.calendars[CALENDAR_ID];
  if (!calendar) return [];
  if (calendar.errors && calendar.errors.length) {
    throw new Error(
      `Google Calendar freeBusy greska: ${JSON.stringify(calendar.errors)}`
    );
  }
  return calendar.busy || [];
}

async function createEvent({ summary, description, startISO, endISO, extendedProperties }) {
  const client = getClient();
  const res = await client.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events`,
    method: "POST",
    data: {
      summary,
      description,
      start: { dateTime: startISO, timeZone: TIMEZONE },
      end: { dateTime: endISO, timeZone: TIMEZONE },
      extendedProperties: { private: extendedProperties || {} },
    },
  });
  return res.data;
}

async function getEvent(eventId) {
  const client = getClient();
  const res = await client.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events/${encodeURIComponent(eventId)}`,
    method: "GET",
  });
  return res.data;
}

async function deleteEvent(eventId) {
  const client = getClient();
  await client.request({
    url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      CALENDAR_ID
    )}/events/${encodeURIComponent(eventId)}`,
    method: "DELETE",
  });
}

module.exports = { getBusyPeriods, createEvent, getEvent, deleteEvent };
