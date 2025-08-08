import { prisma } from "@/lib/db";
import { getGoogleCalendarClient } from "@/lib/google";
import { fetchTodayEvents, computeSignals } from "@/lib/analysis";
import { generateMessage } from "@/lib/ai";
import { DateTime } from "luxon";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions as any);
  let userId = (session?.user as any)?.id;
  if (!userId) return new Response("unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return new Response("user not found", { status: 404 });

  const timezone = user.timezone || "America/Vancouver";
  const locale = (user.locale as any) || "ko";
  const tone = (user.tone as any) || "warm";

  const cal = await getGoogleCalendarClient(userId);
  let signals = {
    date: DateTime.now().setZone(timezone).toISODate()!,
    event_count: 0,
    total_hours: 0,
    back_to_back: false,
    keywords: [] as string[],
    busy_score: 0,
    focus_score: 0,
    energy_hint: "morning" as const,
    tags: ["light"],
  };

  if (cal) {
    const events = await fetchTodayEvents(cal, timezone);
    signals = computeSignals(events, timezone);
  }

  const message = await generateMessage({ locale, tone, signals });
  return Response.json({ message, signals });
}