import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { communityStats, getCommunity, listMembers, logEvent, membership, publicMember } from "@/lib/repo";
import { aiEnabled } from "@/lib/search";
import { SearchPanel } from "@/components/SearchPanel";
import { MemberDirectory } from "@/components/MemberDirectory";
import { InvitePanel } from "@/components/InvitePanel";

export default async function CommunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/c/${id}`);
  const community = getCommunity(id);
  if (!community) notFound();
  const m = membership(user.id, id);
  if (!m) notFound(); // profiles are visible to verified members only
  logEvent("visit", { communityId: id, userId: user.id });

  const all = listMembers(id);
  const members = all.filter((x) => x.profileCompleted && x.id !== user.id).map(publicMember);
  const isAdmin = m.role === "admin";
  const stats = isAdmin ? communityStats(id) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{community.name}</h1>
          <p className="text-sm text-ink-2">{all.length} חברים · {members.length + (user.profileCompleted ? 1 : 0)} עם פרופיל</p>
        </div>
        {isAdmin && <span className="chip chip-on shrink-0 text-xs">מנהל/ת</span>}
      </div>

      {!user.profileCompleted && (
        <Link href={`/profile?next=/c/${id}`} className="card flex items-center gap-3 border-accent/40 bg-accent-soft p-4">
          <span className="text-2xl" aria-hidden>✍️</span>
          <span className="flex-1 text-sm"><b>הפרופיל שלך עדיין לא מופיע לקהילה.</b> השלימו אותו כדי שיוכלו למצוא אתכם.</span>
        </Link>
      )}

      {isAdmin && <InvitePanel communityId={id} inviteCode={community.inviteCode} communityName={community.name} highlight={created === "1"} stats={stats!} />}

      <SearchPanel communityId={id} aiEnabled={aiEnabled()} />

      <MemberDirectory communityId={id} members={members} />
    </div>
  );
}
