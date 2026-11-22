"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function JoinButton({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <button
        className="btn-primary w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const r = await api<{ communityId: string; profileCompleted: boolean }>("/api/join", { code });
            const dest = `/c/${r.communityId}`;
            router.replace(r.profileCompleted ? dest : `/profile?next=${encodeURIComponent(dest)}`);
            router.refresh();
          } catch (e) {
            setErr((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? "מצטרף…" : "הצטרפות לקהילה"}
      </button>
      {err && <p className="text-sm text-danger">{err}</p>}
    </div>
  );
}
