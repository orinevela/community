"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ phone: string; devCode?: string }>("/api/auth/send-otp", { phone });
      setPhone(r.phone);
      setDevCode(r.devCode ?? null);
      setStep("code");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ profileCompleted: boolean }>("/api/auth/verify", { phone, code });
      const dest = r.profileCompleted || next.startsWith("/join/") ? next : `/profile?next=${encodeURIComponent(next)}`;
      router.replace(dest);
      router.refresh();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return step === "phone" ? (
    <form onSubmit={sendCode} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">מספר טלפון</label>
        <input
          id="phone"
          className="input text-left"
          dir="ltr"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="050-1234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoFocus
        />
      </div>
      {err && <p className="text-sm text-danger">{err}</p>}
      <button className="btn-primary w-full" disabled={busy || phone.length < 9}>
        {busy ? "שולח…" : "שלחו לי קוד"}
      </button>
      <p className="text-center text-xs text-ink-2">כניסה עם Google / Apple תתווסף בהמשך</p>
    </form>
  ) : (
    <form onSubmit={verify} className="space-y-4">
      <div>
        <label className="label" htmlFor="code">הקוד שנשלח אל <span dir="ltr">{phone}</span></label>
        <input
          id="code"
          className="input text-center text-2xl tracking-[0.5em]"
          dir="ltr"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
          autoFocus
        />
      </div>
      {devCode && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
          מצב פיתוח (אין ספק SMS מוגדר): הקוד הוא <b dir="ltr">{devCode}</b>
        </p>
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
      <button className="btn-primary w-full" disabled={busy || code.length !== 6}>
        {busy ? "מאמת…" : "כניסה"}
      </button>
      <button type="button" className="w-full text-sm text-ink-2 underline" onClick={() => setStep("phone")}>
        שינוי מספר
      </button>
    </form>
  );
}
