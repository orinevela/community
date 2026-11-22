import { handler, json, requireMember } from "@/lib/api";
import { setBioOverride } from "@/lib/repo";

export const PUT = handler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await requireMember(id);
  const { bio } = await req.json();
  setBioOverride(user.id, id, String(bio ?? "").trim().slice(0, 500));
  return json({ ok: true });
});
