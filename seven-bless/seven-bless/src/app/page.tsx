import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">Seven Bless</h1>
        <p className="text-gray-600">매일 오전 7시, 일정에 맞춘 짧고 따뜻한 응원을 전해드려요.</p>
        <div className="flex items-center justify-center gap-3">
          <Link className="px-4 py-2 rounded bg-black text-white" href="/api/auth/signin">Google로 시작</Link>
          <Link className="px-4 py-2 rounded border" href="/settings">설정</Link>
          <Link className="px-4 py-2 rounded border" href="/history">히스토리</Link>
        </div>
        <ul className="text-left text-sm text-gray-500 list-disc list-inside">
          <li>Google Calendar 읽기 권한만 요청합니다.</li>
          <li>이벤트 원문은 저장하지 않으며, 파생 지표만 보관합니다.</li>
          <li>언제든 데이터 삭제 요청 시 즉시 삭제됩니다.</li>
        </ul>
      </div>
    </main>
  );
}
