import { error, handler, json, requireMember } from "@/lib/api";
import { listMembers, logEvent, publicMember } from "@/lib/repo";
import { searchCommunity } from "@/lib/search";

export const POST = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await requireMember(id);
  const { query } = await req.json();
  const q = String(query ?? "").trim();
  if (q.length < 2) return error("ספרו לנו במה אתם צריכים עזרה");
  if (q.length > 500) return error("הבקשה ארוכה מדי");

  const started = Date.now();
  const members = listMembers(id, { onlyCompleted: true });
  const res = await searchCommunity(members, user, q);
  const byId = new Map(members.map((m) => [m.id, m]));
  const searchId = logEvent("search", {
    communityId: id,
    userId: user.id,
    meta: { q, engine: res.engine, results: res.results.length, ms: Date.now() - started },
  });

  return json({
    searchId,
    engine: res.engine,
    interpretedNeed: res.interpretedNeed,
    results: res.results.map((r) => {
      const m = byId.get(r.memberId)!;
      return {
        ...r,
        member: publicMember(m),
      };
    }),
  });
});
