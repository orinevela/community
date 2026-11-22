import { error, handler, json, requireUser } from "@/lib/api";
import { createCommunity, logEvent } from "@/lib/repo";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const { name, description } = await req.json();
  const n = String(name ?? "").trim();
  if (n.length < 2 || n.length > 60) return error("שם הקהילה צריך להכיל 2-60 תווים");
  const c = createCommunity(user.id, n, String(description ?? "").trim().slice(0, 300));
  logEvent("join", { communityId: c.id, userId: user.id });
  if (user.profileCompleted) logEvent("profile_completed", { communityId: c.id, userId: user.id });
  return json({ ok: true, id: c.id });
});
