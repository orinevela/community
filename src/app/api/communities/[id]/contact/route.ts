import { error, handler, json, requireMember } from "@/lib/api";
import { getMember, logEvent } from "@/lib/repo";

/** Records a contact click (KPI: search-to-contact rate). */
export const POST = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await requireMember(id);
  const { memberId, searchId, channel } = await req.json();
  if (!getMember(id, String(memberId))) return error("חבר הקהילה לא נמצא", 404);
  logEvent("contact_click", {
    communityId: id,
    userId: user.id,
    ref: searchId ? String(searchId) : undefined,
    meta: { memberId, channel },
  });
  return json({ ok: true });
});
