import { prisma } from "@/lib/db";
import { getGoogleCalendarClient } from "@/lib/google";
import { fetchTodayEvents, computeSignals } from "@/lib/analysis";
import { generateMessage } from "@/lib/ai";
import { sendEmail, sendSMS } from "@/lib/messager";
import { DateTime } from "luxon";

const MAX_ATTEMPTS = 3;

export async function performDeliveryForUser(userId: string, localDateISO: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const timezone = user.timezone || "America/Vancouver";
  const locale = (user.locale as any) || "ko";
  const tone = (user.tone as any) || "warm";
  const channel = (user.channel as any) || "email";

  // Fetch signals
  const cal = await getGoogleCalendarClient(userId);
  let signals = {
    date: localDateISO,
    event_count: 0,
    total_hours: 0,
    back_to_back: false,
    keywords: [] as string[],
    busy_score: 0,
    focus_score: 0,
    energy_hint: "morning" as const,
    tags: ["light"],
  };
  try {
    if (cal) {
      const events = await fetchTodayEvents(cal, timezone);
      signals = computeSignals(events, timezone);
      // Persist DailySignal (derived only)
      await prisma.dailySignal.upsert({
        where: { userId_date: { userId: user.id, date: DateTime.fromISO(signals.date).toJSDate() } as any },
        create: {
          userId: user.id,
          date: DateTime.fromISO(signals.date).toJSDate(),
          eventCount: signals.event_count,
          totalHours: signals.total_hours,
          backToBack: signals.back_to_back,
          keywords: signals.keywords.join(","),
          busyScore: signals.busy_score,
          focusScore: signals.focus_score,
          energyHint: signals.energy_hint,
          tags: signals.tags.join(","),
        },
        update: {
          eventCount: signals.event_count,
          totalHours: signals.total_hours,
          backToBack: signals.back_to_back,
          keywords: signals.keywords.join(","),
          busyScore: signals.busy_score,
          focusScore: signals.focus_score,
          energyHint: signals.energy_hint,
          tags: signals.tags.join(","),
        },
      });
    }
  } catch (e) {
    // fall back to light day
  }

  // Generate message
  const message = await generateMessage({ locale, tone, signals });

  // Deliver
  const subject = "[Seven Bless] 오늘의 한 줄 응원";
  let ok = false;
  let error: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (channel === "sms") {
        if (!user.phone) throw new Error("no phone");
        const smsBody = message.length > 140 ? message.slice(0, 138) + "…" : message;
        await sendSMS(user.phone, smsBody);
      } else {
        if (!user.email) throw new Error("no email");
        await sendEmail(user.email, subject, message);
      }
      ok = true;
      await prisma.deliveryLog.create({
        data: {
          userId: user.id,
          date: DateTime.fromISO(localDateISO).toJSDate(),
          channel,
          status: "sent",
          attempts: attempt,
          message, // optional retain derived
          tags: signals.tags.join(","),
        },
      });
      break;
    } catch (err: any) {
      error = err?.message ?? "unknown";
      const backoffMin = Math.pow(2, attempt - 1); // 1,2,4
      await prisma.deliveryLog.create({
        data: {
          userId: user.id,
          date: DateTime.fromISO(localDateISO).toJSDate(),
          channel,
          status: attempt < MAX_ATTEMPTS ? "retrying" : "failed",
          attempts: attempt,
          error: sanitizeError(error),
          nextAttemptAt: attempt < MAX_ATTEMPTS ? DateTime.utc().plus({ minutes: backoffMin }).toJSDate() : null,
          tags: signals.tags.join(","),
        },
      });
      if (attempt >= MAX_ATTEMPTS) break;
    }
  }

  if (!ok && !error) {
    await prisma.deliveryLog.create({
      data: {
        userId: user.id,
        date: DateTime.fromISO(localDateISO).toJSDate(),
        channel,
        status: "failed",
        attempts: MAX_ATTEMPTS,
        tags: signals.tags.join(","),
      },
    });
  }
}

function sanitizeError(err: string): string {
  // Strip possible PII
  return err.replace(/[\w.-]+@[\w.-]+/g, "[redacted]");
}