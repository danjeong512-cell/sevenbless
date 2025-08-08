import { prisma } from "@/lib/db";

export async function GET() {
  // TODO: bind to session user
  const user = await prisma.user.findFirst();
  if (!user) return new Response("no user", { status: 404 });
  return Response.json(user);
}

export async function POST(request: Request) {
  const data = await request.json();
  // TODO: bind to session user; using first user for now
  const user = await prisma.user.findFirst();
  if (!user) return new Response("no user", { status: 404 });
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      locale: data.locale ?? user.locale,
      tone: data.tone ?? user.tone,
      channel: data.channel ?? user.channel,
      timezone: data.timezone ?? user.timezone,
      sendAt: data.sendAt ?? user.sendAt,
      phone: data.phone ?? user.phone,
      retainEventText: data.retainEventText ?? user.retainEventText,
    },
  });
  return Response.json(updated);
}