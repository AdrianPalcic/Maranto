const { DateTime } = require("luxon");
const { TIMEZONE, BOOKING_WINDOW_MONTHS } = require("./_lib/config");
const { generateCandidateSlots, overlaps } = require("./_lib/slots");
const { getBusyPeriods } = require("./_lib/googleCalendar");
const { timeLabel } = require("./_lib/format");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const now = DateTime.now().setZone(TIMEZONE);
    const candidates = generateCandidateSlots(now);

    if (candidates.length === 0) {
      res.status(200).json({ timezone: TIMEZONE, slots: [] });
      return;
    }

    const timeMin = now.toUTC().toISO();
    const timeMax = now.plus({ months: BOOKING_WINDOW_MONTHS }).toUTC().toISO();
    const busy = await getBusyPeriods(timeMin, timeMax);
    const busyPeriods = busy.map((b) => ({
      start: DateTime.fromISO(b.start),
      end: DateTime.fromISO(b.end),
    }));

    const slots = candidates.map((s) => ({
      date: s.date,
      slotIndex: s.slotIndex,
      label: timeLabel(s.start, s.end),
      start: s.start.toISO(),
      available: !busyPeriods.some((b) =>
        overlaps(s.start, s.end, b.start, b.end)
      ),
    }));

    res.status(200).json({ timezone: TIMEZONE, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri dohvatu termina" });
  }
};
