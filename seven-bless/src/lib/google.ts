import { calendar_v3 } from "@googleapis/calendar";
import { google } from "googleapis";
import { prisma } from "@/lib/db";

export async function getGoogleCalendarClient(userId: string): Promise<calendar_v3.Calendar | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}