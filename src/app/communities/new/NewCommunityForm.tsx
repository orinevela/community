"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function NewCommunityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ id: string }>("/api/communities", { name, description });
      router.replace(`/c/${r.id}?created=1`);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-4">
      <div>
        <label className="label" htmlFor="cname">שם הקהילה</label>
        <input id="cname" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: שכונת הפרחים, הורי גן חצב, בוגרי מחזור 2010" required minLength={2} maxLength={60} autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="cdesc">תיאור קצר (רשות)</label>
        <textarea id="cdesc" className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="מי אנחנו ולמה כדאי להצטרף" />
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "יוצר…" : "יצירת הקהילה וקבלת קישור"}</button>
    </form>
  );
}
