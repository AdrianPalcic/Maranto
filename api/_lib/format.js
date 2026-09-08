function dateLabel(dt) {
  return dt.setLocale("hr").toFormat("cccc, d. MMMM yyyy.");
}

function timeLabel(start, end) {
  return `${start.toFormat("HH:mm")}–${end.toFormat("HH:mm")}`;
}

module.exports = { dateLabel, timeLabel };
