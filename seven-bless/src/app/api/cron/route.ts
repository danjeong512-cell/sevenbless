import { prisma } from "@/lib/db";
import { DateTime } from "luxon";
import { performDeliveryForUser } from "@/lib/worker";

export async function GET() {
  const nowUtc = DateTime.utc();
  const users = await prisma.user.findMany({});

  for (const user of users) {
    const tz = user.timezone || "America/Vancouver";
    const nowLocal = nowUtc.setZone(tz);
    const [hour, minute] = (user.sendAt || "07:00").split(":").map((s) => parseInt(s, 10));

    if (nowLocal.hour === hour && nowLocal.minute === minute) {
      await performDeliveryForUser(user.id, nowLocal.toISODate()!);
    }

    const dueRetries = await prisma.deliveryLog.findMany({
      where: { userId: user.id, status: "retrying", nextAttemptAt: { lte: nowUtc.toJSDate() } },
    });
    for (const log of dueRetries) {
      await performDeliveryForUser(user.id, DateTime.fromJSDate(log.date).toISODate()!);
    }
  }

  return Response.json({ ok: true, checkedUsers: users.length });
}