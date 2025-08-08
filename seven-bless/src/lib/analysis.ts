import { DateTime, Interval } from "luxon";
import type { calendar_v3 } from "@googleapis/calendar";

const KEYWORD_TAGS: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /deadline|pitch|presentation|interview|review/i, tag: "deadline" },
  { pattern: /flight|airport|travel/i, tag: "travel" },
];

export type DaySignals = {
  date: string; // YYYY-MM-DD local
  event_count: number;
  total_hours: number;
  back_to_back: boolean;
  keywords: string[];
  busy_score: number; // 0..10
  focus_score: number; // 0..10
  energy_hint: "morning" | "afternoon" | "evening";
  tags: string[];
};

export async function fetchTodayEvents(cal: calendar_v3.Calendar, timezone: string): Promise<calendar_v3.Schema$Event[]> {
  const start = DateTime.now().setZone(timezone).startOf("day").toISO();
  const end = DateTime.now().setZone(timezone).endOf("day").toISO();
  const { data } = await cal.events.list({
    calendarId: "primary",
    timeMin: start!,
    timeMax: end!,
    singleEvents: true,
    orderBy: "startTime",
  });
  return data.items ?? [];
}

export function computeSignals(events: calendar_v3.Schema$Event[], timezone: string): DaySignals {
  const localEvents = events
    .map((e) => {
      const startStr = e.start?.dateTime ?? e.start?.date;
      const endStr = e.end?.dateTime ?? e.end?.date;
      if (!startStr || !endStr) return null;
      const start = DateTime.fromISO(startStr, { zone: timezone });
      const end = DateTime.fromISO(endStr, { zone: timezone });
      return { e, start, end };
    })
    .filter(Boolean) as Array<{ e: calendar_v3.Schema$Event; start: DateTime; end: DateTime }>;

  const totalHours = localEvents.reduce((sum, r) => sum + r.end.diff(r.start, "hours").hours, 0);

  // Back-to-back check: any gaps < 10 minutes in 3+ consecutive events
  let maxStreak = 1;
  let currentStreak = 1;
  for (let i = 1; i < localEvents.length; i++) {
    const prev = localEvents[i - 1];
    const cur = localEvents[i];
    const gapMinutes = cur.start.diff(prev.end, "minutes").minutes;
    if (gapMinutes <= 10) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  const backToBack = maxStreak >= 3;

  // Keywords
  const titles = localEvents.map((r) => `${r.e.summary ?? ""} ${r.e.description ?? ""}`);
  const keywords = Array.from(
    new Set(
      KEYWORD_TAGS.flatMap(({ pattern }) =>
        titles.flatMap((t) => (t.match(pattern) ? (t.match(pattern)?.map((m) => m.toLowerCase()) ?? []) : []))
      )
    )
  ).slice(0, 8);

  // Scores
  const eventCount = localEvents.length;
  const busyScore = Math.max(0, Math.min(10, Math.round(eventCount + (backToBack ? 2 : 0) + Math.min(4, totalHours / 2))));
  const focusScore = Math.max(
    0,
    Math.min(
      10,
      Math.round((totalHours >= 3 ? 4 : 0) + (keywords.length > 0 ? 3 : 0) + (localEvents.some((r) => r.end.diff(r.start, "hours").hours >= 2) ? 3 : 0))
    )
  );

  // Energy hint by distribution of events
  const morningMinutes = minutesInSpan(localEvents, 6, 12);
  const afternoonMinutes = minutesInSpan(localEvents, 12, 18);
  const eveningMinutes = minutesInSpan(localEvents, 18, 24);
  const energy_hint = maxIndex([morningMinutes, afternoonMinutes, eveningMinutes]) === 0 ? "morning" : maxIndex([morningMinutes, afternoonMinutes, eveningMinutes]) === 1 ? "afternoon" : "evening";

  // Tags
  const tags = new Set<string>();
  if (eventCount <= 1 && totalHours < 1) tags.add("light");
  if (backToBack || totalHours >= 6 || eventCount >= 6) tags.add("busy");
  for (const { pattern, tag } of KEYWORD_TAGS) {
    if (titles.some((t) => pattern.test(t))) tags.add(tag);
  }

  return {
    date: DateTime.now().setZone(timezone).toISODate()!,
    event_count: eventCount,
    total_hours: Number(totalHours.toFixed(2)),
    back_to_back: backToBack,
    keywords,
    busy_score: busyScore,
    focus_score: focusScore,
    energy_hint: energy_hint,
    tags: Array.from(tags),
  };
}

function minutesInSpan(
  events: Array<{ start: DateTime; end: DateTime }>,
  startHour: number,
  endHour: number
): number {
  const day = DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  const span = Interval.fromDateTimes(day.plus({ hours: startHour }), day.plus({ hours: endHour }));
  return events.reduce((sum, r) => sum + span.intersection(Interval.fromDateTimes(r.start, r.end))?.length("minutes") ?? 0, 0);
}

function maxIndex(values: number[]): number {
  let idx = 0;
  for (let i = 1; i < values.length; i++) if (values[i] > values[idx]) idx = i;
  return idx;
}