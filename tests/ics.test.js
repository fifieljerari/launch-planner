import { test } from "node:test";
import assert from "node:assert/strict";
import "../ics.js";

const { buildIcs, escapeText, icsFileName } = globalThis.LaunchPlannerIcs;

const milestones = [
  { id: "content", title: "Content production window begins", date: new Date(2027, 2, 1), description: "6 weeks before launch.\n\nWhy it matters: shoots, edits; reviews take time." },
  { id: "creator", title: "Creator / influencer outreach begins", date: new Date(2027, 2, 8), description: "5 weeks before launch." },
  { id: "launch", title: "Launch day", date: new Date(2027, 3, 12), description: "Launch day, finally; go \\ live." },
  { id: "checkin", title: "First performance check-in", date: new Date(2027, 3, 26), description: "A long note that keeps going so the line must be folded at seventy-five octets — with an emoji 🚀 and accents éèà to check multi-byte folding." }
];
const now = new Date(Date.UTC(2026, 9, 4, 12, 30, 5));
const ics = buildIcs(milestones, { now, uidToken: "test" });
const unfolded = ics.replace(/\r\n /g, "");
const lines = unfolded.split("\r\n").slice(0, -1);

test("uses CRLF line endings everywhere and ends with CRLF", () => {
  assert.ok(ics.endsWith("\r\n"));
  assert.equal(ics.replace(/\r\n/g, "").includes("\n"), false, "bare LF found");
  assert.equal(ics.replace(/\r\n/g, "").includes("\r"), false, "bare CR found");
});

test("has balanced VCALENDAR / VEVENT blocks with one event per milestone", () => {
  assert.equal(lines[0], "BEGIN:VCALENDAR");
  assert.equal(lines.at(-1), "END:VCALENDAR");
  assert.ok(lines.includes("VERSION:2.0"));
  assert.ok(lines.some((l) => l.startsWith("PRODID:")));
  const begins = lines.filter((l) => l === "BEGIN:VEVENT").length;
  const ends = lines.filter((l) => l === "END:VEVENT").length;
  assert.equal(begins, milestones.length);
  assert.equal(ends, milestones.length);
  let open = false;
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") { assert.equal(open, false); open = true; }
    if (l === "END:VEVENT") { assert.equal(open, true); open = false; }
  }
});

test("each event is all-day with unique UID, DTSTAMP and summary", () => {
  const events = unfolded.split("BEGIN:VEVENT\r\n").slice(1).map((b) => b.split("END:VEVENT")[0]);
  const uids = events.map((e) => e.match(/^UID:(.+)$/m)[1]);
  assert.equal(new Set(uids).size, milestones.length);
  events.forEach((e, i) => {
    assert.match(e, /^DTSTAMP:20261004T123005Z$/m);
    assert.match(e, /^DTSTART;VALUE=DATE:\d{8}$/m);
    assert.match(e, /^DTEND;VALUE=DATE:\d{8}$/m);
    assert.ok(e.includes("SUMMARY:" + escapeText(milestones[i].title)));
  });
  assert.match(events[0], /^DTSTART;VALUE=DATE:20270301$/m);
  assert.match(events[0], /^DTEND;VALUE=DATE:20270302$/m);
  assert.match(events[2], /^DTSTART;VALUE=DATE:20270412$/m);
});

test("escapes commas, semicolons, backslashes and line breaks", () => {
  assert.equal(escapeText("a,b;c\\d\ne\r\nf"), "a\\,b\\;c\\\\d\\ne\\nf");
  assert.ok(unfolded.includes("DESCRIPTION:6 weeks before launch.\\n\\nWhy it matters: shoots\\, edits\\; reviews take time."));
  assert.ok(unfolded.includes("DESCRIPTION:Launch day\\, finally\\; go \\\\ live."));
});

test("folds lines at 75 octets without splitting characters", () => {
  for (const physical of ics.split("\r\n")) {
    assert.ok(Buffer.byteLength(physical, "utf8") <= 75, "line too long: " + physical);
    assert.equal(physical.includes("�"), false);
  }
  assert.ok(unfolded.includes("🚀 and accents éèà"));
});

test("file name uses the launch date", () => {
  assert.equal(icsFileName("2027-04-12"), "launch-plan-2027-04-12.ics");
});
