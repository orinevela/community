"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "./Avatar";
import { CATEGORIES } from "@/lib/taxonomy";

type M = { id: string; name: string; photo: string | null; city: string | null; skills: { category: string; subcategory: string }[] };

export function MemberDirectory({ communityId, members }: { communityId: string; members: M[] }) {
  const [cat, setCat] = useState<string | null>(null);
  const present = useMemo(() => CATEGORIES.filter((c) => members.some((m) => m.skills.some((s) => s.category === c.id))), [members]);
  const shown = cat ? members.filter((m) => m.skills.some((s) => s.category === cat)) : members;

  if (members.length === 0) {
    return <p className="text-center text-sm text-ink-2">עוד אין פרופילים אחרים בקהילה. שתפו את קישור ההזמנה!</p>;
  }

  return (
    <section className="space-y-3">
      <h2 className="font-semibold">עיון לפי תחום</h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <button className={`chip shrink-0 ${cat === null ? "chip-on" : ""}`} onClick={() => setCat(null)}>הכל ({members.length})</button>
        {present.map((c) => (
          <button key={c.id} className={`chip shrink-0 ${cat === c.id ? "chip-on" : ""}`} onClick={() => setCat(c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <ul className="card divide-y divide-line">
        {shown.map((m) => {
          const tags = m.skills
            .filter((s) => !cat || s.category === cat)
            .map((s) => s.subcategory || CATEGORIES.find((c) => c.id === s.category)?.label)
            .join(" · ");
          return (
            <li key={m.id}>
              <Link href={`/c/${communityId}/m/${m.id}`} className="flex items-center gap-3 p-3 hover:bg-surface-2/60">
                <Avatar name={m.name} photo={m.photo} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{m.name}</span>
                  <span className="block truncate text-sm text-ink-2">{tags}</span>
                </span>
                <span className="text-xs text-ink-2">{m.city}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
