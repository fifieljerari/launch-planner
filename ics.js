// Builds an iCalendar (.ics) file from the generated launch milestones.
// Plain browser JavaScript, no dependencies. Exposed as globalThis.LaunchPlannerIcs
// so index.html can use it and the Node tests can import it.
(function (root) {
  "use strict";

  const CRLF = "\r\n";

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  // Local calendar date -> YYYYMMDD (all-day values, no timezone involved).
  function toIcsDate(date) {
    return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate());
  }

  // UTC timestamp -> YYYYMMDDTHHMMSSZ, used for DTSTAMP.
  function toIcsTimestamp(date) {
    return (
      date.getUTCFullYear() + pad(date.getUTCMonth() + 1) + pad(date.getUTCDate()) +
      "T" + pad(date.getUTCHours()) + pad(date.getUTCMinutes()) + pad(date.getUTCSeconds()) + "Z"
    );
  }

  // RFC 5545 §3.3.11: escape backslash, semicolon, comma and line breaks in TEXT values.
  function escapeText(value) {
    return String(value == null ? "" : value)
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\r\n|\r|\n/g, "\\n");
  }

  // RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + a space.
  // Splits on code-point boundaries so multi-byte UTF-8 characters stay intact.
  function foldLine(line) {
    const encoder = new TextEncoder();
    const parts = [];
    let current = "";
    let currentBytes = 0;
    let limit = 75;
    for (const ch of line) {
      const bytes = encoder.encode(ch).length;
      if (currentBytes + bytes > limit) {
        parts.push(current);
        current = "";
        currentBytes = 0;
        limit = 74; // continuation lines start with a space, which counts toward 75
      }
      current += ch;
      currentBytes += bytes;
    }
    parts.push(current);
    return parts.join(CRLF + " ");
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function randomToken() {
    if (root.crypto && typeof root.crypto.randomUUID === "function") return root.crypto.randomUUID();
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
  }

  // events: [{ id, title, date (Date), description }]
  function buildIcs(events, options) {
    const opts = options || {};
    const now = opts.now || new Date();
    const token = opts.uidToken || randomToken();
    const dtstamp = toIcsTimestamp(now);

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Launch Planner//Launch Milestones//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    events.forEach((ev, i) => {
      lines.push(
        "BEGIN:VEVENT",
        "UID:" + escapeText(ev.id || "event-" + i) + "-" + toIcsDate(ev.date) + "-" + token + "@launch-planner",
        "DTSTAMP:" + dtstamp,
        "DTSTART;VALUE=DATE:" + toIcsDate(ev.date),
        "DTEND;VALUE=DATE:" + toIcsDate(addDays(ev.date, 1)),
        "SUMMARY:" + escapeText(ev.title),
        "TRANSP:TRANSPARENT"
      );
      if (ev.description) lines.push("DESCRIPTION:" + escapeText(ev.description));
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    return lines.map(foldLine).join(CRLF) + CRLF;
  }

  function icsFileName(launchDateStr) {
    return "launch-plan-" + launchDateStr + ".ics";
  }

  root.LaunchPlannerIcs = { buildIcs, escapeText, foldLine, icsFileName, toIcsDate };
})(typeof window !== "undefined" ? window : globalThis);
