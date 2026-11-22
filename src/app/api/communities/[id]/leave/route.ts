import { handler, json, requireMember } from "@/lib/api";
import { leaveCommunity } from "@/lib/repo";

export const POST = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await requireMember(id);
  leaveCommunity(user.id, id);
  return json({ ok: true });
});
