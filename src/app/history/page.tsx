import { prisma } from "@/lib/db";
import { DateTime } from "luxon";

export default async function HistoryPage() {
  const logs = await prisma.deliveryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 14,
  });

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">History (최근 14일)</h1>
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{DateTime.fromJSDate(log.date).toFormat("yyyy-LL-dd")}</span>
              <span className="text-xs px-2 py-1 rounded bg-gray-100">{log.status}</span>
            </div>
            {log.message && <p className="mt-2 whitespace-pre-wrap">{log.message}</p>}
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              {log.tags?.split(",").filter(Boolean).map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-gray-100">{t}</span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 rounded border">재전송</button>
              <button className="px-3 py-1 rounded border" onClick={() => navigator.clipboard.writeText(log.message ?? "")}>복사</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}