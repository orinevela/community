import { createSession, findOrCreateUserByPhone, verifyOtp } from "@/lib/auth";
import { error, handler, json } from "@/lib/api";
import { getUser } from "@/lib/repo";
import { normalizePhone } from "@/lib/taxonomy";

export const POST = handler(async (req: Request) => {
  const { phone, code } = await req.json();
  const normalized = normalizePhone(String(phone ?? ""));
  if (!normalized || !verifyOtp(normalized, String(code ?? ""))) return error("הקוד שגוי או שפג תוקפו");
  const userId = findOrCreateUserByPhone(normalized);
  await createSession(userId);
  return json({ ok: true, profileCompleted: getUser(userId)!.profileCompleted });
});
