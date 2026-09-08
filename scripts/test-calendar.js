process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 = process.argv[2];
process.env.GOOGLE_CALENDAR_ID = process.argv[3];

const { getBusyPeriods } = require("../api/_lib/googleCalendar");
const { DateTime } = require("luxon");

(async () => {
  const now = DateTime.now();
  const later = now.plus({ days: 7 });
  try {
    const busy = await getBusyPeriods(now.toISO(), later.toISO());
    console.log("USPJEH. Pristup kalendaru radi.");
    console.log("Busy periodi u sljedecih 7 dana:", JSON.stringify(busy, null, 2));
  } catch (err) {
    console.error("NEUSPJEH:", err.message);
    if (err.response && err.response.data) {
      console.error(JSON.stringify(err.response.data, null, 2));
    }
  }
})();
