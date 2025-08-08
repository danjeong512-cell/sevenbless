import { performDeliveryForUser } from "@/lib/worker";

export async function POST(request: Request) {
  const body = await request.json();
  const userId = body.userId as string;
  const date = (body.date as string) ?? new Date().toISOString().slice(0, 10);
  if (!userId) return new Response("missing userId", { status: 400 });
  await performDeliveryForUser(userId, date);
  return Response.json({ ok: true });
}