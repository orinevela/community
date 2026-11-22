import { z } from "zod";
import { error, handler, json, requireUser } from "@/lib/api";
import { logEvent, saveProfile, userCommunities } from "@/lib/repo";
import { CATEGORIES, CITIES, HELP_TYPES } from "@/lib/taxonomy";

const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  photo: z
    .string()
    .max(400_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
    .nullable(),
  city: z.string().refine((c) => CITIES.some((x) => x.name === c), "עיר לא מוכרת"),
  neighborhood: z.string().trim().max(60).default(""),
  radiusKm: z.number().int().min(1).max(100),
  about: z.string().trim().max(1000).default(""),
  helpTypes: z.array(z.enum(HELP_TYPES.map((h) => h.id) as [string, ...string[]])).max(3),
  contacts: z.object({
    whatsapp: z.boolean().optional(),
    phoneCall: z.boolean().optional(),
    linkedin: z.string().trim().max(200).optional(),
    email: z.string().trim().max(200).optional(),
    instagram: z.string().trim().max(100).optional(),
  }),
  availability: z.string().trim().max(120).default(""),
  skills: z
    .array(
      z.object({
        category: z.string().refine((c) => CATEGORIES.some((x) => x.id === c)),
        subcategory: z.string().trim().max(300).default(""),
        details: z.string().trim().max(500).default(""),
      }),
    )
    .min(1, "בחרו לפחות תחום אחד שבו תוכלו לעזור")
    .max(20),
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  const parsed = ProfileSchema.safeParse(await req.json());
  if (!parsed.success) return error(parsed.error.issues[0]?.message ?? "נתונים לא תקינים");
  const wasCompleted = user.profileCompleted;
  saveProfile(user.id, parsed.data as Parameters<typeof saveProfile>[1]);
  if (!wasCompleted) {
    for (const c of userCommunities(user.id)) logEvent("profile_completed", { communityId: c.id, userId: user.id });
  }
  return json({ ok: true });
});
