import "./globals.css";
import { ReactNode } from "react";
import { startScheduler } from "@/lib/scheduler";

const isVercel = process.env.VERCEL === "1";

if (process.env.NODE_ENV !== "test" && !isVercel) {
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
