const TIMEZONE = "Europe/Zagreb";

// 1h isprobavanje + 30 min buffer nakon = 1.5h blok, pon-pet 12:00-19:00
const SLOTS = [
  { start: "12:00", end: "13:00" },
  { start: "13:30", end: "14:30" },
  { start: "15:00", end: "16:00" },
  { start: "16:30", end: "17:30" },
  { start: "18:00", end: "19:00" },
];

const BOOKING_WINDOW_MONTHS = 2;
const MIN_NOTICE_HOURS = 1;

module.exports = {
  TIMEZONE,
  SLOTS,
  BOOKING_WINDOW_MONTHS,
  MIN_NOTICE_HOURS,
  CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
};
