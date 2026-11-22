import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { userCommunities } from "@/lib/repo";

export default async function Home() {
  const user = await currentUser();
  if (!user) return <Landing />;
  const communities = userCommunities(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">שלום{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</h1>
        <p className="mt-1 text-ink-2">הקהילות שלך</p>
      </div>

      {!user.profileCompleted && (
        <Link href="/profile" className="card flex items-center gap-3 border-accent/40 bg-accent-soft p-4">
          <span className="text-2xl" aria-hidden>✍️</span>
          <span className="flex-1">
            <span className="block font-semibold">השלימו את הפרופיל (פחות מ-2 דקות)</span>
            <span className="text-sm text-ink-2">כך חברי הקהילה ידעו במה תוכלו לעזור</span>
          </span>
          <span aria-hidden>←</span>
        </Link>
      )}

      {communities.length === 0 ? (
        <div className="card p-6 text-center">
          <p className="font-medium">עדיין לא הצטרפת לאף קהילה</p>
          <p className="mt-1 text-sm text-ink-2">קיבלת קישור הזמנה בקבוצת הוואטסאפ? פשוט לחצו עליו. או הקימו קהילה חדשה.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {communities.map((c) => (
            <li key={c.id}>
              <Link href={`/c/${c.id}`} className="card flex items-center gap-3 p-4 transition hover:border-brand/50">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-lg font-bold text-brand">{c.name[0]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{c.name}</span>
                  <span className="text-sm text-ink-2">
                    {c.memberCount} חברים{c.role === "admin" ? " · מנהל/ת" : ""}
                  </span>
                </span>
                <span className="text-ink-2" aria-hidden>←</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href="/communities/new" className="btn-ghost w-full">
        + הקמת קהילה חדשה
      </Link>
    </div>
  );
}

function Landing() {
  const examples = ["נשבר לי הברז במטבח, צריך עזרה דחופה", "מישהו בהייטק יכול להעביר קורות חיים?", "למי יש מקדחה להשאיל?"];
  return (
    <div className="space-y-8 pt-4">
      <section className="space-y-4">
        <h1 className="text-[32px] font-bold leading-tight">
          כל מה שהקהילה שלכם יודעת,
          <br />
          <span className="text-brand">במרחק חיפוש אחד.</span>
        </h1>
        <p className="text-lg text-ink-2">
          בקשות עזרה נבלעות בקבוצת הוואטסאפ. כאן כל חבר מספר במה הוא יכול לעזור, ומנוע חיפוש חכם מחבר בין הצורך שלכם לאדם הנכון בקהילה.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/login?next=/communities/new" className="btn-primary">
            הקמת קהילה לקבוצה שלי
          </Link>
          <Link href="/login" className="btn-ghost">
            כבר יש לי חשבון
          </Link>
        </div>
      </section>

      <section className="card space-y-3 p-5">
        <p className="text-sm font-medium text-ink-2">פשוט כותבים מה צריך:</p>
        {examples.map((e) => (
          <div key={e} className="rounded-xl bg-surface-2 px-4 py-3">
            “{e}”
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["🔗", "קישור אחד לקבוצה", "המנהל/ת יוצר/ת קהילה ומשתף/ת קישור הזמנה בוואטסאפ."],
          ["⚡", "פרופיל בשתי דקות", "בוחרים תחומים מרשימה ומוסיפים כמה מילים חופשיות."],
          ["💬", "מתחברים בוואטסאפ", "החיפוש מסביר למה כל אחד מתאים ומציע הודעת פתיחה."],
        ].map(([icon, title, text]) => (
          <div key={title} className="card p-4">
            <div className="text-2xl" aria-hidden>{icon}</div>
            <div className="mt-2 font-semibold">{title}</div>
            <div className="mt-1 text-sm text-ink-2">{text}</div>
          </div>
        ))}
      </section>
      <p className="text-center text-xs text-ink-2">הפרופילים גלויים רק לחברי אותה קהילה ואינם מופיעים במנועי חיפוש.</p>
    </div>
  );
}
