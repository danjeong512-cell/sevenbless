import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("unauthorized", { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return new Response("no user", { status: 404 });
  return Response.json(user);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions as any);
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("unauthorized", { status: 401 });
  const data = await request.json();
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      locale: data.locale,
      tone: data.tone,
      channel: data.channel,
      timezone: data.timezone,
      sendAt: data.sendAt,
      phone: data.phone,
      retainEventText: data.retainEventText,
    },
  });
  return Response.json(updated);
}

export async function DELETE() {
  const session = await getServerSession(authOptions as any);
  const userId = (session?.user as any)?.id;
  if (!userId) return new Response("unauthorized", { status: 401 });
  await prisma.deliveryLog.deleteMany({ where: { userId } });
  await prisma.dailySignal.deleteMany({ where: { userId } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  return new Response(null, { status: 204 });
}