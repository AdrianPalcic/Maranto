const { DateTime } = require("luxon");
const { SLOTS, BOOKING_WINDOW_MONTHS, MIN_NOTICE_HOURS, TIMEZONE } = require("./config");

function parseHHmm(dt, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return dt.set({ hour: h, minute: m, second: 0, millisecond: 0 });
}

// Sve kandidat termine (pon-pet, unutar booking prozora, posle min-notice), bez provjere zauzetosti
function generateCandidateSlots(now = DateTime.now().setZone(TIMEZONE)) {
  const earliestStart = now.plus({ hours: MIN_NOTICE_HOURS });
  const windowEnd = now.plus({ months: BOOKING_WINDOW_MONTHS });

  const candidates = [];
  let day = now.startOf("day");
  while (day <= windowEnd) {
    if (day.weekday >= 1 && day.weekday <= 5) {
      SLOTS.forEach((slot, slotIndex) => {
        const start = parseHHmm(day, slot.start);
        const end = parseHHmm(day, slot.end);
        if (start >= earliestStart && start <= windowEnd) {
          candidates.push({
            date: day.toISODate(),
            slotIndex,
            start,
            end,
          });
        }
      });
    }
    day = day.plus({ days: 1 });
  }
  return candidates;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// Filtrira kandidate protiv busy perioda (svaki busy = {start, end} ISO stringovi)
function filterAvailable(candidates, busyPeriods) {
  const busy = busyPeriods.map((b) => ({
    start: DateTime.fromISO(b.start),
    end: DateTime.fromISO(b.end),
  }));
  return candidates.filter(
    (c) => !busy.some((b) => overlaps(c.start, c.end, b.start, b.end))
  );
}

function getSlotByKey(date, slotIndex, now = DateTime.now().setZone(TIMEZONE)) {
  const day = DateTime.fromISO(date, { zone: TIMEZONE }).startOf("day");
  const slot = SLOTS[slotIndex];
  if (!slot) return null;
  if (day.weekday < 1 || day.weekday > 5) return null;
  const start = parseHHmm(day, slot.start);
  const end = parseHHmm(day, slot.end);
  const earliestStart = now.plus({ hours: MIN_NOTICE_HOURS });
  const windowEnd = now.plus({ months: BOOKING_WINDOW_MONTHS });
  if (start < earliestStart || start > windowEnd) return null;
  return { date, slotIndex, start, end };
}

module.exports = { generateCandidateSlots, filterAvailable, getSlotByKey, overlaps };
