import Link from "next/link";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav className="border-b p-4 flex gap-4">
        <Link href="/">Home</Link>
        <Link href="/settings">Settings</Link>
        <Link href="/history">History</Link>
      </nav>
      <div>{children}</div>
    </div>
  );
}