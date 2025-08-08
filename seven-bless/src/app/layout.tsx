import "./globals.css";
import { ReactNode } from "react";
import { startScheduler } from "@/lib/scheduler";

if (process.env.NODE_ENV !== "test") {
  // Fire and forget scheduler
  try {
    startScheduler();
  } catch {}
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
