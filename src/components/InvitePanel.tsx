"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/client";

type Stats = { members: number; completed: number; activationRate: number; searches: number; searchToContactRate: number; mau: number; contacts30d: number };
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function InvitePanel({ communityId, inviteCode, communityName, highlight, stats }: { communityId: string; inviteCode: string; communityName: string; highlight: boolean; stats: Stats }) {
  const [code, setCode] = useState(inviteCode);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(highlight);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}/join/${code}`;
  const shareText = `היי לכולם! 👋 פתחתי לנו מרחב ב"קהילה מחוברת" – כל אחד מספר בקצרה במה הוא יכול לעזור, וכך קל למצוא מי בקבוצה יכול לעזור לנו (אינסטלטור, עצה מקצועית, השאלת ציוד ועוד). לוקח פחות מ-2 דקות:\n${link}`;

  return (
    <section className={`card overflow-hidden ${highlight ? "border-brand" : ""}`}>
      <button className="flex w-full items-center justify-between p-4 text-start" onClick={() => setOpen(!open)}>
        <span className="font-semibold">ניהול הקהילה</span>
        <span className="text-sm text-ink-2">{pct(stats.activationRate)} השלימו פרופיל {open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-line p-4">
          {highlight && <p className="rounded-lg bg-brand-soft p-3 text-sm text-brand">🎉 הקהילה „{communityName}” נוצרה! שתפו את הקישור בקבוצת הוואטסאפ.</p>}
          <div>
            <span className="label">קישור הזמנה</span>
            <div className="flex gap-2">
              <input readOnly value={link} dir="ltr" className="input min-w-0 flex-1 text-left text-sm" onFocus={(e) => e.target.select()} />
              <button
                className="btn-ghost shrink-0 px-3"
                onClick={async () => {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "הועתק ✓" : "העתקה"}
              </button>
            </div>
          </div>
          <a className="btn-wa w-full" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
            שיתוף בקבוצת הוואטסאפ
          </a>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            {[
              ["השלמת פרופיל", pct(stats.activationRate), `${stats.completed}/${stats.members}`],
              ["חיפוש → פנייה", pct(stats.searchToContactRate), `${stats.searches} חיפושים`],
              ["פעילים החודש", String(stats.mau), "MAU"],
              ["פניות החודש", String(stats.contacts30d), "וואטסאפ / טלפון"],
            ].map(([label, value, sub]) => (
              <div key={label} className="rounded-xl bg-surface-2 p-3">
                <div className="text-xl font-bold">{value}</div>
                <div className="text-xs font-medium">{label}</div>
                <div className="text-[11px] text-ink-2">{sub}</div>
              </div>
            ))}
          </div>
          <button
            className="text-xs text-ink-2 underline"
            onClick={async () => {
              if (!confirm("ליצור קישור חדש? הקישור הקודם יפסיק לעבוד.")) return;
              const r = await api<{ inviteCode: string }>(`/api/communities/${communityId}/invite`);
              setCode(r.inviteCode);
            }}
          >
            יצירת קישור חדש (ביטול הקודם)
          </button>
        </div>
      )}
    </section>
  );
}
