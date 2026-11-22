"use client";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { ContactActions } from "./ContactActions";
import { api } from "@/lib/client";
import type { Contacts } from "@/lib/taxonomy";

type Result = {
  memberId: string;
  score: number;
  reason: string;
  icebreaker: string;
  distanceKm: number | null;
  member: { id: string; name: string; photo: string | null; city: string | null; neighborhood: string | null; phone: string | null; contacts: Contacts; availability: string };
};
type Response = { searchId: number; engine: "ai" | "keyword"; interpretedNeed: string; results: Result[] };

const EXAMPLES = ["נשבר לי הברז במטבח וצריך עזרה דחופה", "מחפש עבודה בדאטה וצריך עזרה בהכנה לראיון", "למי יש מקדחה להשאיל?", "מישהו מכיר רו״ח טוב להחזר מס?"];

export function SearchPanel({ communityId, aiEnabled }: { communityId: string; aiEnabled: boolean }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Response | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(query: string) {
    if (query.trim().length < 2) return;
    setBusy(true);
    setErr(null);
    try {
      setRes(await api<Response>(`/api/communities/${communityId}/search`, { query }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="card p-3"
      >
        <label htmlFor="q" className="mb-2 block px-1 text-lg font-semibold">במה צריך עזרה?</label>
        <textarea
          id="q"
          className="input min-h-[84px] resize-none"
          placeholder="כתבו בחופשיות, כמו שהייתם שואלים בקבוצה…"
          value={q}
          maxLength={500}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run(q);
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="px-1 text-xs text-ink-2">{aiEnabled ? "✨ חיפוש חכם שמבין שפה חופשית" : "חיפוש לפי מילות מפתח"}</span>
          <button className="btn-primary px-6 py-2.5" disabled={busy || q.trim().length < 2}>
            {busy ? "מחפש…" : "חיפוש"}
          </button>
        </div>
      </form>

      {!res && !busy && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} className="chip text-[13px]" onClick={() => { setQ(e); run(e); }}>
              {e}
            </button>
          ))}
        </div>
      )}

      {err && <p className="text-sm text-danger">{err}</p>}

      {busy && (
        <div className="space-y-3" aria-live="polite" aria-label="מחפש">
          {[0, 1].map((i) => (
            <div key={i} className="card animate-pulse p-4">
              <div className="flex gap-3">
                <div className="h-12 w-12 rounded-full bg-surface-2" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-surface-2" />
                  <div className="h-3 w-5/6 rounded bg-surface-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {res && !busy && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex items-center justify-between text-sm text-ink-2">
            <span>
              {res.results.length ? `${res.results.length} התאמות` : "לא נמצאה התאמה"}
              {res.interpretedNeed && res.engine === "ai" ? ` · ${res.interpretedNeed}` : ""}
            </span>
            <button className="underline" onClick={() => { setRes(null); setQ(""); }}>חיפוש חדש</button>
          </div>

          {res.results.length === 0 && (
            <div className="card p-5 text-center text-sm text-ink-2">
              עדיין אין בקהילה מישהו שמתאים לבקשה הזו. נסו לנסח אחרת, או שאלו בקבוצת הוואטסאפ ושתפו את קישור ההזמנה – אולי מי שיכול לעזור עוד לא הצטרף.
            </div>
          )}

          {res.results.map((r) => (
            <article key={r.memberId} className="card space-y-3 p-4">
              <Link href={`/c/${communityId}/m/${r.memberId}?s=${res.searchId}`} className="flex items-center gap-3">
                <Avatar name={r.member.name} photo={r.member.photo} size={52} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{r.member.name}</h3>
                    {r.score >= 80 && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">התאמה גבוהה</span>}
                  </div>
                  <p className="text-sm text-ink-2">
                    {[r.member.neighborhood, r.member.city].filter(Boolean).join(", ")}
                    {r.distanceKm != null && r.distanceKm >= 1 ? ` · ${Math.round(r.distanceKm)} ק״מ` : r.distanceKm != null ? " · קרוב אליך" : ""}
                  </p>
                </div>
              </Link>
              <p className="rounded-xl bg-surface-2 px-3 py-2 text-[15px] leading-relaxed">
                <span className="me-1" aria-hidden>💡</span>
                {r.reason}
              </p>
              {r.member.availability && <p className="text-xs text-ink-2">🕒 {r.member.availability}</p>}
              <ContactActions communityId={communityId} memberId={r.memberId} name={r.member.name} phone={r.member.phone} contacts={r.member.contacts} searchId={res.searchId} icebreaker={r.icebreaker} compact />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
