"use client";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [locale, setLocale] = useState("ko");
  const [tone, setTone] = useState("warm");
  const [channel, setChannel] = useState("email");
  const [timezone, setTimezone] = useState("America/Vancouver");
  const [sendAt, setSendAt] = useState("07:00");
  const [phone, setPhone] = useState("");
  const [retain, setRetain] = useState(false);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/user/me", { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }
      if (res.ok) {
        const u = await res.json();
        setLocale(u.locale ?? "ko");
        setTone(u.tone ?? "warm");
        setChannel(u.channel ?? "email");
        setTimezone(u.timezone ?? "America/Vancouver");
        setSendAt(u.sendAt ?? "07:00");
        setPhone(u.phone ?? "");
        setRetain(!u.retainEventText);
      }
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    await fetch("/api/user/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        tone,
        channel,
        timezone,
        sendAt,
        phone,
        retainEventText: !retain,
      }),
    });
  };

  const onPreview = async () => {
    setPreview("생성 중...");
    const res = await fetch(`/api/preview`, { cache: "no-store" });
    if (res.status === 401) {
      window.location.href = "/api/auth/signin";
      return;
    }
    if (!res.ok) {
      setPreview("미리보기 실패");
      return;
    }
    const data = await res.json();
    setPreview(data.message);
  };

  if (loading) return <main className="max-w-xl mx-auto p-6">Loading...</main>;

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex flex-col gap-1">
          <span>언어</span>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className="border p-2 rounded">
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>톤</span>
          <select value={tone} onChange={(e) => setTone(e.target.value)} className="border p-2 rounded">
            <option value="warm">warm</option>
            <option value="humour">humour</option>
            <option value="serious">serious</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>채널</span>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="border p-2 rounded">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span>시간대</span>
          <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="border p-2 rounded" />
        </label>
        <label className="flex flex-col gap-1">
          <span>발송 시간</span>
          <input type="time" value={sendAt} onChange={(e) => setSendAt(e.target.value)} className="border p-2 rounded" />
        </label>
        {channel === "sms" && (
          <label className="flex flex-col gap-1">
            <span>휴대폰 번호</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="border p-2 rounded" />
          </label>
        )}
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={!retain} onChange={(e) => setRetain(!e.target.checked)} />
          이벤트 원문 저장 안 함(권장)
        </label>
        <div className="flex gap-2">
          <button onClick={onSave} className="px-4 py-2 rounded bg-black text-white">저장</button>
          <button onClick={onPreview} className="px-4 py-2 rounded border">내일 메시지 미리보기</button>
        </div>
        {preview && <p className="text-sm text-gray-700 whitespace-pre-wrap">{preview}</p>}
      </div>
    </main>
  );
}