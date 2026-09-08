const { DateTime } = require("luxon");
const { TIMEZONE } = require("./_lib/config");
const { getEvent, deleteEvent } = require("./_lib/googleCalendar");
const { verify } = require("./_lib/cancelToken");
const { sendCustomerCancelled, sendClientCancelNotification } = require("./_lib/email");
const { dateLabel, timeLabel } = require("./_lib/format");

function page(title, message) {
  return `<!DOCTYPE html><html lang="hr"><head><meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    body{font-family:Georgia,serif;background:#1A1A1A;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;text-align:center;}
    h1{color:#bc8e31;text-transform:uppercase;letter-spacing:1px;}
  </style></head>
  <body><div><h1>${title}</h1><p>${message}</p></div></body></html>`;
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).send(page("Greška", "Metoda nije dozvoljena."));
    return;
  }

  const { eventId, token } = req.query;
  if (!eventId || !token || !verify(String(eventId), String(token))) {
    res.status(403).send(page("Nevažeći link", "Ovaj link za otkazivanje nije valjan."));
    return;
  }

  try {
    const event = await getEvent(String(eventId));
    const props = (event.extendedProperties && event.extendedProperties.private) || {};
    const start = DateTime.fromISO(event.start.dateTime, { zone: TIMEZONE });
    const end = DateTime.fromISO(event.end.dateTime, { zone: TIMEZONE });
    const dLabel = dateLabel(start);
    const tLabel = timeLabel(start, end);

    await deleteEvent(String(eventId));

    const jobs = [];
    if (props.bookingEmail) {
      jobs.push(
        sendCustomerCancelled({
          to: props.bookingEmail,
          firstName: props.bookingFirstName || "",
          lastName: props.bookingLastName || "",
          dateLabel: dLabel,
          timeLabel: tLabel,
        })
      );
    }
    jobs.push(
      sendClientCancelNotification({
        firstName: props.bookingFirstName || "",
        lastName: props.bookingLastName || "",
        dateLabel: dLabel,
        timeLabel: tLabel,
      })
    );
    await Promise.all(jobs);

    res.status(200).send(page("Termin otkazan", `Vaš termin ${dLabel} u ${tLabel} je uspješno otkazan.`));
  } catch (err) {
    console.error(err);
    res.status(500).send(page("Greška", "Nismo uspjeli otkazati termin. Kontaktirajte nas izravno."));
  }
};
