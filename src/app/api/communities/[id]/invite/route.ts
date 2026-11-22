import { handler, json, requireMember } from "@/lib/api";
import { regenerateInvite } from "@/lib/repo";

export const POST = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await requireMember(id, { admin: true });
  return json({ inviteCode: regenerateInvite(id) });
});
