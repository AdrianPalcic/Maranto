const { Resend } = require("resend");

let cachedResend = null;
function getResend() {
  if (!cachedResend) cachedResend = new Resend(process.env.RESEND_API_KEY);
  return cachedResend;
}

const GOLD = "#bc8e31";

function wrapHtml(bodyHtml) {
  return `
  <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
    <h1 style="font-size: 20px; letter-spacing: 1px; text-transform: uppercase; color: ${GOLD}; margin-bottom: 16px;">Maranto</h1>
    ${bodyHtml}
    <p style="margin-top: 32px; font-size: 13px; color: #888;">Maranto salon odijela &middot; Ulica Dragutina Domjanića 23, Zagreb</p>
  </div>`;
}

async function sendCustomerConfirmation({ to, firstName, lastName, dateLabel, timeLabel, cancelUrl }) {
  const html = wrapHtml(`
    <p>Poštovani/a ${firstName} ${lastName},</p>
    <p>Vaš termin za isprobavanje odijela je potvrđen:</p>
    <p style="font-size: 18px; font-weight: bold;">${dateLabel}, ${timeLabel}</p>
    <p>Adresa: Ulica Dragutina Domjanića 23, Zagreb</p>
    ${cancelUrl ? `<p>Ako trebate otkazati termin, kliknite <a href="${cancelUrl}" style="color:${GOLD};">ovdje</a>.</p>` : ""}
    <p>Za sva ostala pitanja ili izmjenu termina, samo odgovorite na ovaj email i javit ćemo vam se.</p>
    <p>Radujemo se vašem posjetu!</p>
  `);
  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    reply_to: process.env.CLIENT_NOTIFY_EMAIL,
    subject: "Potvrda termina – Maranto",
    html,
  });
}

async function sendClientNotification({ firstName, lastName, phone, email, dateLabel, timeLabel, eventLink }) {
  const html = wrapHtml(`
    <p>Nova rezervacija termina:</p>
    <p style="font-size: 18px; font-weight: bold;">${dateLabel}, ${timeLabel}</p>
    <p>Ime i prezime: ${firstName} ${lastName}<br/>
    Telefon: ${phone}<br/>
    Email: ${email}</p>
    ${eventLink ? `<p><a href="${eventLink}" style="color:${GOLD};">Otvori u Google kalendaru</a></p>` : ""}
  `);
  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: process.env.CLIENT_NOTIFY_EMAIL,
    reply_to: email,
    subject: `Nova rezervacija – ${firstName} ${lastName}`,
    html,
  });
}

async function sendCustomerCancelled({ to, firstName, lastName, dateLabel, timeLabel }) {
  const html = wrapHtml(`
    <p>Poštovani/a ${firstName} ${lastName},</p>
    <p>Vaš termin ${dateLabel} u ${timeLabel} je otkazan.</p>
    <p>Ako želite zakazati novi termin ili imate pitanja, slobodno odgovorite na ovaj email.</p>
  `);
  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    reply_to: process.env.CLIENT_NOTIFY_EMAIL,
    subject: "Termin otkazan – Maranto",
    html,
  });
}

async function sendClientCancelNotification({ firstName, lastName, dateLabel, timeLabel }) {
  const html = wrapHtml(`
    <p>Termin je otkazan od strane klijenta:</p>
    <p style="font-size: 18px; font-weight: bold;">${dateLabel}, ${timeLabel}</p>
    <p>${firstName} ${lastName}</p>
  `);
  return getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: process.env.CLIENT_NOTIFY_EMAIL,
    subject: `Otkazan termin – ${firstName} ${lastName}`,
    html,
  });
}

module.exports = {
  sendCustomerConfirmation,
  sendClientNotification,
  sendCustomerCancelled,
  sendClientCancelNotification,
};
