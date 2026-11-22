"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="w-full py-2 text-sm text-ink-2 underline"
      onClick={async () => {
        await api("/api/auth/logout");
        router.replace("/");
        router.refresh();
      }}
    >
      התנתקות
    </button>
  );
}
