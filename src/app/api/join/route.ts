import { error, handler, json, requireUser } from "@/lib/api";
import { getCommunityByInvite, joinCommunity, logEvent } from "@/lib/repo";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const { code } = await req.json();
  const community = getCommunityByInvite(String(code ?? ""));
  if (!community) return error("קישור ההזמנה אינו תקף", 404);
  if (joinCommunity(user.id, community.id)) {
    logEvent("join", { communityId: community.id, userId: user.id });
    if (user.profileCompleted) logEvent("profile_completed", { communityId: community.id, userId: user.id });
  }
  return json({ ok: true, communityId: community.id, profileCompleted: user.profileCompleted });
});
