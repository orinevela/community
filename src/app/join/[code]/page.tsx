import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCommunityByInvite, listMembers, membership } from "@/lib/repo";
import { JoinButton } from "./JoinButton";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const community = getCommunityByInvite(code);
  if (!community) {
    return (
      <div className="card p-6 text-center">
        <h1 className="text-xl font-bold">הקישור אינו תקף</h1>
        <p className="mt-2 text-ink-2">ייתכן שמנהל/ת הקהילה יצר/ה קישור חדש. בקשו אותו בקבוצה.</p>
      </div>
    );
  }
  const user = await currentUser();
  if (user && membership(user.id, community.id)) redirect(`/c/${community.id}`);
  const count = listMembers(community.id).length;

  return (
    <div className="space-y-6 pt-4 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-4xl font-bold text-brand">{community.name[0]}</div>
      <div>
        <p className="text-ink-2">הוזמנת להצטרף אל</p>
        <h1 className="mt-1 text-3xl font-bold">{community.name}</h1>
        {community.description && <p className="mt-2 text-ink-2">{community.description}</p>}
        <p className="mt-3 text-sm text-ink-2">{count} חברים כבר כאן</p>
      </div>
      <div className="card space-y-2 p-4 text-start text-sm">
        <p>✅ מספרים במה אתם יכולים לעזור – פחות מ-2 דקות</p>
        <p>🔎 מוצאים בקלות מי בקהילה יכול לעזור לכם</p>
        <p>🔒 הפרופיל גלוי רק לחברי הקהילה</p>
      </div>
      {user ? (
        <JoinButton code={code} />
      ) : (
        <Link href={`/login?next=${encodeURIComponent(`/join/${code}`)}`} className="btn-primary w-full">
          הצטרפות לקהילה
        </Link>
      )}
    </div>
  );
}
