import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getCommunity, getMember, membership, publicMember } from "@/lib/repo";
import { CATEGORIES, HELP_TYPES } from "@/lib/taxonomy";
import { Avatar } from "@/components/Avatar";
import { ContactActions } from "@/components/ContactActions";
import { BioOverride } from "@/components/BioOverride";

export default async function MemberPage({ params, searchParams }: { params: Promise<{ id: string; userId: string }>; searchParams: Promise<{ s?: string }> }) {
  const { id, userId } = await params;
  const { s } = await searchParams;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/c/${id}/m/${userId}`);
  if (!membership(user.id, id)) notFound();
  const community = getCommunity(id)!;
  const raw = getMember(id, userId);
  if (!raw || (!raw.profileCompleted && raw.id !== user.id)) notFound();
  const m = publicMember(raw);
  const isMe = user.id === m.id;

  return (
    <div className="space-y-5">
      <Link href={`/c/${id}`} className="text-sm text-ink-2">→ {community.name}</Link>
      <div className="flex items-center gap-4">
        <Avatar name={m.name} photo={m.photo} size={84} />
        <div>
          <h1 className="text-2xl font-bold">{m.name}</h1>
          <p className="text-ink-2">{[m.neighborhood, m.city].filter(Boolean).join(", ")}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {m.helpTypes.map((h) => (
              <span key={h} className="rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">{HELP_TYPES.find((x) => x.id === h)?.label}</span>
            ))}
          </div>
        </div>
      </div>

      {!isMe && (
        <ContactActions communityId={id} memberId={m.id} name={m.name} phone={m.phone} contacts={m.contacts} searchId={s ? Number(s) : null} />
      )}
      {m.availability && <p className="text-sm text-ink-2">🕒 {m.availability}</p>}

      {(m.bioOverride || m.about) && (
        <section className="card space-y-2 p-4">
          {m.bioOverride && <p className="whitespace-pre-line">{m.bioOverride}</p>}
          {m.about && <p className="whitespace-pre-line text-ink-2">{m.about}</p>}
        </section>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold">יכול/ה לעזור ב:</h2>
        {m.skills.map((sk) => {
          const c = CATEGORIES.find((x) => x.id === sk.category);
          return (
            <div key={sk.category} className="card p-4">
              <div className="font-medium">{c?.emoji} {c?.label}</div>
              {sk.subcategory && <div className="mt-1 text-sm text-brand">{sk.subcategory}</div>}
              {sk.details && <p className="mt-2 whitespace-pre-line text-[15px] text-ink-2">{sk.details}</p>}
            </div>
          );
        })}
      </section>

      {isMe && (
        <section className="space-y-3">
          <BioOverride communityId={id} initial={m.bioOverride} />
          <Link href={`/profile?next=/c/${id}/m/${m.id}`} className="btn-ghost w-full">עריכת הפרופיל</Link>
        </section>
      )}
    </div>
  );
}
