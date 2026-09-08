const { DateTime } = require("luxon");
const { TIMEZONE } = require("./_lib/config");
const { getSlotByKey, overlaps } = require("./_lib/slots");
const { getBusyPeriods, createEvent } = require("./_lib/googleCalendar");
const { sendCustomerConfirmation, sendClientNotification } = require("./_lib/email");
const { buildCancelUrl } = require("./_lib/cancelToken");
const { dateLabel, timeLabel } = require("./_lib/format");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(body) {
  const errors = [];
  if (!body || typeof body !== "object") return ["Nedostaju podaci"];
  if (!body.date || typeof body.date !== "string") errors.push("Nedostaje datum");
  if (typeof body.slotIndex !== "number") errors.push("Nedostaje termin");
  if (!body.firstName || !body.firstName.trim()) errors.push("Nedostaje ime");
  if (!body.lastName || !body.lastName.trim()) errors.push("Nedostaje prezime");
  if (!body.phone || !body.phone.trim()) errors.push("Nedostaje telefon");
  if (!body.email || !EMAIL_RE.test(body.email.trim())) errors.push("Neispravan email");
  return errors;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const errors = validate(req.body);
  if (errors.length) {
    res.status(400).json({ error: errors.join(", ") });
    return;
  }

  const { date, slotIndex, firstName, lastName, phone, email } = req.body;
  const first = firstName.trim();
  const last = lastName.trim();
  const phoneClean = phone.trim();
  const emailClean = email.trim().toLowerCase();

  try {
    const slot = getSlotByKey(date, slotIndex);
    if (!slot) {
      res.status(400).json({ error: "Odabrani termin nije valjan" });
      return;
    }

    const paddedStart = slot.start.minus({ minutes: 1 }).toUTC().toISO();
    const paddedEnd = slot.end.plus({ minutes: 1 }).toUTC().toISO();
    const busy = await getBusyPeriods(paddedStart, paddedEnd);
    const isTaken = busy.some((b) =>
      overlaps(slot.start, slot.end, DateTime.fromISO(b.start), DateTime.fromISO(b.end))
    );
    if (isTaken) {
      res.status(409).json({ error: "Nažalost, taj termin je upravo zauzet. Odaberite drugi." });
      return;
    }

    const event = await createEvent({
      summary: `Isprobavanje odijela – ${first} ${last}`,
      description: `Telefon: ${phoneClean}\nEmail: ${emailClean}`,
      startISO: slot.start.toISO(),
      endISO: slot.end.toISO(),
      extendedProperties: {
        bookingFirstName: first,
        bookingLastName: last,
        bookingPhone: phoneClean,
        bookingEmail: emailClean,
      },
    });

    const dLabel = dateLabel(slot.start);
    const tLabel = timeLabel(slot.start, slot.end);
    const cancelUrl = buildCancelUrl(event.id);

    await Promise.all([
      sendCustomerConfirmation({
        to: emailClean,
        firstName: first,
        lastName: last,
        dateLabel: dLabel,
        timeLabel: tLabel,
        cancelUrl,
      }),
      sendClientNotification({
        firstName: first,
        lastName: last,
        phone: phoneClean,
        email: emailClean,
        dateLabel: dLabel,
        timeLabel: tLabel,
        eventLink: event.htmlLink,
      }),
    ]);

    res.status(200).json({ ok: true, date: dLabel, time: tLabel });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri kreiranju rezervacije" });
  }
};
