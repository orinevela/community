"use client";
import { useState } from "react";
import { whatsappLink, type Contacts } from "@/lib/taxonomy";

type Props = {
  communityId: string;
  memberId: string;
  name: string;
  phone: string | null;
  contacts: Contacts;
  searchId?: number | null;
  icebreaker?: string;
  compact?: boolean;
};

function track(communityId: string, memberId: string, channel: string, searchId?: number | null) {
  const body = JSON.stringify({ memberId, channel, searchId });
  // sendBeacon survives the navigation to WhatsApp
  if (!navigator.sendBeacon?.(`/api/communities/${communityId}/contact`, new Blob([body], { type: "application/json" }))) {
    fetch(`/api/communities/${communityId}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true });
  }
}

export function ContactActions({ communityId, memberId, name, phone, contacts, searchId, icebreaker, compact }: Props) {
  const [sheet, setSheet] = useState(false);
  const first = name.split(" ")[0];
  const [msg, setMsg] = useState(icebreaker ?? `היי ${first}, הגעתי אליך דרך הקהילה. `);
  const wa = phone && contacts.whatsapp !== false;

  const extras: { label: string; href: string; channel: string }[] = [];
  if (phone && contacts.phoneCall) extras.push({ label: "📞 שיחה", href: `tel:${phone}`, channel: "phone" });
  if (contacts.email) extras.push({ label: "✉️ אימייל", href: `mailto:${contacts.email}`, channel: "email" });
  if (contacts.linkedin) extras.push({ label: "in לינקדאין", href: contacts.linkedin.startsWith("http") ? contacts.linkedin : `https://${contacts.linkedin}`, channel: "linkedin" });
  if (contacts.instagram) extras.push({ label: "📸 אינסטגרם", href: `https://instagram.com/${contacts.instagram.replace(/^@/, "")}`, channel: "instagram" });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {wa && (
          <button className={`btn-wa ${compact ? "flex-1 py-2.5" : "w-full"}`} onClick={() => setSheet(true)}>
            💬 שליחת הודעה בוואטסאפ
          </button>
        )}
        {!compact &&
          extras.map((x) => (
            <a key={x.channel} className="btn-ghost flex-1 py-2.5" href={x.href} target="_blank" rel="noopener noreferrer" onClick={() => track(communityId, memberId, x.channel, searchId)}>
              {x.label}
            </a>
          ))}
      </div>

      {sheet && wa && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setSheet(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-3xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`הודעה ל${first}`}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" />
            <h3 className="font-semibold">הודעת פתיחה ל{first}</h3>
            <p className="mb-3 text-sm text-ink-2">{icebreaker ? "הצעה מותאמת לחיפוש שלך – אפשר לערוך" : "כתבו הודעה קצרה"}</p>
            <textarea className="input min-h-32" value={msg} onChange={(e) => setMsg(e.target.value)} autoFocus />
            <div className="mt-3 flex gap-2">
              <a
                className="btn-wa flex-1"
                href={whatsappLink(phone!, msg)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  track(communityId, memberId, "whatsapp", searchId);
                  setSheet(false);
                }}
              >
                פתיחה בוואטסאפ
              </a>
              <button className="btn-ghost" onClick={() => setSheet(false)}>ביטול</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
