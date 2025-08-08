import cron from "node-cron";
import { DateTime } from "luxon";
import { prisma } from "@/lib/db";
import { performDeliveryForUser } from "@/lib/worker";

export function startScheduler(): void {
  // Run every minute, align to user's timezone 07:00 and pending retries
  cron.schedule("* * * * *", async () => {
    const nowUtc = DateTime.utc();
    const users = await prisma.user.findMany({});

    for (const user of users) {
      const tz = user.timezone || "America/Vancouver";
      const nowLocal = nowUtc.setZone(tz);
      const [hour, minute] = (user.sendAt || "07:00").split(":").map((s) => parseInt(s, 10));

      // If now matches scheduled time
      if (nowLocal.hour === hour && nowLocal.minute === minute) {
        await performDeliveryForUser(user.id, nowLocal.toISODate()!);
      }

      // Pending retries due
      const dueRetries = await prisma.deliveryLog.findMany({
        where: { userId: user.id, status: "retrying", nextAttemptAt: { lte: nowUtc.toJSDate() } },
      });
      for (const log of dueRetries) {
        await performDeliveryForUser(user.id, DateTime.fromJSDate(log.date).toISODate()!);
      }
    }
  });
}