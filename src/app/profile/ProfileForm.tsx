"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { api } from "@/lib/client";
import { CATEGORIES, CITIES, CONTACT_FIELDS, HELP_TYPES, RADIUS_OPTIONS, type Contacts, type HelpTypeId } from "@/lib/taxonomy";

type Skill = { category: string; subcategory: string; details: string };
type Initial = {
  name: string;
  photo: string | null;
  city: string;
  neighborhood: string;
  radiusKm: number;
  about: string;
  helpTypes: HelpTypeId[];
  contacts: Contacts;
  availability: string;
  skills: Skill[];
};

const AVAILABILITY_PRESETS = ["זמין/ה בוואטסאפ בשעות הערב", "בסופי שבוע", "בשעות העבודה", "גמיש/ה – תכתבו מתי שנוח"];

async function resizeImage(file: File, size = 320): Promise<string> {
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = Math.min(bmp.width, bmp.height);
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function ProfileForm({ initial, next, isNew }: { initial: Initial; next: string; isNew: boolean }) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof Initial>(k: K, v: Initial[K]) => setP((x) => ({ ...x, [k]: v }));
  const skillFor = (cat: string) => p.skills.find((s) => s.category === cat);
  const subsOf = (s?: Skill) => (s?.subcategory ? s.subcategory.split(",").map((x) => x.trim()).filter(Boolean) : []);

  function toggleCategory(cat: string) {
    if (skillFor(cat)) {
      if (open === cat) {
        set("skills", p.skills.filter((s) => s.category !== cat));
        setOpen(null);
      } else setOpen(cat);
    } else {
      set("skills", [...p.skills, { category: cat, subcategory: "", details: "" }]);
      setOpen(cat);
    }
  }

  function updateSkill(cat: string, patch: Partial<Skill>) {
    set("skills", p.skills.map((s) => (s.category === cat ? { ...s, ...patch } : s)));
  }

  function toggleSub(cat: string, sub: string) {
    const subs = subsOf(skillFor(cat));
    const nextSubs = subs.includes(sub) ? subs.filter((x) => x !== sub) : [...subs, sub];
    updateSkill(cat, { subcategory: nextSubs.join(", ") });
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) set("photo", await resizeImage(f));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!p.city) return setErr("בחרו עיר / יישוב");
    if (p.skills.length === 0) return setErr("בחרו לפחות תחום אחד שבו תוכלו לעזור");
    setBusy(true);
    try {
      await api("/api/profile", p, "PUT");
      router.replace(next);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {/* 1. Basics */}
      <section className="card space-y-4 p-4">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()} className="relative" aria-label="העלאת תמונת פרופיל">
            <Avatar name={p.name || "?"} photo={p.photo} size={72} />
            <span className="absolute -bottom-1 -left-1 grid h-7 w-7 place-items-center rounded-full border-2 border-surface bg-brand text-sm text-brand-ink">
              📷
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
          <div className="flex-1">
            <label className="label" htmlFor="name">שם מלא</label>
            <input id="name" className="input" value={p.name} onChange={(e) => set("name", e.target.value)} required minLength={2} maxLength={60} />
          </div>
        </div>
        {!p.photo && <p className="text-xs text-ink-2">💡 פרופיל עם תמונה מעורר הרבה יותר אמון.</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="city">עיר / יישוב</label>
            <select id="city" className="input" value={p.city} onChange={(e) => set("city", e.target.value)} required>
              <option value="">בחירה…</option>
              {[...CITIES].sort((a, b) => a.name.localeCompare(b.name, "he")).map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="hood">שכונה (רשות)</label>
            <input id="hood" className="input" value={p.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} maxLength={60} />
          </div>
        </div>
        <div>
          <span className="label">באיזה רדיוס אשמח לעזור פיזית?</span>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button type="button" key={r} className={`chip ${p.radiusKm === r ? "chip-on" : ""}`} onClick={() => set("radiusKm", r)}>
                {r} ק״מ
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. How can I help */}
      <section className="card space-y-3 p-4">
        <div>
          <h2 className="font-semibold">במה אני יכול/ה לעזור?</h2>
          <p className="text-sm text-ink-2">בחרו תחומים, ואז פרטו במילים שלכם. אפשר כמה.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button type="button" key={c.id} className={`chip ${skillFor(c.id) ? "chip-on" : ""}`} onClick={() => toggleCategory(c.id)}>
              <span aria-hidden>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>

        {p.skills.map((s) => {
          const cat = CATEGORIES.find((c) => c.id === s.category)!;
          const expanded = open === s.category;
          return (
            <div key={s.category} className="rounded-xl border border-line bg-surface-2/60 p-3">
              <button type="button" className="flex w-full items-center justify-between text-start" onClick={() => setOpen(expanded ? null : s.category)}>
                <span className="font-medium">
                  {cat.emoji} {cat.label}
                  {!expanded && subsOf(s).length > 0 && <span className="text-sm font-normal text-ink-2"> · {s.subcategory}</span>}
                </span>
                <span className="text-ink-2" aria-hidden>{expanded ? "▴" : "▾"}</span>
              </button>
              {expanded && (
                <div className="mt-3 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subs.map((sub) => (
                      <button type="button" key={sub} className={`chip text-[13px] ${subsOf(s).includes(sub) ? "chip-on" : ""}`} onClick={() => toggleSub(s.category, sub)}>
                        {sub}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="input min-h-20"
                    placeholder={s.category === "career" ? "למשל: מנהל מוצר בחברת X, אשמח להעביר קו״ח או לייעץ" : s.category === "lending" ? "למשל: יש לי מקדחה וסולם להשאלה בכיף" : "פרטו קצת: ניסיון, מה בדיוק, באילו תנאים…"}
                    value={s.details}
                    maxLength={500}
                    onChange={(e) => updateSkill(s.category, { details: e.target.value })}
                  />
                  <button type="button" className="text-sm text-danger" onClick={() => { set("skills", p.skills.filter((x) => x.category !== s.category)); setOpen(null); }}>
                    הסרת התחום
                  </button>
                </div>
              )}
            </div>
          );
        })}

        <div>
          <label className="label" htmlFor="about">עוד משהו שכדאי שהקהילה תדע? (רשות)</label>
          <textarea id="about" className="input min-h-20" value={p.about} maxLength={1000} onChange={(e) => set("about", e.target.value)} placeholder="כמה מילים עליך, תחביבים, דברים שתשמחו לעזור בהם…" />
        </div>

        <div>
          <span className="label">סוג העזרה</span>
          <div className="flex flex-wrap gap-2">
            {HELP_TYPES.map((h) => {
              const on = p.helpTypes.includes(h.id);
              return (
                <button type="button" key={h.id} className={`chip ${on ? "chip-on" : ""}`} onClick={() => set("helpTypes", on ? p.helpTypes.filter((x) => x !== h.id) : [...p.helpTypes, h.id])}>
                  {h.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Contact */}
      <section className="card space-y-4 p-4">
        <h2 className="font-semibold">איך ליצור איתי קשר?</h2>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block font-medium">💬 כפתור וואטסאפ</span>
            <span className="text-sm text-ink-2">לפי המספר המאומת שלך (מומלץ)</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={p.contacts.whatsapp !== false} onChange={(e) => set("contacts", { ...p.contacts, whatsapp: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="font-medium">📞 שיחת טלפון</span>
          <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={!!p.contacts.phoneCall} onChange={(e) => set("contacts", { ...p.contacts, phoneCall: e.target.checked })} />
        </label>
        {CONTACT_FIELDS.filter((f) => f.id !== "phoneCall").map((f) => (
          <div key={f.id}>
            <label className="label" htmlFor={f.id}>{f.label} (רשות)</label>
            <input
              id={f.id}
              className="input text-left"
              dir="ltr"
              placeholder={f.placeholder}
              value={(p.contacts[f.id as "linkedin" | "email" | "instagram"] as string) ?? ""}
              onChange={(e) => set("contacts", { ...p.contacts, [f.id]: e.target.value })}
            />
          </div>
        ))}
        <div>
          <label className="label" htmlFor="avail">זמינות</label>
          <input id="avail" className="input" value={p.availability} maxLength={120} onChange={(e) => set("availability", e.target.value)} placeholder="למשל: זמין בוואטסאפ בשעות הערב" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {AVAILABILITY_PRESETS.map((a) => (
              <button type="button" key={a} className="chip text-[13px]" onClick={() => set("availability", a)}>
                {a}
              </button>
            ))}
          </div>
        </div>
      </section>

      {err && <p className="text-sm text-danger">{err}</p>}
      <div className="sticky bottom-3 z-10">
        <button className="btn-primary w-full shadow-lg" disabled={busy}>
          {busy ? "שומר…" : isNew ? "סיום והצטרפות לקהילה" : "שמירה"}
        </button>
      </div>
    </form>
  );
}
