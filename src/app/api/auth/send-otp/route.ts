import { sendOtp } from "@/lib/auth";
import { error, handler, json } from "@/lib/api";
import { normalizePhone } from "@/lib/taxonomy";

export const POST = handler(async (req: Request) => {
  const { phone } = await req.json();
  const normalized = normalizePhone(String(phone ?? ""));
  if (!normalized) return error("מספר טלפון לא תקין");
  const { devCode } = await sendOtp(normalized);
  return json({ ok: true, phone: normalized, devCode });
});
