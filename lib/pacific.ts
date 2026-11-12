import { TIME_SLOTS } from "./services";

/** Salon wall clock — every booking, confirmation, and calendar event. */
export const SALON_TZ = "America/Los_Angeles";
export const SALON_TZ_LABEL = "Pacific";

const MONTHS: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sept: 9,
  sep: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
};

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function civilIso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Add calendar days to an ISO date without involving the server timezone. */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return civilIso(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function weekdayIndexIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
}

export function pacificParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SALON_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday").toLowerCase(),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}

/** Today's calendar date in California. */
export function todayIsoPacific(now = new Date()): string {
  const p = pacificParts(now);
  return civilIso(p.year, p.month, p.day);
}

export function formatPacificDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(utc);
}

export function formatPacificTime(hhmm: string): string {
  const [hRaw, mRaw] = hhmm.split(":");
  let h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${pad(m)} ${suffix}`;
}

export function formatVisitWhen(isoDate: string, hhmm: string): string {
  return `${formatPacificDate(isoDate)} at ${formatPacificTime(hhmm)} ${SALON_TZ_LABEL}`;
}

export function formatSlotLabel(hhmm: string): string {
  return `${formatPacificTime(hhmm)} ${SALON_TZ_LABEL}`;
}

export function addMinutesCivil(isoDate: string, hhmm: string, minutes: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const end = new Date(Date.UTC(y, m - 1, d, hh, mm + minutes));
  return {
    date: civilIso(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()),
    time: `${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}`,
  };
}

/** Google Calendar local datetime (no Z) + explicit Pacific zone. */
export function pacificDateTime(isoDate: string, hhmm: string): string {
  return `${isoDate}T${hhmm}:00`;
}

function ordinalDay(raw: string): number | null {
  const m = raw.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 31) return null;
  return n;
}

function upcomingWeekday(todayIso: string, weekday: number, wantNext: boolean): string {
  const current = weekdayIndexIso(todayIso);
  let delta = (weekday - current + 7) % 7;
  if (wantNext) delta = delta === 0 ? 7 : delta + 7;
  return addDaysIso(todayIso, delta);
}

function monthDayToIso(
  month: number,
  day: number,
  todayIso: string,
  yearHint?: number,
): string | null {
  const [ty, tm] = todayIso.split("-").map(Number);
  const year = yearHint ?? (month < tm || (month === tm && day < Number(todayIso.slice(8)))
    ? ty + 1
    : ty);
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return civilIso(year, month, day);
}

/**
 * Turn ordinary date phrasing into a Pacific calendar date.
 * Accepts tomorrow, Friday, November 15, 11/15, and ISO (for tools/HTML pickers).
 */
export function parsePacificDate(input: string, now = new Date()): string | null {
  const today = todayIsoPacific(now);
  const trimmed = input.trim();
  if (!trimmed) return null;

  const iso = trimmed.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const raw = trimmed.toLowerCase().replace(/[,]/g, " ").replace(/\s+/g, " ");

  if (/\btoday\b/.test(raw)) return today;
  if (/\btomorrow\b/.test(raw)) return addDaysIso(today, 1);

  const slash = raw.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (slash) {
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    const year = slash[3]
      ? Number(slash[3].length === 2 ? `20${slash[3]}` : slash[3])
      : undefined;
    return monthDayToIso(month, day, today, year);
  }

  for (const [name, month] of Object.entries(MONTHS)) {
    const re = new RegExp(`\\b${name}\\b`);
    if (!re.test(raw)) continue;
    const after = raw.split(re)[1] ?? "";
    const before = raw.split(re)[0] ?? "";
    const day = ordinalDay(after) ?? ordinalDay(before);
    if (!day) continue;
    const yearMatch = raw.match(/\b(20\d{2})\b/);
    return monthDayToIso(month, day, today, yearMatch ? Number(yearMatch[1]) : undefined);
  }

  const wantNext = /\bnext\b/.test(raw);
  for (let i = 0; i < WEEKDAYS.length; i += 1) {
    const name = WEEKDAYS[i];
    if (new RegExp(`\\b${name}\\b`).test(raw)) {
      return upcomingWeekday(today, i, wantNext);
    }
  }

  return null;
}

/** Parse a spoken or typed time and snap to a salon slot when it matches. */
export function parsePacificTime(input: string): string | null {
  const raw = input.trim().toLowerCase().replace(/\./g, "");
  if (!raw) return null;
  if (/\bnoon\b/.test(raw) || /\bmidday\b/.test(raw)) return matchSlot("13:00");

  const mer = raw.match(
    /\b(\d{1,2})(?::(\d{2}))?\s*(o'?clock)?\s*(a\.?m\.?|p\.?m\.?|am|pm)?\b/,
  );
  if (!mer) return null;
  let hour = Number(mer[1]);
  const minute = mer[2] != null ? Number(mer[2]) : 0;
  const ap = mer[4]?.replace(/\./g, "");
  if (hour > 24 || minute > 59) return null;
  if (ap === "am" || ap === "a") {
    if (hour === 12) hour = 0;
  } else if (ap === "pm" || ap === "p") {
    if (hour !== 12) hour += 12;
  } else if (hour >= 1 && hour <= 7) {
    // Bare "4:30" during salon hours is 4:30 PM Pacific.
    hour += 12;
  }
  if (hour === 24) hour = 0;
  return matchSlot(`${pad(hour)}:${pad(minute)}`);
}

function matchSlot(hhmm: string): string | null {
  if ((TIME_SLOTS as readonly string[]).includes(hhmm)) return hhmm;
  return null;
}

export function resolveVisitWhen(
  dateHint: string,
  timeHint: string,
  now = new Date(),
):
  | { ok: true; date: string; time: string }
  | { ok: false; error: string } {
  const date = parsePacificDate(`${dateHint} ${timeHint}`, now) ?? parsePacificDate(dateHint, now);
  const time = parsePacificTime(timeHint) ?? parsePacificTime(dateHint);
  if (!date && !time) {
    return {
      ok: false,
      error:
        "I couldn't read that date and time in Pacific time. Try something like tomorrow, Friday, or November 15, and a salon time such as 11:30 AM.",
    };
  }
  if (!date) {
    return {
      ok: false,
      error:
        "Which Pacific date should I hold? Tomorrow, Friday, or November 15 all work — no special format needed.",
    };
  }
  if (!time) {
    return {
      ok: false,
      error: `I have ${formatPacificDate(date)} in Pacific time. Which slot — for example 11:30 AM?`,
    };
  }
  return { ok: true, date, time };
}
