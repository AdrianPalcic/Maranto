const TIMEZONE = "Europe/Zagreb";

// Jednosatno isprobavanje; zadnja dva termina radnim danom nemaju buffer.
const SLOTS = [
  { start: "12:00", end: "13:00" },
  { start: "13:30", end: "14:30" },
  { start: "15:00", end: "16:00" },
  { start: "16:30", end: "17:30" },
  { start: "18:00", end: "19:00" },
  { start: "19:00", end: "20:00" },
];

const SATURDAY_SLOTS = [
  { start: "10:00", end: "11:00" },
  { start: "11:30", end: "12:30" },
  { start: "13:00", end: "14:00" },
];

const BOOKING_WINDOW_MONTHS = 2;
const MIN_NOTICE_HOURS = 1;

module.exports = {
  TIMEZONE,
  SLOTS,
  SATURDAY_SLOTS,
  BOOKING_WINDOW_MONTHS,
  MIN_NOTICE_HOURS,
  CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
};
